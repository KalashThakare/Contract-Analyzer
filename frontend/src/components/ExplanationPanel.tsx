"use client";

import {
  MessageSquare,
  AlertTriangle,
  Tag,
  CheckSquare,
  Flag,
  X,
  Cpu,
  Users,
  DollarSign,
  Calendar,
} from "lucide-react";
import type { Clause } from "@/types";

const RISK_COLOR: Record<string, string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#059669",
};

interface ExplanationPanelProps {
  clause: Clause | null;
  onClose?: () => void;
}

export default function ExplanationPanel({
  clause,
  onClose,
}: ExplanationPanelProps) {
  if (!clause) {
    return (
      <div className="panel-card p-6 flex flex-col items-center justify-center h-56 gap-3 text-slate-400">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-slate-300" />
        </div>
        <p className="text-sm text-center text-slate-400">
          Select a clause to view the AI explanation
        </p>
      </div>
    );
  }

  const color = RISK_COLOR[clause.risk_level];

  return (
    <div className="panel-card overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-slate-100 flex items-start justify-between gap-2"
        style={{ borderLeftWidth: 3, borderLeftColor: color }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`risk-badge ${clause.risk_level}`}>
              {clause.risk_level} risk
            </span>
            {clause.is_unfair && (
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3" />
                Unfair
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">
            {clause.type}
          </h3>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <div className="text-right">
            <div
              className="text-2xl font-bold tabular-nums"
              style={{ color }}
            >
              {clause.risk_score}
            </div>
            <div className="text-xs text-slate-400">/ 100</div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-320px)]">
        {/* Full clause text */}
        <div>
          <p className="section-heading">Clause Text</p>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-lg">
            {clause.text}
          </p>
        </div>

        {/* Top risk terms (SHAP) */}
        {clause.top_risk_terms?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <p className="section-heading mb-0">SHAP Risk Terms</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {clause.top_risk_terms.map((term) => (
                <span
                  key={term}
                  className="bg-red-50 text-red-700 border border-red-200 text-xs px-2 py-0.5 rounded font-medium"
                >
                  {term}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* LLM Explanation */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <p className="section-heading mb-0">Why This Is Risky</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-slate-800 leading-relaxed">
              {clause.explanation ?? "No explanation available."}
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Groq · Llama 3.1 &nbsp;·&nbsp; Not legal advice
          </p>
        </div>

        {/* Entities in this clause */}
        {(clause.entities?.parties?.length > 0 ||
          clause.entities?.amounts?.length > 0 ||
          clause.entities?.dates?.length > 0) && (
          <div>
            <p className="section-heading">Entities in Clause</p>
            <div className="text-sm text-slate-600 space-y-1.5">
              {clause.entities.parties?.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{clause.entities.parties.join(", ")}</span>
                </div>
              )}
              {clause.entities.amounts?.length > 0 && (
                <div className="flex items-start gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{clause.entities.amounts.join(", ")}</span>
                </div>
              )}
              {clause.entities.dates?.length > 0 && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{clause.entities.dates.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors">
            <CheckSquare className="w-3.5 h-3.5" />
            Mark Reviewed
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors border border-red-200">
            <Flag className="w-3.5 h-3.5" />
            Flag for Lawyer
          </button>
        </div>
      </div>
    </div>
  );
}
