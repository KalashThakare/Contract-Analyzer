"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, FileUp, Sparkles, Scale, FileSearch, HelpCircle, FileText, Settings, Database, Brain, Clock, Loader2, FileCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalysis } from "@/context/AnalysisContext";

const NAV_ITEMS = [
  { group: "Workspace", items: [
    { name: "Upload Contract", path: "/dashboard/upload", icon: FileUp },
    { name: "Analysis Dashboard", path: "/dashboard", icon: LayoutDashboard },
  ]},
  { group: "Deep Analysis", items: [
    { name: "Clause Explorer", path: "/dashboard/clauses", icon: FileSearch },
    { name: "Risk Insights", path: "/dashboard/risk", icon: Scale },
    { name: "Entity Taxonomy", path: "/dashboard/entities", icon: Database },
    { name: "Baseline Deviance", path: "/dashboard/similarity", icon: Sparkles },
    { name: "Absent Assertions", path: "/dashboard/missing-clauses", icon: HelpCircle },
  ]},
  { group: "System", items: [
    { name: "Reports & Audit", path: "/dashboard/reports", icon: FileText },
    { name: "Model Telemetry", path: "/dashboard/models", icon: Brain },
    { name: "Configuration", path: "/dashboard/settings", icon: Settings },
  ]}
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { history, loadContractFromHistory, result, isLoadingHistory } = useAnalysis();

  const handleLoadHistory = async (id: string) => {
    try {
      if (result?.document?.document_id !== id) {
        await loadContractFromHistory(id);
      }
      if (pathname !== "/dashboard") {
         router.push("/dashboard");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside className={cn("w-56 h-[calc(100vh-56px)] fixed left-0 top-14 border-r border-border bg-card flex flex-col z-40 hidden md:flex", className)}>
      
      {/* Scrollable Nav Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {NAV_ITEMS.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2">{section.group}</h3>
            <div className="space-y-0.5 mt-2">
              {section.items.map((item) => {
                const isActive = item.path === "/dashboard" 
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.path);
                  
                return (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors group",
                      isActive 
                        ? "bg-muted text-foreground" 
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={1.5} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Persistence / Recent Contracts Panel */}
      {history && history.length > 0 && (
        <div className="p-3 border-t border-border bg-background">
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Recent Items
            </h3>
            {isLoadingHistory && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
          </div>
          
          <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
             {history.map((hist) => {
               const isActive = result?.document.document_id === hist.id;
               return (
                 <button
                   key={hist.id}
                   onClick={() => handleLoadHistory(hist.id)}
                   disabled={isLoadingHistory || isActive}
                   className={cn(
                     "w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors flex items-center justify-between gap-1 border border-transparent",
                     isActive 
                       ? "bg-foreground text-background border-border" 
                       : "bg-transparent hover:bg-muted text-foreground"
                   )}
                 >
                    <div className="truncate flex-1 min-w-0 pr-2">
                       {hist.filename}
                    </div>
                    {isActive ? (
                       <FileCheck className={cn("w-3 h-3 shrink-0", isActive ? "text-primary-foreground dark:text-primary" : "text-muted-foreground")} />
                    ) : (
                       <div className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          hist.risk_level === 'high' ? 'bg-red-500' : 
                          hist.risk_level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                       )} />
                    )}
                 </button>
               )
             })}
          </div>
        </div>
      )}
    </aside>
  );
}
