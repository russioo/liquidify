import Reveal from "./AnimateOnScroll";

export default function Protocol() {
  return (
    <section id="how" className="py-28 lg:py-40 px-6 lg:px-10">
      <div className="max-w-[1200px] mx-auto">
        <Reveal>
          <p className="text-[12px] text-white/15 uppercase tracking-[0.2em] mb-16">How it works</p>
        </Reveal>

        <div className="space-y-20 lg:space-y-28">
          <Reveal>
            <div className="grid lg:grid-cols-[1fr,2fr] gap-6 lg:gap-20 items-baseline">
              <p className="text-[13px] text-white/15 lg:text-right font-mono">Collect</p>
              <div>
                <h3 className="text-[clamp(1.5rem,3.5vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.15] text-white/90">
                  Every $Liquidify trade generates creator fees.
                  <span className="text-white/15"> 100% of them go to the agent. No wallets. No team cut.</span>
                </h3>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid lg:grid-cols-[1fr,2fr] gap-6 lg:gap-20 items-baseline">
              <p className="text-[13px] text-white/15 lg:text-right font-mono">Buyback</p>
              <div>
                <h3 className="text-[clamp(1.5rem,3.5vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.15] text-white/90">
                  Before migration, fees go to buybacks.
                  <span className="text-white/15"> The agent buys $Liquidify off the market, creating constant buy pressure.</span>
                </h3>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid lg:grid-cols-[1fr,2fr] gap-6 lg:gap-20 items-baseline">
              <p className="text-[13px] text-white/15 lg:text-right font-mono">Migrate</p>
              <div>
                <h3 className="text-[clamp(1.5rem,3.5vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.15] text-white/90">
                  After migration to AMM, the strategy shifts.
                  <span className="text-white/15"> Buybacks stop. Every fee goes straight into the liquidity pool.</span>
                </h3>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid lg:grid-cols-[1fr,2fr] gap-6 lg:gap-20 items-baseline">
              <p className="text-[13px] text-white/15 lg:text-right font-mono">Compound</p>
              <div>
                <h3 className="text-[clamp(1.5rem,3.5vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.15]">
                  <span className="accent">The pool deepens forever.</span>
                  <span className="text-white/15"> Lower slippage. Stronger floor. No human needed.</span>
                </h3>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
