"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useAnalysis } from "@/context/AnalysisContext";
import { getContract } from "@/services/api";
import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import {
  FileText, ShieldAlert, Cpu, CheckCircle2, ChevronDown,
  AlignLeft, Info, Loader2, Brain, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Clause } from "@/types";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";

// ─── Improved Fallback Risk Analyser ────────────────────────────────────────
// Covers a wide taxonomy of legal risk patterns. Returns a human-readable
// analysis when the Cloud LLM has not yet returned an answer for this clause.
const HIGH_RISK_PATTERNS: { phrase: string; label: string }[] = [
  { phrase: "indemnif", label: "Indemnification obligation" },
  { phrase: "unlimited liability", label: "Unlimited liability exposure" },
  { phrase: "irrevocable", label: "Irrevocable rights assignment" },
  { phrase: "in perpetuity", label: "Perpetual rights grant" },
  { phrase: "shall not be liable", label: "Unilateral liability waiver" },
  { phrase: "sole discretion", label: "Unilateral decision power" },
  { phrase: "liquidated damages", label: "Pre-determined penalty clause" },
  { phrase: "consequential damages", label: "Consequential damages exposure" },
  { phrase: "waive", label: "Rights waiver" },
  { phrase: "termination for convenience", label: "Unilateral termination right" },
  { phrase: "force majeure", label: "Force majeure carve-out" },
  { phrase: "intellectual property", label: "IP ownership clause" },
  { phrase: "non-compete", label: "Non-compete restriction" },
  { phrase: "exclusiv", label: "Exclusivity obligation" },
];

const MEDIUM_RISK_PATTERNS: { phrase: string; label: string }[] = [
  { phrase: "warranty", label: "Warranty obligation" },
  { phrase: "representation", label: "Representations & warranties" },
  { phrase: "dispute resolution", label: "Dispute resolution mechanism" },
  { phrase: "governing law", label: "Choice of law clause" },
  { phrase: "jurisdiction", label: "Jurisdiction clause" },
  { phrase: "confidential", label: "Confidentiality obligation" },
  { phrase: "penalty", label: "Penalty provision" },
  { phrase: "interest", label: "Interest / late payment clause" },
  { phrase: "arbitration", label: "Arbitration clause" },
  { phrase: "assignment", label: "Assignment restriction" },
];

function buildFallback(text: string, risk_score: number) {
  const lower = text.toLowerCase();

  const highMatches = HIGH_RISK_PATTERNS.filter(p => lower.includes(p.phrase));
  const medMatches  = MEDIUM_RISK_PATTERNS.filter(p => lower.includes(p.phrase));

  const tokens: Array<{ word: string; risk: "high" | "medium" }> = [
    ...highMatches.flatMap(p =>
      p.phrase.split(" ").map(w => ({ word: w.replace(/\*/g, ""), risk: "high" as const }))
    ),
    ...medMatches.flatMap(p =>
      p.phrase.split(" ").map(w => ({ word: w.replace(/\*/g, ""), risk: "medium" as const }))
    ),
  ];

  if (risk_score < 30 && highMatches.length === 0 && medMatches.length === 0) {
    return {
      tokens: [],
      summary: "This clause appears standard with no elevated risk signals detected by the local pattern engine.",
    };
  }

  const detected = [
    ...highMatches.map(p => p.label),
    ...medMatches.map(p => p.label),
  ];

  const summary =
    detected.length > 0
      ? `Pattern analysis identified: ${detected.slice(0, 3).join("; ")}. ` +
        (risk_score >= 70
          ? "This clause poses significant liability exposure and requires legal review."
          : "Moderate risk signals warrant careful negotiation of these terms.")
      : `Risk regressor scored this clause at ${risk_score}/100. ` +
        "No specific high-risk phrase patterns were matched by the local engine.";

  return { tokens, summary };
}

// ─────────────────────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<Clause>();

