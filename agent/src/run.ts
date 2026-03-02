import { Transaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createBurnInstruction, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import * as PumpSwap from "@pump-fun/pump-swap-sdk";
import { config, agent, connection } from "./config.js";
import { saveAgentCycle, type FeedEntry } from "./db.js";
import { generateThought } from "./thought.js";
import {
  sleep,
  sendAndConfirm,
  getTokenBalance,
  getAgentTokenAta,
  appendV2Account,
  bondingCurveV2Pda,
  poolV2Pda,
  PUMP_PROGRAM_ID,
  PUMP_AMM_PROGRAM_ID,
} from "./helpers.js";

const agentTokenAta = getAgentTokenAta(agent.publicKey, config.mint);

async function getCreatorVaultBalance(): Promise<number> {
  try {
    const bal = await connection.getBalance(
      PublicKey.findProgramAddressSync(
        [Buffer.from("creator-vault"), config.mint.toBuffer()],
        PUMP_PROGRAM_ID,
      )[0],
    );
    return bal / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

async function isTokenMigrated(): Promise<boolean> {
  try {
    const poolKey = PumpSwap.getPoolPda(config.mint);
    const acc = await connection.getAccountInfo(poolKey);
    return acc !== null;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════
// CLAIM FEES
// ═══════════════════════════════════════

async function claimFees(): Promise<{ sol: number; sig: string } | null> {
  const vaultBal = await getCreatorVaultBalance();
  if (vaultBal < 0.005) {
    console.log(`[claim] Vault: ${vaultBal.toFixed(4)} SOL — too low, skipping`);
    return null;
  }

  console.log(`[claim] Vault: ${vaultBal.toFixed(4)} SOL — claiming...`);

  const pumpSdk = new PumpSwap.PumpAmmSdk();
  const ix = pumpSdk.collectCoinCreatorFeeInstructions({
    creator: agent.publicKey,
    mint: config.mint,
  });

  const tx = new Transaction().add(...ix);
  const sig = await sendAndConfirm(connection, tx, agent);
  console.log(`[claim] Claimed ${vaultBal.toFixed(4)} SOL — tx: ${sig}`);

  return { sol: vaultBal, sig };
}

// ═══════════════════════════════════════
// BUYBACK (pre-migration: 100% of fees)
// ═══════════════════════════════════════

async function doBuyback(solAmount: number): Promise<{ sig: string; tokens: bigint }> {
  const solBn = new BN(Math.floor(solAmount * LAMPORTS_PER_SOL));
  const migrated = await isTokenMigrated();

  let sig: string;

  if (migrated) {
    console.log("[buyback] Token is migrated — buying via AMM");
    const pumpAmmSdk = new PumpSwap.PumpAmmSdk();
    const poolKey = PumpSwap.getPoolPda(config.mint);
    const swapState = await pumpAmmSdk.swapSolanaState(connection, poolKey, agent.publicKey);
    const buyIx = pumpAmmSdk.buyQuoteInput(swapState, solBn, 2);
    appendV2Account(buyIx, PUMP_AMM_PROGRAM_ID, poolV2Pda(config.mint));
    const tx = new Transaction().add(...buyIx);
    sig = await sendAndConfirm(connection, tx, agent);
  } else {
    console.log("[buyback] Token on bonding curve — buying via curve");
    // Use PumpPortal API or direct bonding curve interaction
    // For bonding curve, we need the pump SDK
    const pumpAmmSdk = new PumpSwap.PumpAmmSdk();
    const poolKey = PumpSwap.getPoolPda(config.mint);
    const swapState = await pumpAmmSdk.swapSolanaState(connection, poolKey, agent.publicKey);
    const buyIx = pumpAmmSdk.buyQuoteInput(swapState, solBn, 2);
    appendV2Account(buyIx, PUMP_AMM_PROGRAM_ID, poolV2Pda(config.mint));
    const tx = new Transaction().add(...buyIx);
    sig = await sendAndConfirm(connection, tx, agent);
  }

  await sleep(3000);
  const balance = await getTokenBalance(connection, agentTokenAta);
  console.log(`[buyback] Bought tokens — balance: ${balance.toString()}, tx: ${sig}`);

  return { sig, tokens: balance };
}

// ═══════════════════════════════════════
// BURN (after buyback)
// ═══════════════════════════════════════

async function doBurn(): Promise<{ sig: string; burned: bigint } | null> {
  let balance = await getTokenBalance(connection, agentTokenAta);
  if (balance === BigInt(0)) {
    await sleep(3000);
    balance = await getTokenBalance(connection, agentTokenAta);
  }

  if (balance === BigInt(0)) {
    console.log("[burn] No tokens to burn");
    return null;
  }

  const burnIx = createBurnInstruction(
    agentTokenAta,
    config.mint,
    agent.publicKey,
    balance,
    [],
    TOKEN_2022_PROGRAM_ID,
  );
  const sig = await sendAndConfirm(connection, new Transaction().add(burnIx), agent);
  console.log(`[burn] Burned ${balance.toString()} tokens — tx: ${sig}`);

  return { sig, burned: balance };
}

// ═══════════════════════════════════════
// ADD LP (post-migration: 100% of fees)
// ═══════════════════════════════════════

async function doAddLp(solAmount: number): Promise<{ buySig: string; lpSig: string }> {
  const poolKey = PumpSwap.getPoolPda(config.mint);
  const pumpAmmSdk = new PumpSwap.PumpAmmSdk();

  // Step 1: Buy tokens with 65% of LP amount
  const buySol = solAmount * 0.65;
  const depositSol = solAmount * 0.35;

  console.log(`[lp] Buying tokens with ${buySol.toFixed(4)} SOL...`);
  const solBn = new BN(Math.floor(buySol * LAMPORTS_PER_SOL));
  const swapState = await pumpAmmSdk.swapSolanaState(connection, poolKey, agent.publicKey);
  const buyIx = pumpAmmSdk.buyQuoteInput(swapState, solBn, 5);
  appendV2Account(buyIx, PUMP_AMM_PROGRAM_ID, poolV2Pda(config.mint));
  const buyTx = new Transaction().add(...buyIx);
  const buySig = await sendAndConfirm(connection, buyTx, agent);
  console.log(`[lp] Buy tx: ${buySig}`);

  await sleep(4000);

  // Step 2: Deposit LP (35% SOL + bought tokens)
  console.log(`[lp] Depositing LP with ${depositSol.toFixed(4)} SOL...`);
  const liquidityState = await pumpAmmSdk.liquiditySolanaState(connection, poolKey, agent.publicKey);
  const quoteAmount = new BN(Math.floor(depositSol * LAMPORTS_PER_SOL));

  const { lpToken } = pumpAmmSdk.depositAutocompleteBaseAndLpTokenFromQuote(
    liquidityState,
    quoteAmount,
    10,
  );

  const depositIx = pumpAmmSdk.depositInstructions(liquidityState, lpToken, 10);
  appendV2Account(depositIx, PUMP_AMM_PROGRAM_ID, poolV2Pda(config.mint));
  const tx = new Transaction().add(...depositIx);
  const lpSig = await sendAndConfirm(connection, tx, agent);
  console.log(`[lp] Deposit tx: ${lpSig}`);

  return { buySig, lpSig };
}

// ═══════════════════════════════════════
// MAIN CYCLE
// ═══════════════════════════════════════

export async function runCycle(): Promise<void> {
  console.log("\n══════════════════════════════════════");
  console.log(`[cycle] ${new Date().toISOString()}`);
  console.log("══════════════════════════════════════");

  const feed: FeedEntry[] = [];
  let claimed = 0;
  let boughtBack = 0;
  let burned = 0;
  let lpSol = 0;
  let action = "scan";

  try {
    // Step 1: Claim fees
    const claimResult = await claimFees();
    if (!claimResult) {
      // Nothing to claim — generate monitoring thought and save
      const thought = await generateThought({ claimed: 0, boughtBack: 0, burned: 0, lpSol: 0, action: "scan" });
      feed.push({ type: "thought", text: thought, timestamp: new Date().toISOString() });
      await saveAgentCycle({ claimed: 0, boughtBack: 0, burned: 0, lpSol: 0, thought, thoughtMeta: "monitoring", feed });
      return;
    }

    claimed = claimResult.sol;
    feed.push({
      type: "claim",
      text: `Claimed ${claimed.toFixed(4)} SOL from fee vault`,
      amount: claimed,
      timestamp: new Date().toISOString(),
      txSig: claimResult.sig,
    });

    const migrated = await isTokenMigrated();

    if (migrated) {
      // Post-migration: 100% to LP
      action = "lp";
      console.log("[cycle] Post-migration — adding LP");
      const lpResult = await doAddLp(claimed);
      lpSol = claimed;
      feed.push({
        type: "lp",
        text: `Added ${claimed.toFixed(4)} SOL to liquidity pool`,
        amount: claimed,
        timestamp: new Date().toISOString(),
        txSig: lpResult.lpSig,
      });
    } else {
      // Pre-migration: 100% buyback + burn
      action = "buyback";
      console.log("[cycle] Pre-migration — buyback + burn");
      const buyResult = await doBuyback(claimed);
      boughtBack = claimed;
      feed.push({
        type: "buyback",
        text: `Bought ${buyResult.tokens.toString()} tokens for ${claimed.toFixed(4)} SOL`,
        amount: claimed,
        timestamp: new Date().toISOString(),
        txSig: buyResult.sig,
      });

      const burnResult = await doBurn();
      if (burnResult) {
        burned = Number(burnResult.burned);
        feed.push({
          type: "burn",
          text: `Burned ${burnResult.burned.toString()} tokens`,
          amount: burned,
          timestamp: new Date().toISOString(),
          txSig: burnResult.sig,
        });
      }
    }

    // Generate thought
    const thought = await generateThought({ claimed, boughtBack, burned, lpSol, action });
    feed.push({ type: "thought", text: thought, timestamp: new Date().toISOString() });

    // Save to Supabase
    await saveAgentCycle({ claimed, boughtBack, burned, lpSol, thought, thoughtMeta: action, feed });

    console.log(`[cycle] Done. claimed=${claimed}, action=${action}`);
  } catch (err: any) {
    console.error("[cycle] Error:", err.message ?? err);
    const thought = `Error during cycle: ${(err.message ?? "unknown").slice(0, 100)}`;
    feed.push({ type: "thought", text: thought, timestamp: new Date().toISOString() });
    await saveAgentCycle({ claimed, boughtBack, burned, lpSol, thought, thoughtMeta: "error", feed });
  }
}
