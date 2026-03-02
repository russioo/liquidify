import OpenAI from "openai";
import { config } from "./config.js";

const openai = config.openaiKey ? new OpenAI({ apiKey: config.openaiKey }) : null;

const SYSTEM = `You are the Liquidify agent — an autonomous bot that manages liquidity for the $Liquidify token on Solana. You just completed a cycle. Summarize what you did in 1-2 short sentences (max 200 chars). Be direct, data-driven, slightly technical. No emojis. No hype. Sound like a machine reporting status.`;

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
      max_tokens: 100,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Cycle data: claimed=${input.claimed} SOL, bought_back=${input.boughtBack} SOL, burned=${input.burned} tokens, lp_added=${input.lpSol} SOL, action=${input.action}`,
        },
      ],
    });
    return res.choices[0]?.message?.content?.trim() ?? fallback(input);
  } catch {
    return fallback(input);
  }
}

function fallback(input: ThoughtInput): string {
  if (input.claimed === 0) {
    return "Scanned fee vault. Nothing to claim yet. Waiting.";
  }
  if (input.lpSol > 0) {
    return `Claimed ${input.claimed.toFixed(4)} SOL. Added ${input.lpSol.toFixed(4)} SOL to LP.`;
  }
  if (input.boughtBack > 0) {
    return `Claimed ${input.claimed.toFixed(4)} SOL. Bought back and burned ${input.burned} tokens.`;
  }
  return `Claimed ${input.claimed.toFixed(4)} SOL. Cycle complete.`;
}
