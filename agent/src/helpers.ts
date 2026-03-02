import {
  Connection,
  Transaction,
  Keypair,
  TransactionInstruction,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { getAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { config } from "./config.js";

export const PUMP_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
export const PUMP_AMM_PROGRAM_ID = new PublicKey("PSwapMdSai8tjrEXcxFeQth87xC4rRsa4VA5mhGhXkP");

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendAndConfirm(
  conn: Connection,
  tx: Transaction,
  signer: Keypair,
): Promise<string> {
  tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
  tx.feePayer = signer.publicKey;
  return sendAndConfirmTransaction(conn, tx, [signer], { commitment: "confirmed" });
}

export async function getTokenBalance(conn: Connection, ata: PublicKey): Promise<bigint> {
  try {
    const acc = await getAccount(conn, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
    return acc.amount;
  } catch {
    return BigInt(0);
  }
}

export function bondingCurveV2Pda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve-v2"), mint.toBuffer()],
    PUMP_PROGRAM_ID,
  );
  return pda;
}

export function poolV2Pda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool-v2"), mint.toBuffer()],
    PUMP_AMM_PROGRAM_ID,
  );
  return pda;
}

export function appendV2Account(
  instructions: TransactionInstruction[],
  programId: PublicKey,
  v2Pda: PublicKey,
) {
  for (const ix of instructions) {
    if (ix.programId.equals(programId)) {
      ix.keys.push({ pubkey: v2Pda, isSigner: false, isWritable: false });
    }
  }
}

export function getAgentTokenAta(agentPubkey: PublicKey, mint: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [agentPubkey.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
  );
  return ata;
}
