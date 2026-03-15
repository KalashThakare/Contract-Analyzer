"use client";

import { useAnalysis } from "@/context/AnalysisContext";
import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import { Search, AlertCircle, FileWarning, HelpCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/types";

const MISSING_CLAUSE_INSIGHTS: Record<string, { why: string, risk: string, example: string }> = {
  "Confidentiality": {
    why: "Protects sensitive trade secrets from unauthorized disclosure.",
    risk: "Critical: Competitors could legally access proprietary data.",
    example: "The Receiving Party shall not disclose, reproduce, or use any Confidential Information for any purpose outside the scope of this Agreement."
  },
  "Termination": {
    why: "Defines the exact mechanisms to end the contract safely.",
    risk: "High: Entering a perpetual contract without an exit parameter.",
    example: "Either party may terminate this Agreement at any time with thirty (30) days prior written notice."
  },
  "Dispute Resolution": {
    why: "Sets venue and method (arbitration vs. courts) for disagreements.",
    risk: "Medium: Could lead to highly volatile out-of-state litigation costs.",
    example: "Any dispute arising hereunder shall be settled by binding arbitration in the State of Delaware."
  },
  "Governing Law": {
    why: "Establishes which legal framework interprets the document.",
    risk: "Medium: Choice-of-law conflicts generating jurisdictional friction.",
    example: "This Agreement shall be governed by and construed under the laws of New York."
  },
  "Indemnification": {
    why: "Allocates liability for damages between parties.",
    risk: "Critical: Uncapped liability exposure to third-party claims.",
    example: "Party A agrees to indemnify, defend, and hold harmless Party B from all third-party claims arising out of Party A's negligence."
  }
};

const DEFAULT_INSIGHT = {
  why: "A standard structural component expected in documents of this nature is absent.",
  risk: "Unquantified Risk: Consult legal counsel to evaluate omission liability.",
  example: "[Standard corporate policy text recommended.]"
};

export default function MissingClauses() {
  const { result } = useAnalysis();

  if (!result) {
    return <div className="flex h-[50vh] items-center justify-center p-6 text-center text-sm font-medium text-muted-foreground border border-border bg-card rounded-md border-dashed">Awaiting document ingestion to populate telemetry grid.</div>;
  }

  const missingClauses: string[] = (result as any).missing_clauses || ["Confidentiality", "Dispute Resolution"];

  return (
    <div className="space-y-6">
      <AnimatedContainer animation="fade-in" duration={0.2} className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
           <Search className="w-5 h-5 text-muted-foreground" />
           Absent Assertions Checklist
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-xl">
          Model inference cross-referenced against expected structural parameters. Identifying null values in required ontological classes.
        </p>
      </AnimatedContainer>

      {missingClauses.length === 0 ? (
        <AnimatedContainer animation="fade-in" className="glass-panel p-6 text-center rounded-md mt-6 bg-emerald-500/5 border-emerald-500/20">
           <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
           <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Total Coverage Achieved</h3>
           <p className="text-xs text-emerald-600/80">All standardized baseline policies were detected.</p>
        </AnimatedContainer>
      ) : (
        <AnimatedContainer animation="slide-up" staggerChildren={0.05} className="bg-card border border-border rounded-lg shadow-sm overflow-hidden mt-4">
           
           <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-muted/30">
                 <tr>
                    <th className="h-9 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border w-[20%]">Structural Node</th>
                    <th className="h-9 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border w-[35%]">Implication Trace</th>
                    <th className="h-9 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border w-[10%]">Severity</th>
                    <th className="h-9 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border w-[35%]">Baseline Expectation</th>
                 </tr>
              </thead>
              <tbody>
                {missingClauses.map((clauseName, i) => {
                  const insight = MISSING_CLAUSE_INSIGHTS[clauseName] || DEFAULT_INSIGHT;
                  const isCritical = insight.risk.includes('Critical') || insight.risk.includes('High');
                  
                  return (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                       <td className="p-4 align-top">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                             <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" /> {clauseName}
                          </span>
                       </td>
                       <td className="p-4 align-top text-muted-foreground leading-relaxed">
                          {insight.why}
                       </td>
                       <td className="p-4 align-top">
                          <span className={cn(
                             "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border leading-none inline-flex whitespace-nowrap",
                             isCritical ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          )}>
                             {insight.risk.split(":")[0]}
                          </span>
                       </td>
                       <td className="p-4 align-top">
                          <div className="font-mono text-[10px] text-muted-foreground italic border-l-2 border-border pl-2 py-0.5 bg-background shadow-inner">
                             "{insight.example}"
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
