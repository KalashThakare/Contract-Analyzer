"use client";

import { useAnalysis } from "@/context/AnalysisContext";
import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";
import { Activity, ShieldAlert, FileText, CheckCircle2, AlertTriangle, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

// Enterprise Color Palette
const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Green, Amber, Red

export default function AnalysisDashboard() {
  const { result, uploadInfo } = useAnalysis();

  if (!result) {
    return (
      <div className="flex h-[50vh] items-center justify-center p-6 text-center text-sm font-medium text-muted-foreground border border-border bg-card rounded-md border-dashed">
        Awaiting document upload to show analysis results.
      </div>
    );
  }

  const { document, summary, clauses } = result;
  
  const riskData = [
    { name: 'Low Risk', value: summary.low_risk_count },
    { name: 'Medium Risk', value: summary.medium_risk_count },
    { name: 'High Risk', value: summary.high_risk_count },
  ];

  const typeCounts = clauses.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(typeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a,b) => b.count - a.count)
    .slice(0, 5); // top 5

  return (
    <div className="space-y-6">
      
      {/* Dense App Header */}
      <AnimatedContainer animation="fade-in" duration={0.2} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
         <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5 text-muted-foreground" /> Contract Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">{document.filename || uploadInfo?.filename || "Unknown_Document"}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-muted rounded border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground" title="Total pages scanned from the document">
            {document.pages || uploadInfo?.pages || '?'} Pages Evaluated
          </span>
          <span className="px-2 py-1 bg-primary/10 rounded border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary" title="Total distinct paragraphs or sections identified">
            {document.total_clauses} Clauses Found
          </span>
         </div>
      </AnimatedContainer>

      {/* KPI Grid */}
      <AnimatedContainer animation="slide-up" delay={0.1} staggerChildren={0.05} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-4 flex flex-col gap-2 relative overflow-hidden group" title="The summarized risk score out of 100 based on all clauses">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Overall Risk Score</h3>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tighter text-foreground leading-none">{summary.overall_risk_score}</span>
            <span className="text-xs text-muted-foreground font-mono mb-1">/100</span>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-3">
             <div 
               className={cn("h-full", summary.risk_level === 'high' ? 'bg-red-500' : summary.risk_level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')} 
               style={{ width: `${summary.overall_risk_score}%` }} 
             />
          </div>
        </div>

        <div className="glass-panel p-4 flex flex-col gap-2 relative overflow-hidden group" title="Clauses posing immediate legal or financial threats">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red-500" /> High Risk Issues</h3>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tighter text-red-500 leading-none">{summary.high_risk_count}</span>
            <span className="text-xs text-muted-foreground font-mono mb-1">clauses</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wide">Requires immediate counsel</p>
        </div>

        <div className="glass-panel p-4 flex flex-col gap-2 relative overflow-hidden group" title="Clauses that deviate slightly from standard templates">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Medium Risk Issues</h3>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tighter text-amber-500 leading-none">{summary.medium_risk_count}</span>
            <span className="text-xs text-muted-foreground font-mono mb-1">clauses</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wide">Standard negotiation points</p>
        </div>

        <div className="glass-panel p-4 flex flex-col gap-2 relative overflow-hidden group" title="Clauses matching baseline policies without elevated risk">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Safe / Low Risk</h3>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tighter text-emerald-500 leading-none">{summary.low_risk_count}</span>
            <span className="text-xs text-muted-foreground font-mono mb-1">clauses</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wide">Conforms to expected templates</p>
        </div>

      </AnimatedContainer>

      {/* Charting Grid */}
      <AnimatedContainer animation="slide-up" delay={0.2} staggerChildren={0.05} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Risk Distribution */}
        <div className="glass-panel p-4 flex flex-col">
          <h3 className="section-heading mb-0" title="Distribution of detected clauses across the three risk tiers"><FileText className="w-4 h-4 inline-block mr-1.5" /> Risk Breakdown</h3>
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px', fontSize: '11px', padding: '8px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Low</div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Medium</div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> High</div>
          </div>
        </div>

        {/* Semantic Classification */}
        <div className="glass-panel p-4 flex flex-col">
          <h3 className="section-heading mb-0" title="The most common types of clauses found in the document"><Activity className="w-4 h-4 inline-block mr-1.5" /> Main Clause Types</h3>
          <div className="flex-1 w-full min-h-[220px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 10, fill: "var(--foreground)" }} />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px', fontSize: '11px', padding: '8px' }}
                />
                <Bar dataKey="count" fill="var(--muted-foreground)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </AnimatedContainer>
    </div>
  );
}
