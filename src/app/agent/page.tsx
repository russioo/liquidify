"use client";

import { useEffect, useState } from "react";
import { useAgentData } from "@/hooks/useAgentData";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
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

export default function AgentPage() {
  const { data } = useAgentData();
  const [m, setM] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => setM(true), []);
  useEffect(() => {
    const blink = setInterval(() => setCursorOn((v) => !v), 530);
    const tick = setInterval(() => setNow(Date.now()), 10_000);
    return () => { clearInterval(blink); clearInterval(tick); };
  }, []);

  const thought = data?.thought;
  const meta = data?.thoughtMeta;
  const feed: FeedEntry[] = data?.feedEntries ?? [];
  const thoughts = feed.filter((e) => e.type === "thought");
  const actions = feed.filter((e) => e.type !== "thought");

  const stats = [
    { label: "Total fees collected", value: data ? `${fmt(data.stats.totalClaimed)} SOL` : "...", accent: false },
    { label: "Total bought back", value: data ? `${fmt(data.stats.totalBoughtBack)} SOL` : "...", accent: true },
    { label: "Added to LP", value: data ? `${fmt(data.stats.totalLpSol)} SOL` : "...", accent: false },
    { label: "Status", value: meta ?? "monitoring", accent: true },
  ];

  return (
    <>
      <Navigation />

      {/* Hero */}
      <section className="min-h-[60dvh] flex flex-col justify-end px-6 lg:px-10 pt-28 pb-16">
        <div className="max-w-[1200px] mx-auto w-full">
          <p
            className="text-[13px] text-white/20 mb-6 tracking-wide"
            style={{ opacity: m ? 1 : 0, transition: "opacity 1s ease 0.1s" }}
          >
            Autonomous agent
          </p>

          <div
            className="flex items-start gap-4 mb-8"
            style={{
              opacity: m ? 1 : 0,
              transform: m ? "none" : "translateY(20px)",
              transition: "all 1s cubic-bezier(0.25,1,0.5,1) 0.15s",
            }}
          >
            <span
              className="mt-3 w-3 h-3 rounded-full bg-[#3b8ed4] shrink-0"
              style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            <div>
              {thought ? (
                <p className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-light leading-[1.4] text-white/60">
                  &ldquo;{thought}&rdquo;
                  <span
                    className="inline-block w-[3px] h-[28px] ml-2 align-middle"
                    style={{
                      background: cursorOn ? "#3b8ed4" : "transparent",
                      transition: "background 0.1s",
                    }}
                  />
                </p>
              ) : (
                <p className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-light leading-[1.4] text-white/20">
                  Initializing...
                  <span
                    className="inline-block w-[3px] h-[28px] ml-2 align-middle"
                    style={{
                      background: cursorOn ? "#3b8ed4" : "transparent",
                      transition: "background 0.1s",
                    }}
                  />
                </p>
              )}
              {meta && (
                <span className="mt-3 inline-block text-[11px] font-mono accent tracking-wide uppercase">
                  {meta}
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/[0.05]"
            style={{
              opacity: m ? 1 : 0,
              transition: "opacity 1.2s ease 0.5s",
            }}
          >
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-[11px] text-white/15 font-mono uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-[18px] font-semibold tracking-tight ${s.accent ? "accent" : "text-white/50"}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Thought history */}
      <section className="py-20 px-6 lg:px-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-[1fr,1.4fr] gap-16 lg:gap-24">

            {/* Left — thought stream */}
            <div>
              <p className="text-[12px] text-white/15 uppercase tracking-[0.2em] mb-8">Thought stream</p>
              <div className="space-y-0">
                {thoughts.length === 0 && (
                  <p className="text-[13px] text-white/15 font-mono py-4">Waiting for first thought...</p>
                )}
                {thoughts.slice(0, 20).map((t, i) => (
                  <div
                    key={`${t.timestamp}-${i}`}
                    className="py-4 border-b border-white/[0.03] group"
                    style={{ opacity: Math.max(0.25, 1 - i * 0.04) }}
                  >
                    <p className="text-[14px] leading-[1.7] text-white/35 group-hover:text-white/55 transition-colors">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <span className="mt-1 text-[10px] font-mono text-white/10" suppressHydrationWarning>
                      {timeAgo(t.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — action log (terminal) */}
            <div>
              <p className="text-[12px] text-white/15 uppercase tracking-[0.2em] mb-8">Action log</p>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                {/* Terminal header */}
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white/10" />
                      <span className="w-2 h-2 rounded-full bg-white/10" />
                      <span className="w-2 h-2 rounded-full bg-white/10" />
                    </div>
                    <span className="text-[11px] text-white/15 font-mono ml-2">liquidify-agent</span>
                  </div>
                  <span className="text-[10px] text-white/10 font-mono" suppressHydrationWarning>
                    {data?.lastRunAt ? `last cycle ${timeAgo(data.lastRunAt)}` : "—"}
                  </span>
                </div>

                {/* All feed entries */}
                <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
                  {feed.length === 0 && (
                    <div className="px-5 py-6 text-[13px] text-white/15 font-mono">
                      Waiting for first cycle...
                    </div>
                  )}
                  {feed.slice(0, 50).map((entry, i) => (
                    <div
                      key={`${entry.timestamp}-${i}`}
                      className="px-5 py-3.5 flex items-start gap-3 group hover:bg-white/[0.015] transition-colors"
                    >
                      <span
                        className={`text-[10px] font-mono font-medium tracking-wider mt-[3px] w-[36px] shrink-0 ${typeColor[entry.type] ?? "text-white/15"}`}
                      >
                        {typeLabel[entry.type] ?? (entry.type?.toUpperCase() || "—")}
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
                              className="text-[10px] font-mono text-white/10 hover:text-[#3b8ed4] transition-colors"
                            >
                              tx: {entry.txSig.slice(0, 8)}...
                            </a>
                          )}
                          {entry.amount != null && entry.amount > 0 && (
                            <span className="text-[10px] font-mono text-white/15">
                              {entry.amount.toFixed(4)} SOL
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary bar */}
                {data && (
                  <div className="px-5 py-3 border-t border-white/[0.06] flex flex-wrap items-center gap-x-6 gap-y-1 text-[10px] font-mono text-white/15">
                    <span>{fmt(data.stats.totalClaimed)} SOL collected</span>
                    <span>{fmt(data.stats.totalBoughtBack)} SOL bought back</span>
                    <span>{fmt(data.stats.totalLpSol)} SOL in LP</span>
                    <span className="ml-auto accent">
                      {feed.filter((e) => e.type !== "thought").length} actions
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* How it works — compact */}
          <div className="mt-28 grid md:grid-cols-3 gap-px rounded-xl overflow-hidden border border-white/[0.06]">
            {[
              { title: "Collect", desc: "Every trade generates creator fees. 100% go to the agent. No team cut." },
              { title: "Buyback", desc: "Pre-migration: fees buy $LIQUID off the bonding curve. Constant buy pressure." },
              { title: "LP", desc: "Post-migration: all fees deposit into the liquidity pool. Deeper pool forever." },
            ].map((s) => (
              <div key={s.title} className="bg-white/[0.015] px-6 py-8 space-y-2">
                <h3 className="text-[15px] font-semibold text-white/70">{s.title}</h3>
                <p className="text-[13px] leading-[1.7] text-white/20">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
