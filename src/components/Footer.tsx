import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="px-6 lg:px-10 pb-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px]">
          <span className="text-white/20 flex items-center gap-2">
            <Image src="/logo.png" alt="Liquidify" width={16} height={16} className="rounded-sm opacity-40" />
            Liquidify
          </span>
          <div className="flex items-center gap-5 text-white/15">
            <Link href="/docs" className="hover:text-white/40 transition-colors">Docs</Link>
            <a href="https://x.com/Liquidifydotfun" target="_blank" rel="noopener noreferrer" className="hover:text-white/40 transition-colors">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
