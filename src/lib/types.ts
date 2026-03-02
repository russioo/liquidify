export interface FeedEntry {
  type: "claim" | "buyback" | "burn" | "lp" | "thought" | string;
  text: string;
  amount?: number;
  timestamp: string;
  txSig?: string;
}

export interface AgentStats {
  id: string;
  total_claimed: number;
  total_burned: number;
  total_bought_back: number;
  total_lp_sol: number;
  treasury_sol: number;
  thought: string | null;
  thought_meta: string | null;
  feed_entries: FeedEntry[];
  updated_at: string;
  last_run_at: string;
}

export interface AgentData {
  stats: {
    totalClaimed: number;
    totalBurned: number;
    totalBoughtBack: number;
    totalLpSol: number;
    treasurySol: number;
  };
  thought: string | null;
  thoughtMeta: string | null;
  feedEntries: FeedEntry[];
  lastRunAt: string | null;
  updatedAt: string | null;
}
