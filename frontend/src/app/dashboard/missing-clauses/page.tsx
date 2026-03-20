"use client";

import { useAnalysis } from "@/context/AnalysisContext";
import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import { Search, AlertCircle, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MissingClause } from "@/types";

export default function MissingClauses() {
  const { result, isAnalyzing, isMissingAnalyzing, llmMissingError } = useAnalysis();

  if (!result) {
    return (
      <div className="flex h-[50vh] items-center justify-center p-6 text-center text-sm font-medium text-muted-foreground border border-border bg-card rounded-md border-dashed">
        Upload a contract to discover any missing or absent clauses.
      </div>
    );
  }

  const missingClauses: MissingClause[] = result.missing_clauses || [];

  return (
    <div className="space-y-6">
      <AnimatedContainer animation="fade-in" duration={0.2} className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
           <Search className="w-5 h-5 text-muted-foreground" />
           Missing Clauses
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-xl">
          Important legal clauses that appear to be missing from your contract. Each missing clause could expose you to legal risk.
        </p>
      </AnimatedContainer>

      {/* Queued state — Phase 1 clause analysis is still running */}
      {isAnalyzing && !isMissingAnalyzing && (
        <AnimatedContainer
          animation="fade-in"
          className="flex items-center gap-3 p-4 bg-muted/30 text-muted-foreground rounded-lg border border-border border-dashed"
        >
          <div className="relative shrink-0">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/50" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Queued — Waiting for Clause Analysis
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Missing clause detection will start automatically once LLM finishes reviewing all clauses. No action needed.
            </p>
          </div>
        </AnimatedContainer>
      )}

      {/* Loading state — Phase 2 missing clause LLM is now running */}
      {isMissingAnalyzing && (
        <AnimatedContainer
          animation="fade-in"
          className="items-center gap-3 p-4 bg-primary/5 text-primary rounded-lg border border-primary/20 flex shadow-sm"
        >
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold tracking-tight">LLM reviewing Subtext...</h3>
            <p className="text-xs text-primary/80">
              Reading the full contract to identify any dangerous missing clauses. This may take a moment.
            </p>
          </div>
        </AnimatedContainer>
      )}

      {/* Error state — LLM failed */}
      {!isMissingAnalyzing && llmMissingError && missingClauses.length === 0 && (
        <AnimatedContainer animation="fade-in" className="p-5 rounded-lg border border-amber-500/30 bg-amber-500/5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">
                Missing Clause Detection Unavailable
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                LLM could not generate missing clause suggestions for this contract. This can happen due to API timeout, network issues, or high server load.
              </p>
              <p className="text-[10px] font-mono text-amber-600/70 dark:text-amber-400/70 break-all">
                {llmMissingError}
              </p>
              <div className="mt-3 pt-3 border-t border-amber-500/20">
                <p className="text-xs text-muted-foreground">
                  <strong>What you can do:</strong> Re-upload the contract to try again, or review the clause analysis results which are available on other pages.
                </p>
              </div>
            </div>
          </div>
        </AnimatedContainer>
      )}

      {/* Success: no clauses missing */}
      {!isMissingAnalyzing && !llmMissingError && missingClauses.length === 0 && (
        <AnimatedContainer animation="fade-in" className="glass-panel p-6 text-center rounded-md mt-6 bg-emerald-500/5 border-emerald-500/20">
           <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
           <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">All Standard Clauses Present</h3>
           <p className="text-xs text-emerald-600/80">No obviously missing clauses were detected in this contract.</p>
        </AnimatedContainer>
      )}

      {/* Results table */}
      {missingClauses.length > 0 && (
        <AnimatedContainer animation="slide-up" staggerChildren={0.05} className="bg-card border border-border rounded-lg shadow-sm overflow-hidden mt-4">
           
           <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-muted/30">
                 <tr>
                    <th className="h-9 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border w-[20%]">Clause Name</th>
                    <th className="h-9 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border w-[35%]">Why It Matters</th>
                    <th className="h-9 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border w-[10%]">Risk</th>
                    <th className="h-9 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border w-[35%]">Suggested Wording</th>
                 </tr>
              </thead>
              <tbody>
                {missingClauses.map((clause, i) => {
                  const isCritical =
                    clause.risk_level?.toLowerCase().includes("critical") ||
                    clause.risk_level?.toLowerCase().includes("high");
                  
                  return (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                       <td className="p-4 align-top">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                             <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                             {clause.name}
                          </span>
                       </td>
                       <td className="p-4 align-top text-muted-foreground leading-relaxed">
                          {clause.why_it_matters}
                       </td>
                       <td className="p-4 align-top">
                          <span className={cn(
                             "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border leading-none inline-flex whitespace-nowrap",
                             isCritical
                               ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                               : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          )}>
                             {clause.risk_level}
                          </span>
                       </td>
                       <td className="p-4 align-top">
                          <div className="font-mono text-[10px] text-muted-foreground italic border-l-2 border-border pl-2 py-0.5 bg-background shadow-inner">
                             &ldquo;{clause.example_wording}&rdquo;
                          </div>
                       </td>
                    </tr>
                  );
                })}
              </tbody>
           </table>

        </AnimatedContainer>
      )}
    </div>
  );
}
