"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import { useAnalysis } from "@/context/AnalysisContext";
import DocumentSummary from "@/components/DocumentSummary";
import EntityPanel from "@/components/EntityPanel";
import ClauseList from "@/components/ClauseList";
import ExplanationPanel from "@/components/ExplanationPanel";
import RiskGauge from "@/components/RiskGauge";
import type { Clause } from "@/types";

export default function AnalysisPage() {
  const { result } = useAnalysis();
  const router = useRouter();
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <Upload className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <p className="text-slate-700 font-medium mb-1">
            No analysis results
          </p>
          <p className="text-slate-400 text-sm mb-4">
            Upload a document to get started.
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload a Document
        </button>
      </div>
    );
  }

  const { document: doc, summary, entities, clauses } = result;

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          New analysis
        </button>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[248px_1fr_312px] gap-4">
        {/* Left column */}
        <div className="flex flex-col gap-0">
          <DocumentSummary document={doc} summary={summary} />
          <RiskGauge summary={summary} />
          <EntityPanel entities={entities} />
        </div>

        {/* Center column */}
        <div className="min-h-0">
          <h2 className="section-heading">Clause Analysis</h2>
          <ClauseList
            clauses={clauses}
            selectedId={selectedClause?.id}
            onSelect={setSelectedClause}
            summary={summary}
          />
        </div>

        {/* Right column */}
        <div>
          <h2 className="section-heading">AI Explanation</h2>
          <ExplanationPanel
            clause={selectedClause}
            onClose={() => setSelectedClause(null)}
          />
        </div>
      </div>
    </div>
  );
}
