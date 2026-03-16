"use client";

import { useState, useMemo } from "react";
import { useAnalysis } from "@/context/AnalysisContext";
import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import { 
  FileText, ShieldAlert, Cpu, CheckCircle2, ChevronDown, AlignLeft, Info, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Clause } from "@/types";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState
} from "@tanstack/react-table";

// Mock SHAP Explainer
const generateExplainability = (text: string, risk_score: number) => {
  const highRiskTokens = ["unlimited", "perpetual", "indemnify", "irrevocable", "liability", "damages", "breach"];
  const mediumRiskTokens = ["shall", "immediately", "exclusive", "warranty", "penalty", "dispute"];
  
  if (risk_score < 30) return { tokens: [], summary: "Standard baseline assertion. No unusual legal entropy detected." };
  
  let flagged: Array<{word: string, risk: "high"|"medium"}> = [];
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ");
  
  words.forEach(w => {
    if (highRiskTokens.includes(w)) flagged.push({word: w, risk: "high"});
    else if (mediumRiskTokens.includes(w)) flagged.push({word: w, risk: "medium"});
  });
  
  const hCount = flagged.filter(f => f.risk === "high").length;
  if (risk_score >= 70) return { tokens: flagged, summary: `Model identified ${hCount} critical liability anchor(s) strongly contributing to high risk matrix.` };
  return { tokens: flagged, summary: "Elevated friction detected due to stringent modifier utilization." };
};

const columnHelper = createColumnHelper<Clause>();

