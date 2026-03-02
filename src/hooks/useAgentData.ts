"use client";

import { useEffect, useState, useCallback } from "react";
import type { AgentData } from "@/lib/types";

const POLL_INTERVAL = 10_000;

export function useAgentData() {
  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/agent-stats");
      if (!res.ok) return;
      const json: AgentData = await res.json();
      setData(json);
    } catch {
      // silent fail, will retry next poll
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetch_]);

  return { data, loading };
}
