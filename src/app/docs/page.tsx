import Link from "next/link";

export const metadata = {
  title: "Docs",
  description: "How Liquidify works: autonomous fee collection, buybacks, and liquidity pool management.",
};

function Code({ children, title }: { children: string; title?: string }) {
  return (
    <div className="my-6 rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/10" />
            <span className="w-2 h-2 rounded-full bg-white/10" />
            <span className="w-2 h-2 rounded-full bg-white/10" />
          </div>
          <span className="text-[11px] text-white/20 font-mono ml-2">{title}</span>
        </div>
      )}
      <pre className="px-4 py-4 overflow-x-auto text-[12.5px] leading-[1.85] font-mono text-white/40">
        <code>{children}</code>
      </pre>
    </div>
  );
}

const codeInit = `import { createRequire } from "node:module";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const require = createRequire(import.meta.url);
const { OnlinePumpSdk, PumpSdk, getBuyTokenAmountFromSolAmount } = require("@pump-fun/pump-sdk");
const { OnlinePumpAmmSdk, PumpAmmSdk, canonicalPumpPoolPda }     = require("@pump-fun/pump-swap-sdk");

const connection   = new Connection(process.env.RPC_URL, "confirmed");
const agent        = Keypair.fromSecretKey(bs58.decode(process.env.AGENT_PRIVATE_KEY));
const mint         = new PublicKey(process.env.MINT_ADDRESS);

const pumpOnline     = new OnlinePumpSdk(connection);
const pumpOffline    = new PumpSdk();
const pumpAmmOnline  = new OnlinePumpAmmSdk(connection);
const pumpAmmOffline = new PumpAmmSdk();`;

const codeClaim = `// check vault balance across both programs
const lamports = await pumpOnline
  .getCreatorVaultBalanceBothPrograms(agent.publicKey);

if (lamports.toNumber() / LAMPORTS_PER_SOL < 0.01) return; // wait

// claim all accumulated creator fees
const solBefore = await connection.getBalance(agent.publicKey);

const claimIx = await pumpOnline
  .collectCoinCreatorFeeInstructions(agent.publicKey, agent.publicKey);

await sendAndConfirm(connection, new Transaction().add(...claimIx), agent);

const solAfter = await connection.getBalance(agent.publicKey);
const claimed  = (solAfter - solBefore) / LAMPORTS_PER_SOL;`;

const codeBuyback = `// fetch on-chain bonding curve state
const global = await pumpOnline.fetchGlobal();
const { bondingCurveAccountInfo, bondingCurve, associatedUserAccountInfo } =
  await pumpOnline.fetchBuyState(mint, agent.publicKey, TOKEN_2022_PROGRAM_ID);

// calculate how many tokens we get for our SOL
const solBn  = new BN(Math.floor(solAmount * 1e9));
const amount = getBuyTokenAmountFromSolAmount({
  global,
  feeConfig: null,
  mintSupply: bondingCurve.tokenTotalSupply,
  bondingCurve,
  amount: solBn,
});

// execute buy through bonding curve program
const buyIx = await pumpOffline.buyInstructions({
  global,
  bondingCurveAccountInfo,
  bondingCurve,
  associatedUserAccountInfo,
  mint,
  user: agent.publicKey,
  solAmount: solBn,
  amount,
  slippage: 2,
  tokenProgram: TOKEN_2022_PROGRAM_ID,
});

await sendAndConfirm(connection, new Transaction().add(...buyIx), agent);`;

const codeDetect = `// primary: check graduation status via SDK
let isMigrated = false;
try {
  const feeResult = await pumpOnline.getMinimumDistributableFee(mint);
  isMigrated = feeResult.isGraduated;
} catch {
  // fallback: check if canonical AMM pool exists on-chain
  const poolKey  = canonicalPumpPoolPda(mint);
  const poolInfo = await connection.getAccountInfo(poolKey);
  if (poolInfo) isMigrated = true;
}`;

const codeLpBuy = `// Tx 1 — buy tokens with 65% of SOL
const buySolBn  = new BN(Math.floor(solAmount * 0.65 * 1e9));
const poolKey   = canonicalPumpPoolPda(mint);
const swapState = await pumpAmmOnline.swapSolanaState(poolKey, agent.publicKey);

const buyIx = await pumpAmmOffline.buyQuoteInput(swapState, buySolBn, 5);
await sendAndConfirm(connection, new Transaction().add(...buyIx), agent);

// wait for tokens to land on-chain
await new Promise(r => setTimeout(r, 4000));`;

