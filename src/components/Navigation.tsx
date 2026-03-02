"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div
        className="max-w-[1200px] mx-auto flex items-center justify-between px-6 lg:px-10 h-16 transition-all duration-500"
        style={scrolled ? {
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(5,5,8,0.8)",
          backdropFilter: "blur(16px)",
        } : undefined}
      >
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white/80 hover:text-white transition-colors">
          <Image src="/logo.png" alt="Liquidify" width={22} height={22} className="rounded-sm" />
          Liquidify
        </Link>

        <div className="flex items-center gap-6 text-[13px]">
          <a href="#how" className="hidden sm:block text-white/25 hover:text-white/60 transition-colors">
            Protocol
          </a>
          <a href="#agent" className="hidden sm:block text-white/25 hover:text-white/60 transition-colors">
            Agent
          </a>
          <Link href="/docs" className="text-white/25 hover:text-white/60 transition-colors">
            Docs
          </Link>
          <a href="https://x.com/Liquidifydotfun" target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-white/60 transition-colors">
            Twitter
          </a>
        </div>
      </div>
    </header>
  );
}
