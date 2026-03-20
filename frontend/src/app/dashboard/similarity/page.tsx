"use client";

import { useAnalysis } from "@/context/AnalysisContext";
import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import { Sparkles, ArrowRightLeft, Target, GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SimilarityAnalysis() {
  const { result } = useAnalysis();

  if (!result) {
    return <div className="flex h-[50vh] items-center justify-center p-6 text-center text-sm font-medium text-muted-foreground border border-border bg-card rounded-md border-dashed">Awaiting document ingestion to populate telemetry grid.</div>;
  }

  // Filter out clauses that have no similarity score, then sort from lowest to highest similarity
  const sortedClauses = [...result.clauses]
    .filter(c => c.similarity_score !== null && c.similarity_score !== undefined)
    .sort((a,b) => (a.similarity_score! - b.similarity_score!))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <AnimatedContainer animation="fade-in" duration={0.2} className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
           <GitCompare className="w-5 h-5 text-muted-foreground" />
           Standard Template Deviations
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
          Compares the uploaded contract against your company's standard, safe templates. Clauses that score low are likely heavily modified and require manual review.
        </p>
      </AnimatedContainer>

      <AnimatedContainer animation="slide-up" staggerChildren={0.05} className="space-y-4">
        {sortedClauses.map((clause, i) => {
           const similarityPct = Math.round((clause.similarity_score || 0) * 100);
           const barColor = similarityPct < 50 ? "bg-red-500" : similarityPct < 85 ? "bg-amber-500" : "bg-emerald-500";
           const textColor = similarityPct < 50 ? "text-red-600 dark:text-red-400" : similarityPct < 85 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";

           return (
             <div key={i} className="glass-panel p-4 rounded-md shadow-sm flex flex-col md:flex-row gap-0 overflow-hidden relative group">
               
               <div className="flex-1 space-y-2 p-3 bg-muted/10 border-r border-border border-dashed">
                 <div className="flex items-center gap-2">
                   <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-1.5 py-0.5 rounded border border-border">Uploaded Contract Text</h3>
                 </div>
                 <div className="text-xs leading-relaxed text-foreground min-h-[60px]">
                   {clause.text}
                 </div>
               </div>

               <div className="flex flex-col items-center justify-center min-w-[100px] px-3 bg-background z-10 shrink-0">
                  <div className="text-center w-full">
                    <span className={cn("text-xl font-bold tabular-nums tracking-tighter block leading-none mb-1", textColor)}>
                      {similarityPct}%
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Match</span>
                  </div>
                  <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-2">
                     <div className={cn("h-full", barColor)} style={{ width: `${similarityPct}%` }} />
                  </div>
               </div>

               <div className="flex-1 space-y-2 p-3 bg-muted/30 border-l border-border border-dashed opacity-80">
                 <div className="flex items-center gap-2">
                   <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-background border border-border px-1.5 py-0.5 rounded">Standard Template Match</h3>
                 </div>
                 <div className="text-xs leading-relaxed text-muted-foreground min-h-[60px] italic">
                    <span className="border-b border-border border-dashed font-semibold mr-1">{clause.type} Policy:</span>
                    {clause.matched_template || "No closely matching policy baseline found."}
                 </div>
               </div>

             </div>
           );
        })}
      </AnimatedContainer>
    </div>
  );
}
