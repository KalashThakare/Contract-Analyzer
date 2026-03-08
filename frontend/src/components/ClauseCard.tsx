"use client";

import { useState } from "react";
import { AlertTriangle, User, ChevronRight } from "lucide-react";
import type { Clause } from "@/types";

const RISK_BORDER: Record<string, string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#059669",
};
const MAX_PREVIEW = 200;

interface ClauseCardProps {
  clause: Clause;
  isSelected: boolean;
  onClick: () => void;
}

export default function ClauseCard({
  clause,
  isSelected,
  onClick,
}: ClauseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const preview =
    clause.text.length > MAX_PREVIEW && !expanded
      ? clause.text.slice(0, MAX_PREVIEW) + "..."
      : clause.text;

  return (
    <div
      className={`clause-card ${clause.risk_level} ${isSelected ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
      style={{ borderLeftColor: RISK_BORDER[clause.risk_level] }}
      onClick={onClick}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`risk-badge ${clause.risk_level}`}>
            {clause.risk_level}
          </span>
          <span className="font-semibold text-slate-800 text-sm">
            {clause.type}
          </span>
          {clause.is_unfair && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" />
              Unfair
            </span>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div
            className="text-lg font-bold tabular-nums"
            style={{ color: RISK_BORDER[clause.risk_level] }}
          >
            {clause.risk_score}
          </div>
          <div className="text-xs text-slate-400">/ 100</div>
        </div>
      </div>

      {/* Clause text */}
      <p className="text-slate-500 text-sm leading-relaxed mb-2">{preview}</p>
      {clause.text.length > MAX_PREVIEW && (
        <button
          className="text-blue-500 text-xs hover:text-blue-700 mb-2"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between text-xs text-slate-400 mt-1 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span>Confidence: {(clause.confidence * 100).toFixed(1)}%</span>
          {clause.entities?.parties?.length > 0 && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {clause.entities.parties.slice(0, 1).join(", ")}
            </span>
          )}
        </div>
        <button
          className="flex items-center gap-0.5 text-blue-500 hover:text-blue-700 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Explain
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
