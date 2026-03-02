"use client";

import Reveal from "./AnimateOnScroll";

const principles = [
  {
    title: "No team wallet",
    body: "100% of creator fees go to the agent. Not a single SOL goes to any personal wallet. Ever.",
  },
  {
    title: "Fully autonomous",
    body: "The agent runs 24/7 from a local machine. It monitors, decides, and executes without human input.",
  },
  {
    title: "On-chain verifiable",
    body: "Every buyback, every LP deposit, every cycle is a Solana transaction you can look up yourself.",
  },
  {
    title: "Open platform",
    body: "The same engine that powers $Liquidify will soon be available to any token. Launch with built-in autonomous LP management.",
    soon: true,
  },
];

export default function Architecture() {
  return (
    <section id="principles" className="py-28 lg:py-40 px-6 lg:px-10">
      <div className="max-w-[1200px] mx-auto">
        <Reveal>
          <p className="text-[12px] text-white/15 uppercase tracking-[0.2em] mb-16">Principles</p>
        </Reveal>

        <div className="space-y-0">
          {principles.map((p, i) => (
            <Reveal key={p.title} delay={0.08 * (i + 1)}>
              <div className="group py-8 lg:py-10 border-b border-white/5 first:border-t flex flex-col lg:flex-row lg:items-baseline gap-4 lg:gap-20 cursor-default">
                <h3 className="text-[clamp(1.3rem,2.5vw,1.8rem)] font-bold tracking-[-0.02em] text-white/80 group-hover:text-white transition-colors lg:w-[280px] shrink-0 flex items-center gap-3">
                  {p.title}
                  {p.soon && (
                    <span className="text-[10px] font-mono font-normal accent uppercase tracking-wider">soon</span>
                  )}
                </h3>
                <p className="text-[15px] leading-[1.8] text-white/20 group-hover:text-white/40 transition-colors">
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
