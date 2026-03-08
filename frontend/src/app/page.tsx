"use client";

import {
  Layers,
  ShieldAlert,
  Sparkles,
  Users,
  AlertTriangle,
  BarChart2,
  type LucideIcon,
} from "lucide-react";
import FileUpload from "@/components/FileUpload";

interface Feature {
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  {
    Icon: Layers,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Clause Classification",
    desc: "Identifies 100+ legal clause types using Legal-BERT fine-tuned on the LEDGAR dataset.",
  },
  {
    Icon: ShieldAlert,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    title: "Risk Scoring",
    desc: "Computes a 0–100 risk score per clause using TF-IDF + Ridge regression.",
  },
  {
    Icon: Sparkles,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    title: "AI Explanations",
    desc: "SHAP + Groq Llama 3.1 generates plain-English explanations for flagged clauses.",
  },
  {
    Icon: Users,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Entity Extraction",
    desc: "Detects parties, dates, monetary amounts, and jurisdictions automatically.",
  },
  {
    Icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    title: "Unfair Clause Detection",
    desc: "Flags potentially one-sided or unfair clauses using binary classification.",
  },
  {
    Icon: BarChart2,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title: "Risk Dashboard",
    desc: "Visual risk distribution, filterable clause list, and document-level metrics.",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-blue-100">
          <Sparkles className="w-3 h-3" />
          Deep Learning · Legal NLP
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
          AI-Powered Legal
          <br />
          Document Analyzer
        </h1>
        <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
          Upload a contract or legal document. Our deep learning pipeline
          classifies clauses, scores risk, extracts entities, and explains what
          to watch out for.
        </p>
      </div>

      {/* Upload card */}
      <div className="max-w-lg mx-auto mb-4">
        <FileUpload />
      </div>
      <p className="text-xs text-center text-slate-400 mb-16">
        PDF files only &nbsp;·&nbsp; For educational use &nbsp;·&nbsp; Not legal
        advice
      </p>

      {/* Features grid */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-6">
          What it does
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ Icon, iconBg, iconColor, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow duration-150"
            >
              <div
                className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center mb-3`}
              >
                <Icon className={`${iconColor}`} size={18} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1 text-sm">
                {title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
