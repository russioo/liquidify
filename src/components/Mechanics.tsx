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
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

const fallbackThoughts: FeedEntry[] = [
  { type: "thought", text: "Scanning fee vault... waiting for accumulation.", timestamp: new Date().toISOString() },
  { type: "thought", text: "Agent initialized. Monitoring market conditions.", timestamp: new Date(Date.now() - 60000).toISOString() },
];

export default function Mechanics() {
  const { data, loading } = useAgentData();
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  const thoughts = data?.feedEntries?.length
    ? data.feedEntries.filter((e) => e.type === "thought" || e.text).slice(0, 8)
    : fallbackThoughts;

  const currentThought = data?.thought;
  const meta = data?.thoughtMeta;

  return (
    <section id="agent" className="py-28 lg:py-40 px-6 lg:px-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-28">
          {/* Left */}
          <Reveal>
            <p className="text-[12px] text-white/15 uppercase tracking-[0.2em] mb-12">The Agent</p>
            <div className="space-y-6">
              <p className="text-[18px] leading-[1.7] text-white/50">
                The $Liquidify agent runs from a local machine, watching
                the fee vault around the clock. When enough fees accumulate
                and market conditions are right, it acts.
              </p>
              <p className="text-[18px] leading-[1.7] text-white/50">
                Pre-migration: 100% buybacks. Post-migration: 100%
                into the liquidity pool. Every decision is logged and
                shown here in real time.
              </p>
            </div>

            <div className="mt-10 pt-6 border-t border-white/5">
              <p className="text-[14px] text-white/20">
                <span className="accent font-medium">Soon</span> — launch
                your own token with the same autonomous agent.
              </p>
            </div>
          </Reveal>

          {/* Right — thinking station */}
          <Reveal delay={0.15}>
            <div className="flex items-center gap-2 mb-6">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#3b8ed4]"
                style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
              />
              <span className="text-[11px] text-white/25 uppercase tracking-wider font-mono">
                Agent thinking
              </span>
            </div>

            {/* Current thought */}
            {currentThought && (
              <div className="mb-6 pb-6 border-b border-white/5">
                <p className="text-[15px] leading-[1.7] text-white/50">
                  &ldquo;{currentThought}&rdquo;
                  <span
                    className="inline-block w-[2px] h-[14px] ml-1 align-middle"
                    style={{
                      background: cursorOn ? "#3b8ed4" : "transparent",
                      transition: "background 0.1s",
                    }}
                  />
                </p>
                {meta && (
                  <span className="mt-2 inline-block text-[11px] font-mono accent">{meta}</span>
                )}
              </div>
            )}

            {/* Feed */}
            <div className="space-y-0">
              {thoughts.map((t, i) => (
                <div
                  key={`${t.timestamp}-${i}`}
                  className="py-3 border-b border-white/[0.03]"
                  style={{ opacity: i === 0 ? 0.8 : 0.4 + (1 - i / thoughts.length) * 0.3 }}
                >
                  <p className="text-[13px] leading-[1.6] text-white/35">
                    {t.text}
                    {i === 0 && !currentThought && (
                      <span
                        className="inline-block w-[2px] h-[12px] ml-1 align-middle"
                        style={{
                          background: cursorOn ? "#3b8ed4" : "transparent",
                          transition: "background 0.1s",
                        }}
                      />
                    )}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-[10px] font-mono">
                    <span className={
                      t.type === "buyback" ? "accent" :
                      t.type === "burn" ? "text-red-400/50" :
                      t.type === "lp" ? "text-emerald-400/50" :
                      t.type === "claim" ? "text-amber-400/50" :
                      "text-white/15"
                    }>
                      {t.type}
                    </span>
                    <span className="text-white/10">{timeAgo(t.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4 font-mono text-[12px]">
              {[
                { k: "fees collected", v: data ? `${fmt(data.stats.totalClaimed)} SOL` : "..." },
                { k: "added to pool", v: data ? `${fmt(data.stats.totalLpSol)} SOL` : "..." },
                { k: "bought back", v: data ? `${fmt(data.stats.totalBoughtBack)} SOL` : "..." },
                { k: "burned", v: data ? `${fmt(data.stats.totalBurned)} tokens` : "..." },
              ].map((r) => (
                <div key={r.k} className="flex justify-between py-2 border-b border-white/[0.03]">
                  <span className="text-white/12">{r.k}</span>
                  <span className="text-white/30">{r.v}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
