"use client";

import { FileText, Clock, Layers } from "lucide-react";
import type { DocumentMeta, Summary, RiskLevel } from "@/types";

const RISK_COLOR: Record<RiskLevel, string> = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-emerald-600",
};
const RISK_RING: Record<RiskLevel, string> = {
  high: "ring-red-200",
  medium: "ring-amber-200",
  low: "ring-emerald-200",
};

interface DocumentSummaryProps {
  document: DocumentMeta;
  summary: Summary;
}

export default function DocumentSummary({
  document: doc,
  summary,
}: DocumentSummaryProps) {
  const total =
    summary.high_risk_count + summary.medium_risk_count + summary.low_risk_count || 1;
  const highPct = Math.round((summary.high_risk_count / total) * 100);
  const mediumPct = Math.round((summary.medium_risk_count / total) * 100);
  const lowPct = 100 - highPct - mediumPct;

  return (
    <div className="panel-card p-5">
      <h2 className="section-heading">Document</h2>

      {/* Filename + metadata */}
      <div className="flex items-start gap-2.5 mb-4">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-slate-500" />
        </div>
        <div className="min-w-0">
          <p className="text-slate-800 font-medium text-sm truncate">
            {doc.filename ?? "Contract.pdf"}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {doc.pages} pages
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {(doc.processing_time_ms / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </div>

      {/* Risk score */}
      <div
        className={`flex flex-col items-center py-4 rounded-xl ring-2 ${RISK_RING[summary.risk_level]} bg-white mb-4`}
      >
        <div
          className={`text-5xl font-bold tabular-nums ${RISK_COLOR[summary.risk_level]}`}
        >
          {summary.overall_risk_score}
        </div>
        <div className="text-slate-400 text-xs mt-1">overall risk / 100</div>
        <span className={`risk-badge ${summary.risk_level} mt-2`}>
          {summary.risk_level} risk
        </span>
      </div>

      {/* Risk distribution bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Distribution</span>
          <span>{doc.total_clauses} clauses</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-px">
          {highPct > 0 && (
            <div
              className="bg-red-500 rounded-l-full"
              style={{ width: `${highPct}%` }}
              title={`High: ${summary.high_risk_count}`}
            />
          )}
          {mediumPct > 0 && (
            <div
              className="bg-amber-400"
              style={{ width: `${mediumPct}%` }}
              title={`Medium: ${summary.medium_risk_count}`}
            />
          )}
          {lowPct > 0 && (
            <div
              className="bg-emerald-400 rounded-r-full"
              style={{ width: `${lowPct}%` }}
              title={`Low: ${summary.low_risk_count}`}
            />
          )}
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-red-600 font-medium">
            {summary.high_risk_count} high
          </span>
          <span className="text-amber-600 font-medium">
            {summary.medium_risk_count} medium
          </span>
          <span className="text-emerald-600 font-medium">
            {summary.low_risk_count} low
          </span>
        </div>
      </div>
    </div>
  );
}
