"use client";

import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import { BrainCircuit, Cpu, LibraryBig, Share2, Layers, Tag, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const MODELS = [
  {
    id: "legal-bert",
    name: "Clause Classifier",
    type: "Transformer Sequence",
    icon: LibraryBig,
    architecture: "Legal-BERT (base-uncased)",
    confidence: "94.2% F1",
    desc: "Autonomous partitioning of unstructured paragraphs into 100+ recognized ontological categories.",
    examples: ["\"Either party may terminate...\" → Termination"]
  },
  {
    id: "risk-scorer",
    name: "Hazard Regression",
    type: "Dense Neural Net",
    icon: Cpu,
    architecture: "RoBERTa + MLP Head",
    confidence: "0.89 R²",
    desc: "Maps token embeddings to a continuous 0-100 risk scale referencing historical contract liabilities.",
    examples: ["\"unlimited liability\" → 92/100 (High Risk)"]
  },
  {
    id: "ner",
    name: "Entity Ontology (NER)",
    type: "Token Classification",
    icon: Tag,
    architecture: "BERT-NER (bert-base)",
    confidence: "91.8% CRX",
    desc: "Recognizes explicitly named organizations, chronological boundaries, and fiscal thresholds dynamically.",
    examples: ["\"Acme Corp\" → Organization"]
  },
  {
    id: "similarity",
    name: "Template Verification",
    type: "Vector Db Inference",
    icon: Share2,
    architecture: "Sentence-BERT (all-MiniLM)",
    confidence: "Cos Sim Vector",
    desc: "Embeds ingestion text to 384-dimensional space computing distances against corporate baselines.",
    examples: ["Sim: 0.98 → Validated Offset"]
  }
];

export default function ModelInsights() {
  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-120px)]">
      <AnimatedContainer animation="fade-in" duration={0.2} className="border-b border-border pb-4 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
           <Layers className="w-5 h-5 text-muted-foreground" />
           Inference Topology
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-xl">
          Architectural mappings of the specialized ML sub-agents operating within the inference cluster. 
        </p>
      </AnimatedContainer>

      <AnimatedContainer animation="slide-up" staggerChildren={0.05} className="flex-1 overflow-auto custom-scrollbar">
         <div className="bg-card border border-border shadow-sm rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-muted/30">
                 <tr>
                    <th className="h-9 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border w-[25%]">Model Topology</th>
                    <th className="h-9 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border w-[35%]">Objective Framework</th>
                    <th className="h-9 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border w-[10%]">Metric Valid</th>
                    <th className="h-9 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border w-[30%]">Inference Test Example</th>
                 </tr>
              </thead>
              <tbody>
                {MODELS.map((model, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                     <td className="p-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-foreground flex items-center gap-1.5 whitespace-nowrap">
                             <model.icon className="w-3.5 h-3.5 text-muted-foreground" /> {model.name}
                          </span>
                          <span className="font-mono text-[9px] text-muted-foreground">{model.architecture}</span>
                        </div>
                     </td>
                     <td className="p-4 align-top text-muted-foreground leading-relaxed pr-6">
                        {model.desc}
                     </td>
                     <td className="p-4 align-top">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border border-border bg-muted inline-flex whitespace-nowrap">
                           {model.confidence}
                        </span>
                     </td>
                     <td className="p-4 align-top">
                        <div className="font-mono text-[10px] text-muted-foreground border-l border-primary/30 pl-2 bg-muted/10">
                           {model.examples[0]}
                        </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
         
         <div className="mt-4 flex items-center gap-2 p-3 border border-border bg-background rounded-md shadow-sm">
           <BrainCircuit className="w-4 h-4 text-primary shrink-0" />
           <p className="text-xs text-muted-foreground font-mono w-full">FastAPI inference orchestration running on isolated asynchronous pods. Zero data retention policies enabled per HIPAA / SOC2 standards.</p>
           <button className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">Docs <ExternalLink className="w-3 h-3" /></button>
         </div>
      </AnimatedContainer>
    </div>
  );
}