export default function ClauseExplorer() {
  const { result } = useAnalysis();
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // React Table Configuration
  const columns = useMemo(() => [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => <span className="font-mono text-muted-foreground">{String(info.getValue()).padStart(3, '0')}</span>,
      size: 60,
    }),
    columnHelper.accessor('type', {
      header: 'Taxonomy',
      cell: info => <span className="font-medium">{info.getValue()}</span>,
      size: 140,
    }),
    columnHelper.accessor('risk_level', {
      header: 'Risk',
      cell: info => {
        const val = info.getValue();
        return (
          <div className="flex items-center gap-1.5 capitalize">
             <div className={cn(
               "risk-indicator-dot",
               val === 'high' ? 'high' : val === 'medium' ? 'medium' : 'low'
             )} />
             <span className="text-xs">{val}</span>
          </div>
        )
      },
      size: 90,
    }),
    columnHelper.accessor('confidence', {
      header: 'Conf',
      cell: info => <span className="text-muted-foreground">{(info.getValue() * 100).toFixed(0)}%</span>,
      size: 70,
    }),
    columnHelper.accessor('is_unfair', {
      header: 'Unfair',
      cell: info => info.getValue() ? <span className="text-red-500 font-semibold text-[10px] uppercase tracking-wider">Yes</span> : <span className="text-muted-foreground">-</span>,
      size: 70,
    }),
    columnHelper.accessor('text', {
      header: 'Text Excerpt',
      cell: info => <span className="text-muted-foreground truncate block w-full max-w-[200px] sm:max-w-xs">{info.getValue()}</span>,
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

  if (!result) {
    return (
      <div className="flex h-[50vh] items-center justify-center p-6 text-center text-sm font-medium text-muted-foreground border border-border bg-card rounded-md border-dashed">
        Awaiting document ingestion to populate telemetry grid.
      </div>
    );
  }

  const explainerData = selectedClause ? generateExplainability(selectedClause.text, selectedClause.risk_score) : null;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col xl:flex-row gap-4">
      
      {/* Left: TanStack Data Grid */}
      <div className={cn(
        "flex flex-col bg-card border border-border shadow-sm rounded-lg overflow-hidden transition-all duration-300",
        selectedClause ? "xl:w-2/3" : "w-full"
      )}>
        
        {/* Table Header / Toolbar */}
        <div className="h-12 border-b border-border bg-muted/50 flex items-center justify-between px-4 shrink-0">
           <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Inference Matrix</h2>
              <span className="px-1.5 py-0.5 ml-2 bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-widest rounded">{result.clauses.length} nodes</span>
           </div>
        </div>

        {/* Scalable Data Table Area */}
        <div className="flex-1 overflow-auto bg-card custom-scrollbar relative">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      style={{ width: header.getSize() !== 150 ? header.getSize() : 'auto' }}
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
              {table.getRowModel().rows.map(row => (
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
                </tr>
              ))}
            </tbody>
          </table>
          {table.getRowModel().rows.length === 0 && (
            <div className="w-full h-full flex items-center justify-center p-8 text-xs text-muted-foreground">
              No vectors pass filter parameters.
            </div>
          )}
        </div>
      </div>

      {/* Right: Telemetry Inspector Console */}
      {selectedClause && explainerData && (
        <AnimatedContainer animation="slide-up" duration={0.2} className="w-full xl:w-1/3 flex flex-col gap-4 overflow-y-auto">
          
          <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col h-full relative overflow-hidden">
            {/* Header */}
            <div className="h-12 border-b border-border bg-muted/30 flex items-center px-4 justify-between shrink-0">
               <h3 className="text-sm font-semibold flex items-center gap-2">
                 <Cpu className="w-4 h-4 text-primary" /> Inspector Console
               </h3>
               <button onClick={() => setSelectedClause(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
               
               {/* Metrics Grid */}
               <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md bg-muted/40 border border-border/50">
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Model Inference</span>
                    <span className="text-sm font-semibold text-foreground">{selectedClause.type}</span>
                  </div>
                  <div className="p-3 rounded-md bg-muted/40 border border-border/50">
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
                       Risk Regressor
                       <div className={cn(
                         "risk-indicator-dot",
                         selectedClause.risk_level === 'high' ? 'high' : selectedClause.risk_level === 'medium' ? 'medium' : 'low'
                       )} />
                    </span>
                    <span className="text-sm font-semibold text-foreground">{selectedClause.risk_score} <span className="text-[10px] font-normal text-muted-foreground">/100</span></span>
                  </div>
               </div>

               {/* Raw Clause Text Box */}
               <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
                     <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" /> Extracted Sequence
                  </h4>
                  <div className="p-3 rounded-md border border-border bg-background text-sm leading-relaxed text-muted-foreground shadow-inner">
                    {/* Generative Token Highlighting */}
                    {selectedClause.text.split(" ").map((word, i) => {
                       const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
                       const isHigh = explainerData.tokens.some(t => t.word === clean && t.risk === 'high');
                       const isMed = explainerData.tokens.some(t => t.word === clean && t.risk === 'medium');

                       if (isHigh) return <mark key={i} className="bg-red-500/20 text-red-700 dark:text-red-400 font-medium px-0.5 rounded-sm mx-[1px]">{word} </mark>;
                       if (isMed) return <mark key={i} className="bg-amber-500/20 text-amber-700 dark:text-amber-400 font-medium px-0.5 rounded-sm mx-[1px]">{word} </mark>;
                       return word + " ";
                    })}
                  </div>
               </div>

               {/* SHAP Explanation */}
               <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
                     <Info className="w-3.5 h-3.5 text-primary" /> SHAP Token Evaluation
                  </h4>
                  <div className="p-3 rounded-md border border-primary/20 bg-primary/5 text-xs text-foreground/80 leading-relaxed">
                     {explainerData.summary}
                  </div>
               </div>
               
               {/* Hard checks */}
               {selectedClause.is_unfair && (
                 <div className="flex gap-2 p-3 rounded-md border border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <p className="font-medium leading-relaxed">Statutory override detected. Clause triggers Unfair Terms parameter bypass due to asymmetrical obligations.</p>
                 </div>
               )}

            </div>
          </div>
        </AnimatedContainer>
      )}

    </div>
  );
}
