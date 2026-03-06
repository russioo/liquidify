"use client";

import { useEffect, useState } from "react";
import { useAgentData } from "@/hooks/useAgentData";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function Hero() {
  const [m, setM] = useState(false);
  const { data } = useAgentData();
  useEffect(() => setM(true), []);

  const claimed = data?.stats.totalClaimed ?? 0;
  const lp = data?.stats.totalLpSol ?? 0;
  const hasData = data !== null;

  return (
    <section className="min-h-[100dvh] flex flex-col justify-between px-6 lg:px-10 pt-24 pb-0">
      <div className="max-w-[1200px] mx-auto w-full flex-1 flex flex-col justify-center">

        <p
          className="text-[13px] text-white/20 mb-6 tracking-wide"
          style={{ opacity: m ? 1 : 0, transition: "opacity 1s ease 0.1s" }}
        >
          Autonomous liquidity on Solana
        </p>

        <h1
          className="text-[clamp(3rem,8vw,7rem)] font-bold tracking-[-0.05em] leading-[0.95]"
          style={{
            opacity: m ? 1 : 0,
            transform: m ? "none" : "translateY(30px)",
            transition: "all 1s cubic-bezier(0.25,1,0.5,1) 0.15s",
          }}
        >
          <span className="text-white">Liquidity</span>
          <br />
          <span className="text-white/15">that builds</span>
          <br />
          <span className="accent">itself.</span>
        </h1>

        <div
          className="mt-8 max-w-[480px]"
          style={{
            opacity: m ? 1 : 0,
            transform: m ? "none" : "translateY(20px)",
            transition: "all 1s cubic-bezier(0.25,1,0.5,1) 0.4s",
          }}
        >
          <p className="text-[15px] leading-[1.8] text-white/30">
            $Liquidify has an autonomous agent that takes 100% of
            creator fees and uses them for buybacks. After migration,
            all fees go straight into the liquidity pool. No wallets.
            No manual management.
          </p>
          <div className="mt-6 flex items-center gap-6">
            <a href="#agent" className="text-[14px] font-medium accent hover:text-white transition-colors">
              See the agent &#8594;
            </a>
            <a href="#how" className="text-[14px] text-white/20 hover:text-white/50 transition-colors">
              How it works
            </a>
          </div>
        </div>
      </div>

      {/* Live data strip */}
      <div
        className="max-w-[1200px] mx-auto w-full"
        style={{ opacity: m ? 1 : 0, transition: "opacity 1.2s ease 0.7s" }}
      >
        <div className="py-5 flex flex-wrap items-center gap-x-10 gap-y-2 text-[12px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-white/15">fees collected</span>
            <span className="text-white/40">{hasData ? `${fmt(claimed)} SOL` : "..."}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/15">added to pool</span>
            <span className="text-white/40">{hasData ? (lp > 0 ? `${fmt(lp)} SOL` : "post-migration") : "..."}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/15">status</span>
            <span className="accent">{data?.thought ? "active" : "monitoring"}</span>
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#3b8ed4]"
              style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
