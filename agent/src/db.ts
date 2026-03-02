import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

export interface FeedEntry {
  type: string;
  text: string;
  amount?: number;
  timestamp: string;
  txSig?: string;
}

export interface CycleResult {
  claimed: number;
  boughtBack: number;
  burned: number;
  lpSol: number;
  thought: string;
  thoughtMeta: string;
  feed: FeedEntry[];
}

export async function saveAgentCycle(result: CycleResult) {
  const { data: existing } = await supabase
    .from("agent_stats")
    .select("*")
    .eq("id", "default")
    .single();

  const prev = existing ?? {
    total_claimed: 0,
    total_burned: 0,
    total_bought_back: 0,
    total_lp_sol: 0,
    treasury_sol: 0,
    feed_entries: [],
  };

  const oldFeed: FeedEntry[] = Array.isArray(prev.feed_entries) ? prev.feed_entries : [];
  const newFeed = [...result.feed, ...oldFeed].slice(0, 200);

  const update = {
    id: "default",
    total_claimed: (prev.total_claimed ?? 0) + result.claimed,
    total_burned: (prev.total_burned ?? 0) + result.burned,
    total_bought_back: (prev.total_bought_back ?? 0) + result.boughtBack,
    total_lp_sol: (prev.total_lp_sol ?? 0) + result.lpSol,
    thought: result.thought,
    thought_meta: result.thoughtMeta,
    feed_entries: newFeed,
    updated_at: new Date().toISOString(),
    last_run_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("agent_stats")
    .upsert(update, { onConflict: "id" });

  if (error) {
    console.error("[db] Failed to save cycle:", error.message);
  } else {
    console.log("[db] Cycle saved. Total claimed:", update.total_claimed);
  }
}
