import "dotenv/config";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import bs58 from "bs58";

function req(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

export const config = {
  mint: new PublicKey(req("MINT_ADDRESS")),
  rpcUrl: req("RPC_URL"),
  cycleMs: Number(process.env.CYCLE_INTERVAL_MS ?? 60_000),
  openaiKey: process.env.OPENAI_API_KEY ?? "",
  supabaseUrl: req("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceKey: req("SUPABASE_SERVICE_ROLE_KEY"),
};

export const agent = Keypair.fromSecretKey(bs58.decode(req("AGENT_PRIVATE_KEY")));
export const connection = new Connection(config.rpcUrl, "confirmed");
