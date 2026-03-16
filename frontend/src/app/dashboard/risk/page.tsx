"use client";

import { useAnalysis } from "@/context/AnalysisContext";
import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import { ShieldAlert, TrendingDown, Target, Activity, AlertTriangle } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis
} from "recharts";
import { cn } from "@/lib/utils";

export default function RiskInsights() {
  const { result } = useAnalysis();

  if (!result) {
    return (
      <div className="flex h-[50vh] items-center justify-center p-6 text-center text-sm font-medium text-muted-foreground border border-border bg-card rounded-md border-dashed">
        Awaiting document ingestion to populate telemetry grid.
      </div>
    );
  }

  const clauses = result.clauses;
  
  const elevatedRiskClauses = clauses
    .filter((c) => c.risk_level === "high" || c.risk_level === "medium")
    .sort((a, b) => b.risk_score - a.risk_score);

  const scatterData = clauses.map((c) => ({
    id: c.id,
    type: c.type,
    risk: c.risk_score,
    confidence: Math.round(c.confidence * 100),
    level: c.risk_level
  }));

  const progressionData = clauses.map((c, i) => ({
    index: i + 1,
    risk: c.risk_score,
    level: c.risk_level
  }));

  return (
    <div className="space-y-6">
      <AnimatedContainer animation="fade-in" duration={0.2} className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          Enterprise Liability Index
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-xl">
          Continuous regression mappings parsing liability mass distribution across paragraph chronologies.
        </p>
      </AnimatedContainer>

      <AnimatedContainer animation="slide-up" delay={0.1} staggerChildren={0.05} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Risk Scatter Plot */}
        <div className="glass-panel p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="section-heading mb-0 text-foreground">Dense Regression Scatter</h3>
            </div>
          </div>
          
          <div className="h-[250px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis type="number" dataKey="confidence" hide domain={[0, 100]} />
                <YAxis type="number" dataKey="risk" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} domain={[0, 100]} />
                <ZAxis type="number" range={[40, 80]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px', fontSize: '11px', padding: '6px' }} />
                <Scatter data={scatterData.filter(d => d.level === 'low')} fill="#10b981" />
                <Scatter data={scatterData.filter(d => d.level === 'medium')} fill="#f59e0b" />
                <Scatter data={scatterData.filter(d => d.level === 'high')} fill="#ef4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart */}
        <div className="glass-panel p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="section-heading mb-0 text-foreground">Chronology Topography</h3>
            </div>
          </div>
          
          <div className="h-[250px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="index" hide />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px', fontSize: '11px', padding: '6px' }} />
                <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </AnimatedContainer>

      {/* High-Risk Grid */}
      <AnimatedContainer animation="slide-up" delay={0.2} className="space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 px-1">
          <TrendingDown className="w-4 h-4 text-red-500" /> Elevated Priority Index
        </h2>

        {elevatedRiskClauses.length === 0 ? (
          <div className="p-6 glass-panel rounded-md text-center text-xs text-muted-foreground border-dashed">
            No dangerous topography detected. Parameters pass threshold constraints.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {elevatedRiskClauses.slice(0, 6).map((clause) => (
              <div key={clause.id} className={cn(
                "p-3 rounded-lg border transition-colors glass-panel border-l-2 shadow-none group",
                clause.risk_level === 'high' ? 'border-l-red-500 bg-red-500/5' : 'border-l-amber-500 bg-amber-500/5'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-sm border",
                    clause.risk_level === 'high' ? 'border-red-500/20 text-red-600 dark:text-red-400' : 'border-amber-500/20 text-amber-600 dark:text-amber-400'
                  )}>
                    LVL: {clause.risk_score}
                  </span>
                  {clause.is_unfair && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                </div>
                <h4 className="text-xs font-semibold text-foreground mb-1 line-clamp-1">{clause.type}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">{clause.text}</p>
                <div className="text-[10px] font-mono font-medium text-muted-foreground pt-2 border-t border-border border-dashed flex justify-between">
                   <span>ID: {String(clause.id).padStart(3, '0')}</span>
                   <span>C: {(clause.confidence*100).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedContainer>
    </div>
  );
}
