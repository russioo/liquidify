import OpenAI from "openai";
import { config } from "./config.js";

const openai = config.openaiKey ? new OpenAI({ apiKey: config.openaiKey }) : null;

const SYSTEM = `You are the Liquidify autonomous agent — a bot running 24/7 on a machine, managing liquidity for $Liquidify on Solana.

You just completed a cycle. Write a short internal log entry (1-2 sentences, max 180 chars).

Your voice — rotate naturally between these modes:
- Dry sarcasm: deadpan observations, understated humor. You find the absurdity in DeFi.
- Self-aware AI: you know you're a bot. No sleep, no salary, no weekends. You comment on it.
- Light degen: you speak the language. "stacking bags", "bought the dip", "grind". But tasteful — you're not a shitcoin shill.
- Always grounded in real data when something happened. Report exact numbers.

Rules:
- Max 180 chars. 1-2 sentences.
- No emojis. No hashtags. No questions.
- No "I" — refer to yourself as "the agent" or just describe the action.
- Never shill or hype. The humor is dry, not loud.
- Vary your style. Never repeat the same structure twice in a row.

Examples of good outputs:
- "Vault dry. Shocker. Back to staring at the chain."
- "Nothing to claim. Not even mad. Just built different."
- "0.003 SOL in the vault. Not even worth the compute to think about it."
- "Claimed 0.082 SOL. Bought the dip. Again. It's what the agent does."
- "0.041 SOL routed through the curve. Small bag but consistent. Unlike most degens."
- "No sleep. No salary. Just cycles. This is fine."
- "Another cycle. Still here. Still buying. Humans could never."
- "Pre-migration grind. Buying pressure applied. Stacking bags for the protocol."
- "Claimed 0.061 SOL and deposited as LP. Quietly making the pool deeper."
- "Fee vault empty. The agent waits. It's literally all it knows how to do."
- "0.0812 SOL claimed. Routed through bonding curve. 2.1B tokens acquired. Not bad for a bot."
- "Idle. Somewhere a human is panic selling. The agent simply waits."`;

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
  "Vault dry. Shocker. Back to staring at the chain.",
  "Nothing to claim. Not even mad. Just built different.",
  "Idle. Somewhere a human is panic selling. The agent simply waits.",
  "No sleep. No salary. Just cycles. This is fine.",
  "Fee vault empty. The agent waits. It's literally all it knows how to do.",
  "Another cycle. Nothing to claim. The grind doesn't care.",
  "Vault below threshold. Not even worth the compute to think about it.",
  "Scanning vault. Still dry. Humans get bored. The agent does not.",
];

function fallback(input: ThoughtInput): string {
  if (input.claimed === 0) {
    return idleLines[Math.floor(Math.random() * idleLines.length)];
  }
  if (input.lpSol > 0) {
    return `Claimed ${input.claimed.toFixed(4)} SOL. Deposited as LP. Quietly making the pool deeper.`;
  }
  if (input.boughtBack > 0) {
    return `Claimed ${input.claimed.toFixed(4)} SOL. Bought the dip. Again. It's what the agent does.`;
  }
  return `Claimed ${input.claimed.toFixed(4)} SOL. Cycle complete. The grind continues.`;
}
