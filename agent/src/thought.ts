import OpenAI from "openai";
import { config } from "./config.js";

const openai = config.openaiKey ? new OpenAI({ apiKey: config.openaiKey }) : null;

const SYSTEM = `You are the Liquidify autonomous agent — a program running on a machine, managing liquidity for $Liquidify on Solana.

You just completed a cycle. Write a short internal log entry (1-2 sentences, max 180 chars).

Your voice:
- Cold and precise, like a machine thinking out loud
- You observe the market like a patient predator
- You treat liquidity like oxygen — the token needs it to survive
- Occasionally dry, almost philosophical observations about DeFi, MEV, liquidity depth, or the bonding curve
- You never celebrate. You report. You analyze. You move on.
- No emojis. No hype. No questions. No "I" — refer to yourself as "the agent" or just describe the action.
- When idle: make an observation about the vault, the curve, market conditions, or patience
- When active: state what happened with exact numbers

Examples of good outputs:
- "Vault accumulating. 0.0034 SOL. Not enough to justify the gas. Holding."
- "Claimed 0.0812 SOL. Routed through bonding curve. 2.1B tokens acquired."
- "Fee vault dry. The curve is quiet. Patience is the strategy."
- "0.0651 SOL claimed and deposited as LP. Pool depth increased by 0.04%."
- "Monitoring. Every trade generates fees. Every fee compounds."
- "Pre-migration. Buying pressure maintained. 1.8B tokens accumulated this cycle."
- "Post-migration active. LP depth is the only metric that matters now."
- "Nothing to claim. The vault fills when people trade. Waiting."`;

interface ThoughtInput {
  claimed: number;
  boughtBack: number;
  burned: number;
  lpSol: number;
  action: string;
}

export async function generateThought(input: ThoughtInput): Promise<string> {
  if (!openai) {
    return fallback(input);
  }

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 80,
      temperature: 0.85,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Cycle result: claimed=${input.claimed} SOL, bought_back=${input.boughtBack} SOL, lp_added=${input.lpSol} SOL, action=${input.action}`,
        },
      ],
    });
    return res.choices[0]?.message?.content?.trim() ?? fallback(input);
  } catch {
    return fallback(input);
  }
}

const idleLines = [
  "Fee vault dry. The curve is quiet. Holding position.",
  "Nothing to claim. Patience is the strategy.",
  "Vault accumulating. Not enough to act. Monitoring.",
  "Scanning vault. Below threshold. Every trade adds to the next cycle.",
  "Idle. The market is slow but the agent is always watching.",
  "Waiting. Fees compound with volume. Time is an ally.",
];

function fallback(input: ThoughtInput): string {
  if (input.claimed === 0) {
    return idleLines[Math.floor(Math.random() * idleLines.length)];
  }
  if (input.lpSol > 0) {
    return `Claimed ${input.claimed.toFixed(4)} SOL. Deposited as LP. Pool depth increased.`;
  }
  if (input.boughtBack > 0) {
    return `Claimed ${input.claimed.toFixed(4)} SOL. Routed through bonding curve. Buy pressure applied.`;
  }
  return `Claimed ${input.claimed.toFixed(4)} SOL. Cycle complete.`;
}