const codeLpDeposit = `// Tx 2 — deposit SOL + tokens as LP (35% of SOL)
const depositSolBn   = new BN(Math.floor(solAmount * 0.35 * 1e9));
const liquidityState = await pumpAmmOnline
  .liquiditySolanaState(poolKey, agent.publicKey);

const { lpToken } = pumpAmmOffline
  .depositAutocompleteBaseAndLpTokenFromQuote(liquidityState, depositSolBn, 10);

const depositIx = await pumpAmmOffline
  .depositInstructions(liquidityState, lpToken, 10);

// deposit needs manual v2 PDA (SDK doesn't add it for deposits)
for (const ix of depositIx) {
  if (ix.programId.equals(PUMP_AMM_PROGRAM_ID)) {
    ix.keys.push({
      pubkey: poolV2Pda(mint),
      isSigner: false,
      isWritable: false,
    });
  }
}

await sendAndConfirm(connection, new Transaction().add(...depositIx), agent);`;

const codeLoop = `while (true) {
  const vault = await checkVaultBalance();
  if (vault < 0.01) { await sleep(60_000); continue; }

  await claimFees();

  const migrated = await isTokenMigrated();

  if (!migrated) {
    await doBuyback(claimed);            // bonding curve buy
  } else {
    await doAddLp(claimed);              // 65% buy + 35% LP deposit
  }

  await logCycle();                      // save to supabase
  await sleep(60_000);
}`;

