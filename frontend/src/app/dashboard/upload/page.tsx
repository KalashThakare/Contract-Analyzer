"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/context/AnalysisContext";
import { uploadDocument, analyzeDocument } from "@/services/api";
import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import { 
  FileUp, ShieldCheck, Database, FileText, Scale, Loader2, XCircle, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock PIPELINE visualization steps
const PIPELINE_STEPS = [
  { id: "upload", label: "Ingesting Document Binary", icon: FileUp },
  { id: "ocr", label: "Parsing Paragraph Topography", icon: FileText },
  { id: "classify", label: "Taxonomy Classification Engine", icon: Database },
  { id: "risk", label: "Calculating Liability Scoring Arrays", icon: Scale },
  { id: "sim", label: "Running Diff vs Baseline Polices", icon: ShieldCheck },
];

export default function UploadPage() {
  const router = useRouter();
  const { setResult, setUploadInfo } = useAnalysis();
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [errorText, setErrorText] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulatePipeline = () => {
    setActiveStep(1);
    const intervals = [1000, 2000, 3500, 5000];
    intervals.forEach((time, index) => {
      setTimeout(() => setActiveStep(index + 2), time);
    });
  };

  const handleUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setUploadState("uploading");
    
    setTimeout(() => {
      setUploadState("processing");
      simulatePipeline();
    }, 600);

    try {
      const uploadRes = await uploadDocument(selectedFile);
      setUploadInfo({
        filename: selectedFile.name,
        pages: uploadRes.page_count || 1, 
      });
      const analysisRes = await analyzeDocument(uploadRes.contract_id);
      setResult(analysisRes);
      
      setTimeout(() => {
        setUploadState("success");
      }, 5500);

      setTimeout(() => {
        router.push("/dashboard");
      }, 6500);

    } catch (error) {
      const err = error as Error;
      console.error(err);
      setUploadState("error");
      setErrorText(err.message || "Inference pipeline failed during tokenization. Check console logs.");
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col xl:flex-row gap-6">
      
      {/* Left Area: Upload Action Box */}
      <div className="flex-1 flex flex-col">
        <AnimatedContainer animation="fade-in" duration={0.2} className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <FileUp className="w-5 h-5 text-muted-foreground" /> Contract Ingestion Pipeline
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Drop raw PDFs to initiate dense neural vector validation against company policy models.
          </p>
        </AnimatedContainer>

        <AnimatedContainer animation="slide-up" delay={0.1} className="flex-1 relative">
           <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={uploadState === "idle" || uploadState === "error" ? onDrop : undefined}
              onClick={() => (uploadState === "idle" || uploadState === "error") && fileInputRef.current?.click()}
              className={cn(
                "w-full h-full rounded-lg border-2 border-dashed glass-panel flex flex-col items-center justify-center p-8 transition-all duration-300",
                (uploadState === "idle" || uploadState === "error") ? "cursor-pointer hover:border-primary/50 hover:bg-muted/30" : "cursor-default pointer-events-none",
                isDragActive && "border-primary bg-primary/5",
                uploadState === "error" && "border-red-500/50 bg-red-500/5",
                uploadState === "success" && "border-emerald-500/50 bg-emerald-500/5"
              )}
           >
              <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept=".pdf,.doc,.docx,.txt" />
              
              {uploadState === "idle" && (
                <div className="flex flex-col items-center text-center">
                   <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center mb-4">
                     <FileUp className="w-5 h-5 text-muted-foreground" />
                   </div>
                   <h3 className="text-sm font-semibold text-foreground mb-1">Drag & Drop Document Buffer</h3>
                   <p className="text-xs text-muted-foreground max-w-sm">Supports PDF, DOCX, TXT. Inference restricted to 50MB per request.</p>
                </div>
              )}

              {uploadState === "uploading" && (
                <div className="flex flex-col items-center text-center">
                   <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                   <h3 className="text-sm font-semibold text-foreground mb-1">Transmitting BLOB Data</h3>
                   <p className="text-xs text-primary font-mono">{file?.name}</p>
                </div>
              )}

              {uploadState === "processing" && (
                <div className="flex flex-col items-center text-center">
                   <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center mb-4 relative overflow-hidden">
                     <div className="absolute inset-x-0 bottom-0 bg-primary/20 animate-pulse w-full h-full" />
                     <Database className="w-5 h-5 text-primary relative z-10 animate-pulse" />
                   </div>
                   <h3 className="text-sm font-semibold text-foreground mb-1">Inference Engine Active</h3>
                   <p className="text-xs text-muted-foreground font-mono">Running parallel taxonomy classification</p>
                </div>
              )}

              {uploadState === "success" && (
                <div className="flex flex-col items-center text-center">
                   <div className="w-12 h-12 bg-emerald-500/10 rounded-md flex items-center justify-center mb-4">
                     <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                   </div>
                   <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Telemetry Output Complete</h3>
                   <p className="text-xs text-muted-foreground">Redirecting to Analysis Matrix...</p>
                </div>
              )}

              {uploadState === "error" && (
                <div className="flex flex-col items-center text-center">
                   <div className="w-12 h-12 bg-red-500/10 rounded-md flex items-center justify-center mb-4">
                     <XCircle className="w-5 h-5 text-red-500" />
                   </div>
                   <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Inference Exception</h3>
                   <p className="text-xs text-red-500/80 mb-4 font-mono w-full max-w-sm truncate">{errorText}</p>
                   <button onClick={(e) => { e.stopPropagation(); setUploadState("idle"); setFile(null); }} className="px-4 py-1.5 text-xs font-semibold bg-background border border-border rounded-md hover:bg-muted">
                     Restart Job
                   </button>
                </div>
              )}
           </div>
        </AnimatedContainer>
      </div>

      {/* Right Area: ML Pipeline Trace Terminal */}
      <AnimatedContainer animation="slide-up" delay={0.2} className="w-full xl:w-80 shrink-0">
          <div className="glass-panel h-full flex flex-col rounded-lg border border-border">
             <div className="h-10 border-b border-border bg-muted/50 flex items-center px-4 shrink-0">
               <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                 <Terminal className="w-3.5 h-3.5" /> Pipeline Telemetry Trace
               </h3>
             </div>

             <div className="flex-1 p-4 overflow-y-auto space-y-6 bg-card text-foreground">
               {PIPELINE_STEPS.map((step, idx) => {
                 const isDone = activeStep > idx;
                 const isCurrent = activeStep === idx && (uploadState === "processing" || uploadState === "uploading");
                 const isPending = activeStep < idx;

                 return (
                   <div key={step.id} className={cn(
                     "flex items-start gap-4 transition-all duration-300 relative",
                     isPending ? "opacity-30" : "opacity-100",
                   )}>
                      {idx !== PIPELINE_STEPS.length - 1 && (
                         <div className={cn(
                            "absolute left-2.5 top-6 bottom-[-24px] w-[1px]",
                            isDone ? "bg-emerald-500/50" : "bg-border"
                         )} />
                      )}
                      
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center border bg-card shrink-0 relative z-10",
                        isDone ? "border-emerald-500 text-emerald-500" : 
                        isCurrent ? "border-primary text-primary" : "border-border text-muted-foreground"
                      )}>
                        {isDone ? <CheckCircle2 className="w-3 h-3" /> : 
                         isCurrent ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                         <step.icon className="w-3 h-3" />}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={cn(
                           "text-xs font-mono font-bold tracking-tight mb-0.5",
                           isDone ? "text-emerald-500 dark:text-emerald-400" : isCurrent ? "text-primary dark:text-primary" : "text-muted-foreground"
                        )}>{step.label}</h4>
                        {isCurrent && (
                          <div className="h-0.5 w-12 bg-muted mt-1 rounded-full overflow-hidden">
                             <div className="h-full bg-primary rounded-full animate-progress" />
                          </div>
                        )}
                        {isDone && (
                           <span className="text-[9px] text-muted-foreground uppercase">Process Exited: 0s</span>
                        )}
                      </div>
                   </div>
                 )
               })}

               {uploadState === "idle" && (
                 <div className="pt-4 text-[10px] font-mono text-muted-foreground border-t border-border italic">
                   &gt; Awaiting standard binary input...
                 </div>
               )}
             </div>
          </div>
      </AnimatedContainer>
    </div>
  );
}

const Terminal = ({ className }: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
)
