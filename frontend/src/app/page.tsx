"use client";

import Link from "next/link";
import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import { 
  ChevronRight, FileText, Database, Shield, AlertTriangle, MonitorPlay, Activity
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      
      {/* Enterprise Stark Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border h-12 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 bg-foreground rounded flex items-center justify-center">
              <ScaleIcon className="w-3 h-3 text-background" />
           </div>
           <span className="font-semibold text-sm tracking-tight">Aethel AI</span>
        </div>
        <div className="flex items-center gap-4">
           <Link href="/dashboard" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Documentation</Link>
           <button className="text-xs font-semibold px-3 py-1 bg-foreground text-background rounded-md transition-colors hover:bg-foreground/90 disabled:opacity-50">
             Sign In
           </button>
        </div>
      </nav>

      {/* Hero Section (Vercel/Linear tight typography style) */}
      <section className="relative pt-32 pb-20 px-6 sm:px-12 max-w-5xl mx-auto flex flex-col items-center text-center">
        
        <AnimatedContainer animation="slide-up">
           <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 border border-border mb-8">
             <span className="flex h-2 w-2 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
             </span>
             <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Inference Kernel 4.2 Deployed</span>
           </div>
           
           <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground leading-[1.1] mb-6">
              Contract Intelligence.<br/>
              <span className="text-muted-foreground">Without the Liability.</span>
           </h1>
           
           <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Aethel is a zero-retention semantic parser designed for massive legal ontologies. We compress thousands of hours of manual due diligence into programmatic, deterministic API telemetry.
           </p>

           <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
             <Link href="/dashboard" className="w-full sm:w-auto px-5 py-2.5 bg-foreground text-background text-sm font-semibold rounded-md border border-transparent hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 group">
               Launch Console
               <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
             </Link>
             <Link href="/dashboard" className="w-full sm:w-auto px-5 py-2.5 bg-background text-foreground text-sm font-semibold rounded-md border border-border hover:bg-muted transition-all flex items-center justify-center gap-2">
               View API Docs
             </Link>
           </div>
        </AnimatedContainer>
        
        {/* Abstract Data Representation (Not a glowing mockup, a stark wireframe) */}
        <AnimatedContainer animation="fade-in" delay={0.2} className="w-full mt-24 border border-border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col text-left">
           <div className="h-10 bg-muted/30 border-b border-border flex items-center gap-3 px-4">
              <div className="flex gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-border" />
                 <div className="w-2.5 h-2.5 rounded-full bg-border" />
                 <div className="w-2.5 h-2.5 rounded-full bg-border" />
              </div>
              <div className="flex-1 text-center">
                 <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground/60">Aethel Telemetry Output</span>
              </div>
           </div>
           
           <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
              <div className="space-y-3 col-span-2">
                 <div className="text-muted-foreground">&gt; Initializing RoBERTa regression payload...</div>
                 <div className="text-primary">&gt; Extracting semantic nodes... 142 clauses found.</div>
                 <div className="space-y-2 pl-4 border-l border-border mt-3">
                    <div className="flex justify-between max-w-xs"><span className="text-foreground">Node 001 [Termination]</span> <span className="text-red-500">0.98 RISK</span></div>
                    <div className="flex justify-between max-w-xs"><span className="text-foreground">Node 014 [Indemnity]</span> <span className="text-amber-500">0.65 RISK</span></div>
                    <div className="flex justify-between max-w-xs"><span className="text-foreground">Node 042 [Venue]</span> <span className="text-emerald-500">0.12 RISK</span></div>
                 </div>
              </div>
              <div className="flex flex-col gap-2">
                 <div className="bg-muted p-2 rounded border border-border"><span className="text-muted-foreground block text-[9px] uppercase">Processing Time</span><span className="text-foreground font-bold">128ms</span></div>
                 <div className="bg-muted p-2 rounded border border-border"><span className="text-muted-foreground block text-[9px] uppercase">Similarity Deviance</span><span className="text-foreground font-bold">1.4%</span></div>
              </div>
           </div>
        </AnimatedContainer>
      </section>

      {/* Strict Capabilities Grid */}
      <section className="border-t border-border bg-muted/30 py-24">
         <div className="max-w-5xl mx-auto px-6 lg:px-12">
            
            <AnimatedContainer animation="fade-in" className="mb-12">
               <h2 className="text-sm font-bold text-foreground mb-2">Core Infrastructure</h2>
               <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">Deterministic pipelines built for legal engineering teams. Zero hallucinations. Predictable JSON arrays.</p>
            </AnimatedContainer>

            <AnimatedContainer animation="slide-up" staggerChildren={0.05} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               
               <div className="p-5 bg-card border border-border rounded-lg shadow-sm">
                  <Database className="w-5 h-5 text-muted-foreground mb-4" strokeWidth={1.5} />
                  <h3 className="text-sm font-semibold text-foreground mb-2">Entity Resolution</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Isolate organizations, fiscal constraints, and temporal variables via BERT-NER.</p>
               </div>

               <div className="p-5 bg-card border border-border rounded-lg shadow-sm">
                  <Shield className="w-5 h-5 text-muted-foreground mb-4" strokeWidth={1.5} />
                  <h3 className="text-sm font-semibold text-foreground mb-2">Baseline Diffing</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Sentence-BERT embedding distance mapping against custom corporate repositories.</p>
               </div>

               <div className="p-5 bg-card border border-border rounded-lg shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-muted-foreground mb-4" strokeWidth={1.5} />
                  <h3 className="text-sm font-semibold text-foreground mb-2">Liability Regression</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Calculate continuous risk multipliers using localized SHAP token explanations.</p>
               </div>

               <div className="p-5 bg-card border border-border rounded-lg shadow-sm">
                  <MonitorPlay className="w-5 h-5 text-muted-foreground mb-4" strokeWidth={1.5} />
                  <h3 className="text-sm font-semibold text-foreground mb-2">Stateless Audit</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Air-gapped VPC architecture. We hold zero persistent memory of your uploaded binaries.</p>
               </div>

            </AnimatedContainer>
         </div>
      </section>

    </div>
  );
}

const ScaleIcon = ({ className }: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
)