const sections: {
  label: string;
  title: string;
  blocks: ({ type: "text"; value: string } | { type: "code"; value: string; title?: string })[];
}[] = [
  {
    label: "Overview",
    title: "What is Liquidify?",
    blocks: [
      { type: "text", value: "$Liquidify is a Solana token with an autonomous agent that manages all creator fees. There is no team wallet. There is no manual process. Every single fee generated by trading goes back into strengthening the token." },
      { type: "text", value: "Pre-migration: fees are used to buy back $Liquidify on the bonding curve, accumulating tokens. Post-migration: fees are used to deepen the liquidity pool on PumpSwap AMM. The agent decides automatically based on on-chain state." },
    ],
  },
  {
    label: "SDK setup",
    title: "Agent initialization",
    blocks: [
      { type: "text", value: "The agent is a TypeScript process built on two official Pump.fun SDKs: pump-sdk for bonding curve operations, and pump-swap-sdk for AMM interactions post-migration. It connects to a Solana RPC, loads the agent keypair, and initializes both online (on-chain reads) and offline (instruction building) SDK instances." },
      { type: "code", value: codeInit, title: "src/run.ts — initialization" },
    ],
  },
  {
    label: "Fee collection",
    title: "Step 1: Claim creator fees",
    blocks: [
      { type: "text", value: "Every cycle starts by checking the creator fee vault. Pump.fun accumulates trading fees in a vault PDA tied to the token creator. The agent calls getCreatorVaultBalanceBothPrograms to check both the bonding curve vault and the AMM vault in a single call." },
      { type: "text", value: "If the vault holds more than 0.01 SOL, the agent claims everything. It measures actual SOL received by comparing wallet balance before and after — not the vault estimate. This protects against any discrepancy between the reported amount and what the program actually transfers." },
      { type: "code", value: codeClaim, title: "src/run.ts — claimFees()" },
    ],
  },
  {
    label: "Migration detection",
    title: "How the agent decides",
    blocks: [
      { type: "text", value: "After claiming, the agent needs to decide: buyback or LP? It first tries getMinimumDistributableFee which returns an isGraduated flag. If that call fails (older token or network issue), it falls back to checking if the canonical PumpSwap AMM pool account exists on-chain." },
      { type: "code", value: codeDetect, title: "src/run.ts — isTokenMigrated()" },
    ],
  },
  {
    label: "Pre-migration",
    title: "Step 2a: Buyback on bonding curve",
    blocks: [
      { type: "text", value: "While the token is on the bonding curve, the agent uses 100% of claimed fees to buy $Liquidify directly through the Pump.fun bonding curve program. It fetches the current global state and bonding curve reserves to calculate exactly how many tokens the SOL will buy." },
      { type: "text", value: "The SDK's getBuyTokenAmountFromSolAmount computes the output using the constant-product formula adjusted for protocol and creator fees. The real bonding curve data is used — virtualSolReserves, virtualTokenReserves, and tokenTotalSupply." },
      { type: "code", value: codeBuyback, title: "src/run.ts — doBuyback()" },
    ],
  },
  {
    label: "Post-migration",
    title: "Step 2b: Add liquidity to AMM",
    blocks: [
      { type: "text", value: "Once $Liquidify migrates to PumpSwap AMM, the strategy shifts entirely. Instead of buybacks, 100% of fees go into deepening the liquidity pool. This happens in two transactions." },
      { type: "text", value: "First, 65% of the SOL is used to buy tokens through the AMM. This gives the agent the tokens it needs for the deposit." },
      { type: "code", value: codeLpBuy, title: "src/run.ts — LP step 1: buy tokens" },
      { type: "text", value: "Then, the remaining 35% SOL plus the bought tokens are deposited together as balanced liquidity. The SDK auto-calculates the correct token ratio. The deposit instruction requires a manual v2 PDA append (the SDK handles this for swaps but not deposits)." },
      { type: "code", value: codeLpDeposit, title: "src/run.ts — LP step 2: deposit" },
    ],
  },
  {
    label: "The loop",
    title: "Agent cycle",
    blocks: [
      { type: "text", value: "The agent runs an infinite loop. Each iteration: check vault, claim if possible, detect migration status, execute the right strategy, log results, wait. Default cycle interval is 60 seconds." },
      { type: "text", value: "The agent always keeps 0.02 SOL in the wallet as a reserve for transaction fees. It never spends more than what was just claimed. Pre-existing SOL and tokens in the wallet are untouched." },
      { type: "code", value: codeLoop, title: "src/run.ts — main loop" },
    ],
  },
  {
    label: "Thinking feed",
    title: "The thinking station",
    blocks: [
      { type: "text", value: "After every cycle, the agent generates a short summary of what it did and why. This is created using OpenAI and stored in Supabase alongside the cycle data." },
      { type: "text", value: "The website displays these thoughts in real time with a blinking cursor, giving the appearance of an AI that's actively thinking. Each thought shows the action type (buyback, LP, monitoring) and when it happened." },
    ],
  },
  {
    label: "Data flow",
    title: "Architecture",
    blocks: [
      { type: "text", value: "Solana blockchain: the agent interacts directly with Pump.fun's on-chain programs — the bonding curve program (6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P) and the PumpSwap AMM program (PSwapMdSai8tjrEXcxFeQth87xC4rRsa4VA5mhGhXkP). All actions settle on-chain." },
      { type: "text", value: "Supabase: stores cumulative stats (total collected, total bought back, total added to pool), the activity feed, and the latest agent thought. Updated after every cycle." },
      { type: "text", value: "Vercel: the website fetches data from Supabase and displays it. Only the anon key is exposed to the frontend. The website is read-only — no admin panel, no manual controls." },
    ],
  },
  {
    label: "Platform",
    title: "Coming soon: launch your own",
    blocks: [
      { type: "text", value: "The same engine that powers $Liquidify will be available as a platform. Launch your own token with a built-in autonomous LP agent." },
      { type: "text", value: "Same fee collection. Same buyback-to-LP pipeline. Same real-time thinking feed. Just your token." },
    ],
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen px-6 lg:px-10 pt-28 pb-20">
      <div className="max-w-[800px] mx-auto">
        <Link href="/" className="text-[13px] text-white/20 hover:text-white/50 transition-colors mb-12 inline-block">
          &#8592; Back
        </Link>

        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.04em] leading-[1.1] text-white/90 mb-4">
          Documentation
        </h1>
        <p className="text-[16px] text-white/30 leading-[1.7] mb-16">
          How $Liquidify works, from fee collection to autonomous liquidity management.
        </p>

        <div className="space-y-16">
          {sections.map((s) => (
            <section key={s.label} className="scroll-mt-24">
              <p className="text-[11px] text-white/15 uppercase tracking-[0.2em] font-mono mb-3">{s.label}</p>
              <h2 className="text-[22px] font-bold tracking-[-0.02em] text-white/80 mb-5">{s.title}</h2>
              <div className="space-y-4">
                {s.blocks.map((block, i) =>
                  block.type === "text" ? (
                    <p key={i} className="text-[15px] leading-[1.8] text-white/30">{block.value}</p>
                  ) : (
                    <Code key={i} title={block.title}>{block.value}</Code>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link href="/" className="text-[14px] accent hover:text-white transition-colors">
            &#8592; Back to Liquidify
          </Link>
        </div>
      </div>
    </main>
  );
}
