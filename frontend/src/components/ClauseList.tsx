"use client";

/**
 * Scrollable clause list with risk/unfairness filters and selection callbacks.
 */

import { useState } from "react";
import ClauseCard from "./ClauseCard";
import type { Clause, Summary } from "@/types";

const FILTERS = ["All", "High Risk", "Medium Risk", "Low Risk", "Unfair"] as const;

function getCount(f: string, summary: Summary): number | null {
  if (f === "High Risk") return summary.high_risk_count;
  if (f === "Medium Risk") return summary.medium_risk_count;
  if (f === "Low Risk") return summary.low_risk_count;
  return null;
}

function filterClauses(clauses: Clause[], active: string): Clause[] {
  // Keep filtering logic centralized so tabs stay declarative in JSX.
  switch (active) {
    case "High Risk":
      return clauses.filter((c) => c.risk_level === "high");
    case "Medium Risk":
      return clauses.filter((c) => c.risk_level === "medium");
    case "Low Risk":
      return clauses.filter((c) => c.risk_level === "low");
    case "Unfair":
      return clauses.filter((c) => c.is_unfair);
    default:
      return clauses;
  }
}

interface ClauseListProps {
  clauses: Clause[];
  selectedId: number | null | undefined;
  onSelect: (clause: Clause) => void;
  summary: Summary;
}

export default function ClauseList({
  clauses,
  selectedId,
  onSelect,
  summary,
}: ClauseListProps) {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const filtered = filterClauses(clauses, activeFilter);

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-4 p-1 bg-slate-100 rounded-lg">
        {FILTERS.map((f) => {
          const count = getCount(f, summary);
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5
                ${
                  activeFilter === f
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {f}
              {count !== null && (
                <span
                  className={`text-xs tabular-nums rounded px-1.5 py-0.5
                  ${activeFilter === f ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <p className="text-xs text-slate-400 mb-3">
        Showing{" "}
        <span className="font-semibold text-slate-600">{filtered.length}</span>{" "}
        of {clauses.length} clauses
      </p>

      {/* Clause cards */}
      <div className="overflow-y-auto flex-1 pr-0.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">No clauses match this filter.</p>
          </div>
        ) : (
          filtered.map((clause) => (
            <ClauseCard
              key={clause.id}
              clause={clause}
              isSelected={clause.id === selectedId}
              onClick={() => onSelect(clause)}
            />
          ))
        )}
      </div>
    </div>
  );
}
