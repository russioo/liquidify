import { createRequire } from "node:module";
import { Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import { config, agent, connection } from "./config.js";
import { saveAgentCycle, type FeedEntry } from "./db.js";
import { generateThought } from "./thought.js";
import {
  sleep,
  sendAndConfirm,
  getTokenBalance,
  getSolBalance,
  getAgentTokenAta,
  appendV2Account,
  poolV2Pda,
  PUMP_AMM_PROGRAM_ID,
} from "./helpers.js";

const _require = createRequire(import.meta.url);
const Pump = _require("@pump-fun/pump-sdk");
const PumpSwap = _require("@pump-fun/pump-swap-sdk");

const SOL_RESERVE = 0.02;
const MIN_VAULT = 0.01;

const agentTokenAta = getAgentTokenAta(agent.publicKey, config.mint);
const pumpOnline = new Pump.OnlinePumpSdk(connection);
const pumpOffline = new Pump.PumpSdk();
const pumpAmmOnline = new PumpSwap.OnlinePumpAmmSdk(connection);
const pumpAmmOffline = new PumpSwap.PumpAmmSdk();

// ═══════════════════════════════════════
// DETECT MIGRATION
// ═══════════════════════════════════════

async function isTokenMigrated(): Promise<boolean> {
  try {
    const feeResult = await pumpOnline.getMinimumDistributableFee(config.mint);
    return feeResult.isGraduated;
  } catch {
    try {
      const poolKey = PumpSwap.canonicalPumpPoolPda(config.mint);
      const poolInfo = await connection.getAccountInfo(poolKey);
      return poolInfo !== null;
    } catch {
      return false;
    }
  }
}

// ═══════════════════════════════════════
// CLAIM FEES
// ═══════════════════════════════════════

async function claimFees(): Promise<{ sol: number; sig: string } | null> {
  const bal = await pumpOnline.getCreatorVaultBalanceBothPrograms(agent.publicKey);
  const vaultSol = bal.toNumber() / LAMPORTS_PER_SOL;

  if (vaultSol < MIN_VAULT) {
    console.log(`[claim] Vault: ${vaultSol.toFixed(4)} SOL — below ${MIN_VAULT}, skipping`);
    return null;
  }

  console.log(`[claim] Vault: ${vaultSol.toFixed(4)} SOL — claiming...`);

  const solBefore = await getSolBalance(connection, agent.publicKey);

  const ix = await pumpOnline.collectCoinCreatorFeeInstructions(agent.publicKey, agent.publicKey);
  const tx = new Transaction().add(...ix);
  const sig = await sendAndConfirm(connection, tx, agent);

  const solAfter = await getSolBalance(connection, agent.publicKey);
  const actualClaimed = (solAfter - solBefore) / LAMPORTS_PER_SOL;

  if (actualClaimed <= 0) {
    console.log(`[claim] TX confirmed but no SOL increase — skipping`);
    return null;
  }

  console.log(`[claim] Claimed ${actualClaimed.toFixed(4)} SOL — tx: ${sig}`);
  return { sol: actualClaimed, sig };
}

function getSpendable(walletLamports: number, claimed: number): number {
  const walletSol = walletLamports / LAMPORTS_PER_SOL;
  const spendable = walletSol - SOL_RESERVE;
  if (spendable <= 0) return 0;
  return Math.min(claimed, spendable);
}

// ═══════════════════════════════════════
// BUYBACK — bonding curve (pre-migration)
// ═══════════════════════════════════════

async function doBuyback(solAmount: number): Promise<{ sig: string; tokens: bigint }> {
  const tokensBefore = await getTokenBalance(connection, agentTokenAta);

  const solBn = new BN(Math.floor(solAmount * LAMPORTS_PER_SOL));

  const global = await pumpOnline.fetchGlobal();
  const { bondingCurveAccountInfo, bondingCurve, associatedUserAccountInfo } =
    await pumpOnline.fetchBuyState(config.mint, agent.publicKey, TOKEN_2022_PROGRAM_ID);

  const tokenAmount = Pump.getBuyTokenAmountFromSolAmount({
    global,
    feeConfig: null,
    mintSupply: bondingCurve.tokenTotalSupply,
    bondingCurve,
    amount: solBn,
  });

  console.log(`[buyback] ${solAmount.toFixed(4)} SOL → ~${tokenAmount.toString()} tokens`);

  const buyIx = await pumpOffline.buyInstructions({
    global,
    bondingCurveAccountInfo,
    bondingCurve,
    associatedUserAccountInfo,
    mint: config.mint,
    user: agent.publicKey,
    amount: tokenAmount,
    solAmount: solBn,
    slippage: 2,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
  });

  const tx = new Transaction().add(...buyIx);
  const sig = await sendAndConfirm(connection, tx, agent);

  await sleep(3000);
  const tokensAfter = await getTokenBalance(connection, agentTokenAta);
  const newTokens = tokensAfter > tokensBefore ? tokensAfter - tokensBefore : BigInt(0);
  console.log(`[buyback] Bought ${newTokens.toString()} tokens — tx: ${sig}`);

  return { sig, tokens: newTokens };
}

// ═══════════════════════════════════════
// ADD LP (post-migration)
// ═══════════════════════════════════════

async function doAddLp(solAmount: number): Promise<{ buySig: string; lpSig: string }> {
  const poolKey = PumpSwap.canonicalPumpPoolPda(config.mint);

  // Tx 1 — buy tokens with 65% of SOL
  const buySol = solAmount * 0.65;
  const buySolBn = new BN(Math.floor(buySol * LAMPORTS_PER_SOL));

  console.log(`[lp] Buying tokens with ${buySol.toFixed(4)} SOL...`);
  const swapState = await pumpAmmOnline.swapSolanaState(poolKey, agent.publicKey);
  const buyIx = await pumpAmmOffline.buyQuoteInput(swapState, buySolBn, 5);
  const buySig = await sendAndConfirm(connection, new Transaction().add(...buyIx), agent);
  console.log(`[lp] Buy tx: ${buySig}`);

  await sleep(4000);

  // Tx 2 — deposit SOL + tokens as LP (35% of SOL)
  const depositSol = solAmount * 0.35;
  const depositSolBn = new BN(Math.floor(depositSol * LAMPORTS_PER_SOL));

  console.log(`[lp] Depositing LP with ${depositSol.toFixed(4)} SOL...`);
  const liquidityState = await pumpAmmOnline.liquiditySolanaState(poolKey, agent.publicKey);

  const { lpToken } = pumpAmmOffline.depositAutocompleteBaseAndLpTokenFromQuote(
    liquidityState,
    depositSolBn,
    10,
  );

  const depositIx = await pumpAmmOffline.depositInstructions(liquidityState, lpToken, 10);
  appendV2Account(depositIx, PUMP_AMM_PROGRAM_ID, poolV2Pda(config.mint));
  const lpSig = await sendAndConfirm(connection, new Transaction().add(...depositIx), agent);
  console.log(`[lp] Deposit tx: ${lpSig}`);

  return { buySig, lpSig };
}

// ═══════════════════════════════════════
// MAIN CYCLE
// ═══════════════════════════════════════

let cycleRunning = false;

export async function runCycle(): Promise<void> {
  if (cycleRunning) {
    console.log("[cycle] Skipping — previous cycle still running");
    return;
  }
  cycleRunning = true;

  console.log("\n══════════════════════════════════════");
  console.log(`[cycle] ${new Date().toISOString()}`);
  console.log("══════════════════════════════════════");

  const feed: FeedEntry[] = [];
  let claimed = 0;
  let boughtBack = 0;
  let lpSol = 0;
  let action = "scan";

  try {
    const claimResult = await claimFees();
    if (!claimResult) {
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

    const walletLamports = await getSolBalance(connection, agent.publicKey);
    const spendable = getSpendable(walletLamports, claimed);

    if (spendable <= 0) {
      console.log(`[cycle] Wallet too low to spend (${(walletLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL, reserve=${SOL_RESERVE})`);
      const thought = await generateThought({ claimed, boughtBack: 0, burned: 0, lpSol: 0, action: "scan" });
      feed.push({ type: "thought", text: thought, timestamp: new Date().toISOString() });
      await saveAgentCycle({ claimed, boughtBack: 0, burned: 0, lpSol: 0, thought, thoughtMeta: "reserve", feed });
      return;
    }

    console.log(`[cycle] Spendable: ${spendable.toFixed(4)} SOL (keeping ${SOL_RESERVE} SOL reserve)`);

    const migrated = await isTokenMigrated();

    if (!migrated) {
      action = "buyback";
      console.log("[cycle] Pre-migration — buyback via bonding curve");
      const buyResult = await doBuyback(spendable);
      boughtBack = spendable;
      feed.push({
        type: "buyback",
        text: `Bought ${buyResult.tokens.toString()} tokens for ${spendable.toFixed(4)} SOL`,
        amount: spendable,
        timestamp: new Date().toISOString(),
        txSig: buyResult.sig,
      });
    } else {
      action = "lp";
      console.log("[cycle] Post-migration — adding LP");
      const lpResult = await doAddLp(spendable);
      lpSol = spendable;
      feed.push({
        type: "lp",
        text: `Added ${spendable.toFixed(4)} SOL to liquidity pool`,
        amount: spendable,
        timestamp: new Date().toISOString(),
        txSig: lpResult.lpSig,
      });
    }

    const thought = await generateThought({ claimed, boughtBack, burned: 0, lpSol, action });
    feed.push({ type: "thought", text: thought, timestamp: new Date().toISOString() });
    await saveAgentCycle({ claimed, boughtBack, burned: 0, lpSol, thought, thoughtMeta: action, feed });

    console.log(`[cycle] Done. claimed=${claimed.toFixed(4)}, spent=${spendable.toFixed(4)}, action=${action}`);
  } catch (err: any) {
    console.error("[cycle] Error:", err.message ?? err);
    const thought = `Error during cycle: ${(err.message ?? "unknown").slice(0, 100)}`;
    feed.push({ type: "thought", text: thought, timestamp: new Date().toISOString() });
    await saveAgentCycle({ claimed, boughtBack, burned: 0, lpSol, thought, thoughtMeta: "error", feed });
  } finally {
    cycleRunning = false;
  }
}
