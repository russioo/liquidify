"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function LaunchPage() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);

  return (
    <>
      <Navigation />

      <section className="min-h-[100dvh] flex flex-col items-center justify-center px-6 lg:px-10">
        <div className="text-center">
          <p
            className="text-[13px] text-white/20 mb-6 tracking-wide"
            style={{ opacity: m ? 1 : 0, transition: "opacity 1s ease 0.1s" }}
          >
            Launch
          </p>

          <h1
            className="text-[clamp(2.5rem,6vw,5rem)] font-bold tracking-[-0.05em] leading-[0.95] mb-6"
            style={{
              opacity: m ? 1 : 0,
              transform: m ? "none" : "translateY(30px)",
              transition: "all 1s cubic-bezier(0.25,1,0.5,1) 0.15s",
            }}
          >
            <span className="text-white/15">Coming</span>{" "}
            <span className="accent">soon.</span>
          </h1>

          <p
            className="text-[15px] leading-[1.8] text-white/25 max-w-[420px] mx-auto"
            style={{
              opacity: m ? 1 : 0,
              transform: m ? "none" : "translateY(15px)",
              transition: "all 1s cubic-bezier(0.25,1,0.5,1) 0.35s",
            }}
          >
            Launch your own token with an autonomous Liquidify agent attached from block one. Same buyback engine. Same LP management. Zero setup.
          </p>

          <div
            className="mt-8"
            style={{
              opacity: m ? 1 : 0,
              transition: "opacity 1s ease 0.6s",
            }}
          >
            <a
              href="https://x.com/Liquidifydotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] accent hover:text-white transition-colors"
            >
              Follow for updates &#8594;
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
