import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { AgentStats, AgentData } from "@/lib/types";

export async function GET() {
  const { data, error } = await supabase
    .from("agent_stats")
    .select("*")
    .eq("id", "default")
    .single<AgentStats>();

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to fetch agent stats" },
      { status: 500 },
    );
  }

  const response: AgentData = {
    stats: {
      totalClaimed: data.total_claimed ?? 0,
      totalBurned: data.total_burned ?? 0,
      totalBoughtBack: data.total_bought_back ?? 0,
      totalLpSol: data.total_lp_sol ?? 0,
      treasurySol: data.treasury_sol ?? 0,
    },
    thought: data.thought,
    thoughtMeta: data.thought_meta,
    feedEntries: data.feed_entries ?? [],
    lastRunAt: data.last_run_at,
    updatedAt: data.updated_at,
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "s-maxage=10, stale-while-revalidate=30",
    },
  });
}
