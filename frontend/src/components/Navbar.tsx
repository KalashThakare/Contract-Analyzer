"use client";

/**
 * Lightweight navbar used in the legacy non-dashboard flow.
 */

import Link from "next/link";
import { Scale } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <Scale className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-slate-900 tracking-tight">
          LegalDoc Analyzer
        </span>
      </Link>
      <div className="text-sm text-slate-400 font-medium tracking-tight">
        Deep Learning Lab
      </div>
    </nav>
  );
}
