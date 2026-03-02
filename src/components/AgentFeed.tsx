"use client";

import { useEffect, useState } from "react";
import { useAgentData } from "@/hooks/useAgentData";
import Reveal from "./AnimateOnScroll";
import type { FeedEntry } from "@/lib/types";

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const typeLabel: Record<string, string> = {
  claim: "CLAIM",
  buyback: "BUY",
  lp: "LP",
  thought: "LOG",
};

const typeColor: Record<string, string> = {
  claim: "text-amber-400/60",
  buyback: "accent",
  lp: "text-emerald-400/60",
  thought: "text-white/20",
};

export default function AgentFeed() {
  const { data } = useAgentData();
  const [cursorOn, setCursorOn] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const blink = setInterval(() => setCursorOn((v) => !v), 530);
    const tick = setInterval(() => setNow(Date.now()), 10_000);
    return () => { clearInterval(blink); clearInterval(tick); };
  }, []);

  const thought = data?.thought;
  const meta = data?.thoughtMeta;
  const feed: FeedEntry[] = data?.feedEntries?.slice(0, 12) ?? [];
  const hasActions = feed.some((e) => e.type !== "thought");

  return (
    <section id="feed" className="py-28 lg:py-40 px-6 lg:px-10">
      <div className="max-w-[1200px] mx-auto">
        <Reveal>
          <p className="text-[12px] text-white/15 uppercase tracking-[0.2em] mb-16">Agent log</p>
        </Reveal>

        <div className="grid lg:grid-cols-[1fr,1.2fr] gap-16 lg:gap-24">
          {/* Left — current thought + context */}
          <Reveal>
            <div>
              <div className="flex items-center gap-2 mb-8">
                <span
                  className="w-2 h-2 rounded-full bg-[#3b8ed4]"
                  style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                />
                <span className="text-[11px] text-white/25 uppercase tracking-wider font-mono">
                  Latest thought
                </span>
              </div>

              {thought ? (
                <div className="mb-10">
                  <p className="text-[20px] leading-[1.6] text-white/50 font-light">
                    &ldquo;{thought}&rdquo;
                    <span
                      className="inline-block w-[2px] h-[18px] ml-1 align-middle"
                      style={{
                        background: cursorOn ? "#3b8ed4" : "transparent",
                        transition: "background 0.1s",
                      }}
                    />
                  </p>
                  {meta && (
                    <span className="mt-3 inline-block text-[11px] font-mono accent tracking-wide uppercase">
                      {meta}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[20px] leading-[1.6] text-white/20 font-light mb-10">
                  Initializing agent...
                  <span
                    className="inline-block w-[2px] h-[18px] ml-1 align-middle"
                    style={{
                      background: cursorOn ? "#3b8ed4" : "transparent",
                      transition: "background 0.1s",
                    }}
                  />
                </p>
              )}

              <p className="text-[14px] leading-[1.8] text-white/20">
                The agent generates a thought after every cycle. Each one is created by GPT-4o-mini
                based on real cycle data — what was claimed, what action was taken, and the current
                state of the market. Every thought is stored permanently.
              </p>
            </div>
          </Reveal>

          {/* Right — live feed */}
          <Reveal delay={0.12}>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
              {/* Terminal header */}
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white/10" />
                    <span className="w-2 h-2 rounded-full bg-white/10" />
                    <span className="w-2 h-2 rounded-full bg-white/10" />
                  </div>
                  <span className="text-[11px] text-white/15 font-mono ml-2">agent activity</span>
                </div>
                <span className="text-[10px] text-white/10 font-mono" suppressHydrationWarning>
                  {data?.lastRunAt ? timeAgo(data.lastRunAt) : "—"}
                </span>
              </div>

              {/* Feed entries */}
              <div className="divide-y divide-white/[0.04]">
                {feed.length === 0 && (
                  <div className="px-5 py-6 text-[13px] text-white/15 font-mono">
                    Waiting for first cycle...
                  </div>
                )}
                {feed.map((entry, i) => (
                  <div
                    key={`${entry.timestamp}-${i}`}
                    className="px-5 py-3.5 flex items-start gap-3 group hover:bg-white/[0.01] transition-colors"
                    style={{ opacity: Math.max(0.3, 1 - i * 0.07) }}
                  >
                    <span
                      className={`text-[10px] font-mono font-medium tracking-wider mt-[3px] w-[36px] shrink-0 ${typeColor[entry.type] ?? "text-white/15"}`}
                    >
                      {typeLabel[entry.type] ?? entry.type.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] leading-[1.6] text-white/35 group-hover:text-white/50 transition-colors">
                        {entry.text}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-[10px] font-mono text-white/10" suppressHydrationWarning>
                          {timeAgo(entry.timestamp)}
                        </span>
                        {entry.txSig && (
                          <a
                            href={`https://solscan.io/tx/${entry.txSig}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-white/10 hover:accent transition-colors"
                          >
                            {entry.txSig.slice(0, 8)}...
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary bar */}
              {hasActions && data && (
                <div className="px-5 py-3 border-t border-white/[0.06] flex items-center gap-6 text-[10px] font-mono text-white/15">
                  <span>{data.stats.totalClaimed.toFixed(2)} SOL collected</span>
                  <span>{data.stats.totalBoughtBack.toFixed(2)} SOL bought back</span>
                  <span>{data.stats.totalLpSol.toFixed(2)} SOL in LP</span>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
