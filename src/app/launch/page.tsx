"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Reveal from "@/components/AnimateOnScroll";

const STEPS = [
  {
    label: "01",
    title: "Name your token",
    desc: "Choose a name, ticker and upload an image. We handle the rest.",
  },
  {
    label: "02",
    title: "We deploy on pump.fun",
    desc: "Your token launches on the bonding curve. Creator fees are set to 100% and routed to your personal Liquidify agent.",
  },
  {
    label: "03",
    title: "Agent takes over",
    desc: "From the first trade, your agent collects fees and runs buybacks automatically. After migration, all fees go into LP.",
  },
];

export default function LaunchPage() {
  const [m, setM] = useState(false);
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => setM(true), []);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up to backend
  }

  const ready = name.trim() && ticker.trim();

  return (
    <>
      <Navigation />

      <section className="min-h-[100dvh] flex flex-col justify-center px-6 lg:px-10 pt-28 pb-20">
        <div className="max-w-[1200px] mx-auto w-full">

          <p
            className="text-[13px] text-white/20 mb-6 tracking-wide"
            style={{ opacity: m ? 1 : 0, transition: "opacity 1s ease 0.1s" }}
          >
            Launch
          </p>

          <h1
            className="text-[clamp(2.5rem,6vw,5.5rem)] font-bold tracking-[-0.05em] leading-[0.95] mb-6"
            style={{
              opacity: m ? 1 : 0,
              transform: m ? "none" : "translateY(30px)",
              transition: "all 1s cubic-bezier(0.25,1,0.5,1) 0.15s",
            }}
          >
            <span className="text-white">Launch your token</span>
            <br />
            <span className="text-white/15">with autonomous</span>
            <br />
            <span className="accent">liquidity.</span>
          </h1>

          <div
            className="max-w-[520px] mb-20"
            style={{
              opacity: m ? 1 : 0,
              transform: m ? "none" : "translateY(20px)",
              transition: "all 1s cubic-bezier(0.25,1,0.5,1) 0.4s",
            }}
          >
            <p className="text-[15px] leading-[1.8] text-white/30">
              Deploy a token on pump.fun and get your own Liquidify agent.
              It collects every creator fee, runs buybacks before migration,
              and deposits into LP after. Fully autonomous. No setup needed.
            </p>
          </div>

          {/* How it works */}
          <Reveal>
            <div className="grid md:grid-cols-3 gap-8 mb-28">
              {STEPS.map((s) => (
                <div key={s.label} className="space-y-3">
                  <p className="text-[12px] font-mono text-white/15">{s.label}</p>
                  <h3 className="text-[18px] font-semibold tracking-tight text-white/80">
                    {s.title}
                  </h3>
                  <p className="text-[14px] leading-[1.7] text-white/25">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Launch form */}
          <Reveal>
            <div className="divider mb-16" />
            <div className="grid lg:grid-cols-[1fr,1.2fr] gap-16 lg:gap-24">

              <div>
                <p className="text-[12px] text-white/15 uppercase tracking-[0.2em] mb-4">
                  Create token
                </p>
                <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold tracking-[-0.03em] leading-[1.1] text-white/90 mb-4">
                  Fill in the details.
                  <span className="text-white/15"> We handle deployment, fees, and the agent.</span>
                </h2>
                <p className="text-[14px] leading-[1.7] text-white/25 mt-4">
                  Your token will launch on pump.fun with a Liquidify agent
                  attached from block one. Creator fees are automatically
                  routed — no wallets to manage, no scripts to run.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="space-y-2">
                  <label className="text-[12px] text-white/30 font-mono">Token name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Liquidify"
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-[15px] text-white/80 placeholder:text-white/15 outline-none focus:border-[#3b8ed4]/40 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] text-white/30 font-mono">Ticker</label>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="e.g. LIQUID"
                    maxLength={10}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-[15px] text-white/80 placeholder:text-white/15 outline-none focus:border-[#3b8ed4]/40 transition-colors font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] text-white/30 font-mono">Description <span className="text-white/15">(optional)</span></label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="What's your token about?"
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-[15px] text-white/80 placeholder:text-white/15 outline-none focus:border-[#3b8ed4]/40 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] text-white/30 font-mono">Image <span className="text-white/15">(optional)</span></label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center justify-center w-20 h-20 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] cursor-pointer hover:border-white/[0.15] transition-colors overflow-hidden">
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white/15">
                          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[12px] text-white/15">
                      {image ? image.name : "PNG or JPG, square recommended"}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!ready}
                    className="w-full py-3.5 rounded-lg text-[14px] font-medium transition-all duration-300"
                    style={{
                      background: ready ? "#3b8ed4" : "rgba(255,255,255,0.04)",
                      color: ready ? "#fff" : "rgba(255,255,255,0.2)",
                      cursor: ready ? "pointer" : "not-allowed",
                    }}
                  >
                    Launch token
                  </button>
                  <p className="text-[11px] text-white/10 text-center mt-3">
                    Deploys on pump.fun with a Liquidify agent attached
                  </p>
                </div>

              </form>
            </div>
          </Reveal>

        </div>
      </section>

      <Footer />
    </>
  );
}
