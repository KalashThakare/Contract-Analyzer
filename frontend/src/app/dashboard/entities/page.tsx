"use client";

import { useState } from "react";
import { useAnalysis } from "@/context/AnalysisContext";
import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import { Database, Filter, Briefcase, Calendar, DollarSign, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Clause } from "@/types";

type EntityType = "parties" | "dates" | "amounts" | "jurisdictions";

const ENTITY_CONFIG: Record<EntityType, { title: string, icon: any }> = {
  parties: { title: "Named Organizations", icon: Briefcase },
  dates: { title: "Temporal Mentions", icon: Calendar },
  amounts: { title: "Monetary Constraints", icon: DollarSign },
  jurisdictions: { title: "Governing Jurisdictions", icon: MapPin }
};

export default function EntityExtraction() {
  const { result } = useAnalysis();
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  if (!result) {
    return <div className="flex h-[50vh] items-center justify-center p-6 text-center text-sm font-medium text-muted-foreground border border-border bg-card rounded-md border-dashed">Awaiting document ingestion to populate telemetry grid.</div>;
  }

  const { entities, clauses } = result;
  
  const relatedClauses = selectedEntity 
    ? clauses.filter(c => 
        c.entities.parties.includes(selectedEntity) || c.entities.dates.includes(selectedEntity) || c.entities.amounts.includes(selectedEntity) || c.text.includes(selectedEntity)
      )
    : [];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col xl:flex-row gap-4">
      
      {/* Left Panel: Entity Tags Grid */}
      <div className="w-full xl:w-2/5 flex flex-col border border-border bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="h-12 border-b border-border bg-muted/50 flex items-center px-4 shrink-0 justify-between">
           <h2 className="text-sm font-semibold flex items-center gap-2">
             <Database className="w-4 h-4 text-muted-foreground" />
             Entity Taxonomy
           </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Named Entity Recognition (NER) models extract critical data nodes from unstructured clauses. Click generic tags to filter isolated constraints.
          </p>
          
          <AnimatedContainer animation="fade-in" staggerChildren={0.05} className="space-y-4">
            {(Object.keys(ENTITY_CONFIG) as EntityType[]).map(type => {
              const config = ENTITY_CONFIG[type];
              const items = entities[type] || [];
              
              return (
                <div key={type} className="border border-border/50 rounded-md p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <config.icon className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider">{config.title}</h3>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">{items.length} nodes</span>
                  </div>
                  
                  {items.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground py-2 italic flex items-center">
                      No attributes parameterized.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {items.map(entity => (
                        <button 
                          key={entity}
                          onClick={() => setSelectedEntity(selectedEntity === entity ? null : entity)}
                          className={cn(
                            "entity-tag",
                            selectedEntity === entity && "bg-primary text-primary-foreground border-primary shadow-sm hover:opacity-90 hover:bg-primary"
                          )}
                        >
                           {entity}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </AnimatedContainer>
        </div>
      </div>

      {/* Right Panel: Data Context Isolation */}
      <div className="w-full xl:w-3/5 bg-card border border-border rounded-lg shadow-sm flex flex-col overflow-hidden relative">
         <div className="h-12 border-b border-border bg-muted/50 flex items-center justify-between px-4 shrink-0">
           <h3 className="text-sm font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" /> Context Constraint Isolation
           </h3>
           {selectedEntity && (
             <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted font-mono">{relatedClauses.length} trace(s) valid</span>
           )}
         </div>

         <div className="flex-1 overflow-y-auto p-4 bg-muted/20 custom-scrollbar">
           {!selectedEntity ? (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
               <Search className="w-8 h-8 opacity-20 mb-3" />
               <p className="text-xs font-medium">Constraints Awaiting Target Input</p>
               <p className="max-w-[200px] mt-1 text-[10px]">Select a tag from the left panel to isolate the extracted variable.</p>
             </div>
           ) : relatedClauses.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground border border-dashed border-border rounded-md bg-background">Entity trace lost. No nodes matched constraints.</div>
           ) : (
             <AnimatedContainer animation="fade-in" staggerChildren={0.05} className="space-y-3">
               {relatedClauses.map(clause => (
                 <div key={clause.id} className="p-3 bg-background border border-border rounded-md hover:border-border/80 transition-shadow group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 py-0.5 bg-muted rounded border border-border">{clause.type}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">ID:{clause.id.toString().padStart(3, '0')}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground">
                       {clause.text.split(new RegExp(`(${selectedEntity.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi')).map((part, i) => (
                         part.toLowerCase() === selectedEntity.toLowerCase() ? 
                         <mark key={i} className="bg-primary/20 text-primary px-0.5 font-medium rounded-sm border border-primary/20 mx-[1px]">{part}</mark> : part
                       ))}
                    </p>
                 </div>
               ))}
             </AnimatedContainer>
           )}
         </div>
      </div>
    </div>
  );
}
