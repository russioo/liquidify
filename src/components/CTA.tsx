import Reveal from "./AnimateOnScroll";

export default function CTA() {
  return (
    <section className="py-32 lg:py-44 px-6 lg:px-10">
      <div className="max-w-[1200px] mx-auto text-center">
        <Reveal>
          <h2 className="text-[clamp(2rem,5.5vw,4.5rem)] font-bold tracking-[-0.04em] leading-[1] text-white/90">
            Every fee compounds.
          </h2>
          <p className="text-[clamp(2rem,5.5vw,4.5rem)] font-bold tracking-[-0.04em] leading-[1] text-white/12 mt-1">
            The pool never stops growing.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6 text-[14px]">
            <a href="#agent" className="font-medium accent hover:text-white transition-colors">
              Watch the agent &#8594;
            </a>
            <a href="#how" className="text-white/20 hover:text-white/50 transition-colors">
              How it works
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