export default function ClauseExplorer() {
  const { result, isAnalyzing, llmClauseError, setResult } = useAnalysis();
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Progressive polling: while LLM is running, fetch fresh partial results every 5s.
  // Each LLM chunk is saved to DB immediately by the backend, so polling sees live progress.
  useEffect(() => {
    if (!isAnalyzing || !result?.document?.document_id) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const fresh = await getContract(result.document.document_id);
        setResult(fresh);
      } catch {
        // Non-fatal: polling failure doesn't stop LLM analysis
      }
    }, 15000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isAnalyzing, result?.document?.document_id, setResult]);

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: "ID",
      cell: info => (
        <span className="font-mono text-muted-foreground">
          {String(info.getValue()).padStart(3, "0")}
        </span>
      ),
      size: 60,
    }),
    columnHelper.accessor("type", {
      header: "Type",
      cell: info => <span className="font-medium">{info.getValue()}</span>,
      size: 140,
    }),
    columnHelper.accessor("risk_level", {
      header: "Risk",
      cell: info => {
        const val = info.getValue();
        return (
          <div className="flex items-center gap-1.5 capitalize">
            <div className={cn("risk-indicator-dot", val === "high" ? "high" : val === "medium" ? "medium" : "low")} />
            <span className="text-xs">{val}</span>
          </div>
        );
      },
      size: 90,
    }),
    columnHelper.accessor("confidence", {
      header: "Conf",
      cell: info => (
        <span className="text-muted-foreground">{(info.getValue() * 100).toFixed(0)}%</span>
      ),
      size: 70,
    }),
    columnHelper.accessor("is_unfair", {
      header: "Unfair",
      cell: info =>
        info.getValue() ? (
          <span className="text-red-500 font-semibold text-[10px] uppercase tracking-wider">Yes</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      size: 70,
    }),
    columnHelper.accessor("text", {
      header: "Text Excerpt",
      cell: info => (
        <span className="text-muted-foreground truncate block w-full max-w-[200px] sm:max-w-xs">
          {info.getValue()}
        </span>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: result?.clauses || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ── Explainer data for the selected clause ──────────────────────────────
  const explainerData = useMemo(() => {
    if (!selectedClause) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = selectedClause as any;
    const hasAiData = c.explanation || (Array.isArray(c.top_risk_terms) && c.top_risk_terms.length > 0);

    if (hasAiData) {
      const terms: string[] = c.top_risk_terms || [];
      const tokens = terms.flatMap((term: string) =>
        term.toLowerCase().split(" ").map(w => ({
          word: w.replace(/[^a-z0-9]/g, ""),
          risk: "high" as const,
        }))
      );
      return {
        tokens,
        summary: c.explanation as string,
        recommendation: c.recommendation as string | undefined,
        isAi: true,
      };
    }

    return {
      ...buildFallback(selectedClause.text, selectedClause.risk_score),
      recommendation: undefined,
      isAi: false,
    };
  }, [selectedClause]);

  // ── Guard: no result yet ────────────────────────────────────────────────
  if (!result) {
    return (
      <div className="flex h-[50vh] items-center justify-center p-6 text-center text-sm font-medium text-muted-foreground border border-border bg-card rounded-md border-dashed">
        Awaiting document ingestion to populate telemetry grid.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-120px)]">

      {/* ── Cloud LLM Loading Banner ──────────────────────────────────────── */}
      {isAnalyzing && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-300 text-xs font-medium animate-pulse">
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
          <Brain className="w-4 h-4 shrink-0" />
          <span>
            LLM is currently writing deep semantic explanations in the background. The text will appear automatically... Fast Model based scores are already shown below.
          </span>
        </div>
      )}

      {!isAnalyzing && llmClauseError && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            LLM explanation generation failed. DL Models based analysis is still shown below. Re-upload the contract to retry.
          </span>
        </div>
      )}

      {/* ── Main grid + inspector ─────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">

        {/* Left: Data Grid */}
        <div className={cn(
          "flex flex-col bg-card border border-border shadow-sm rounded-lg overflow-hidden transition-all duration-300",
          selectedClause ? "xl:w-2/3" : "w-full"
        )}>

          {/* Table Toolbar */}
          <div className="h-12 border-b border-border bg-muted/50 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Clause Analysis</h2>
              <span className="px-1.5 py-0.5 ml-2 bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-widest rounded" title="Total number of clauses found">
                {result.clauses.length} clauses
              </span>
            </div>
            {isAnalyzing && (
              <span className="flex items-center gap-1.5 text-[10px] text-indigo-500 font-semibold" title="LLM is analyzing the text">
                <Loader2 className="w-3 h-3 animate-spin" /> LLM Active
              </span>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto bg-card custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : "auto" }}
                        className="h-9 px-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border select-none cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ChevronDown className="w-3 h-3 rotate-180 text-foreground" />,
                            desc: <ChevronDown className="w-3 h-3 text-foreground" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const hasLlm = !!(row.original as any).explanation;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedClause(row.original)}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group",
                        selectedClause?.id === row.original.id && "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-3 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                      {/* Small indicator that Cloud LLM data is ready */}
                      {hasLlm && (
                        <td className="pr-3 align-middle">
                          <span title="LLM explanation generated">
                            <Brain className="w-3 h-3 text-indigo-400" />
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {table.getRowModel().rows.length === 0 && (
              <div className="w-full h-full flex items-center justify-center p-8 text-xs text-muted-foreground">
                No vectors pass filter parameters.
              </div>
            )}
          </div>
        </div>

        {/* Right: Inspector Console */}
        {selectedClause && explainerData && (
          <AnimatedContainer animation="slide-up" duration={0.2} className="w-full xl:w-1/3 flex flex-col gap-4 overflow-y-auto">
            <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col h-full relative overflow-hidden">

              {/* Header */}
              <div className="h-12 border-b border-border bg-muted/30 flex items-center px-4 justify-between shrink-0">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" /> Clause Details
                  {explainerData.isAi && (
                    <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 text-[9px] font-bold uppercase tracking-widest rounded" title="This explanation was generated by LLM">
                      LLM Explanation
                    </span>
                  )}
                </h3>
                <button onClick={() => setSelectedClause(null)} className="text-xs text-muted-foreground hover:text-foreground">
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md bg-muted/40 border border-border/50" title="The legal category of this clause">
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Clause Type</span>
                    <span className="text-sm font-semibold text-foreground">{selectedClause.type}</span>
                  </div>
                  <div className="p-3 rounded-md bg-muted/40 border border-border/50" title="How risky this clause is compared to standard agreements">
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
                      Risk Score
                      <div className={cn(
                        "risk-indicator-dot",
                        selectedClause.risk_level === "high" ? "high" : selectedClause.risk_level === "medium" ? "medium" : "low"
                      )} />
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {selectedClause.risk_score}
                      <span className="text-[10px] font-normal text-muted-foreground"> /100</span>
                    </span>
                  </div>
                </div>

                {/* Clause Text + Highlighting */}
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
                    <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" /> Original Text
                  </h4>
                  <div className="p-3 rounded-md border border-border bg-background text-sm leading-relaxed text-muted-foreground shadow-inner">
                    {selectedClause.text.split(" ").map((word, i) => {
                      const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
                      const isHigh = explainerData.tokens.some(t => t.word === clean && t.risk === "high");
                      const isMed  = explainerData.tokens.some(t => t.word === clean && t.risk === "medium");

                      if (isHigh)
                        return (
                          <mark key={i} className="bg-red-500/20 text-red-700 dark:text-red-400 font-medium px-0.5 rounded-sm mx-[1px]">
                            {word}{" "}
                          </mark>
                        );
                      if (isMed)
                        return (
                          <mark key={i} className="bg-amber-500/20 text-amber-700 dark:text-amber-400 font-medium px-0.5 rounded-sm mx-[1px]">
                            {word}{" "}
                          </mark>
                        );
                      return word + " ";
                    })}
                  </div>
                </div>

                {/* Explanation / Pattern Analysis */}
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
                    <Info className={cn("w-3.5 h-3.5", explainerData.isAi ? "text-indigo-500" : "text-primary")} />
                    {explainerData.isAi ? "LLM Explanation" : "Basic Pattern Match"}
                  </h4>
                  <div className={cn(
                    "p-3 rounded-md border text-xs leading-relaxed shadow-sm",
                    explainerData.isAi
                      ? "border-indigo-500/30 bg-indigo-500/5 text-indigo-950 dark:text-indigo-200"
                      : "border-primary/20 bg-primary/5 text-foreground/80"
                  )}>
                    {explainerData.summary}
                  </div>
                </div>

                {/* Resolution Strategy (LLM only) */}
                {explainerData.recommendation && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Recommendation
                    </h4>
                    <div className="p-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200 text-xs leading-relaxed shadow-sm font-medium">
                      {explainerData.recommendation}
                    </div>
                  </div>
                )}

                {/* LLM Pending badge */}
                {isAnalyzing && !explainerData.isAi && (
                  <div className="flex items-center gap-2 p-3 rounded-md border border-indigo-500/20 bg-indigo-500/5 text-indigo-500 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    LLM explanation for this clause is currently generating…
                  </div>
                )}

                {!isAnalyzing && llmClauseError && !explainerData.isAi && (
                  <div className="flex items-center gap-2 p-3 rounded-md border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    LLM explanation unavailable for this clause. Showing DL-based analysis only.
                  </div>
                )}

                {/* Unfair clause alert */}
                {selectedClause.is_unfair && (
                  <div className="flex gap-2 p-3 rounded-md border border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <p className="font-medium leading-relaxed">
                      This clause contains language that may be legally unfair or heavily one-sided.
                    </p>
                  </div>
                )}

              </div>
            </div>
          </AnimatedContainer>
        )}
      </div>
    </div>
  );
}
