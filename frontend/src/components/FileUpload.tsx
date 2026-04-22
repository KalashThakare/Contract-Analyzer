"use client";

/**
 * Standalone upload widget used by the legacy analysis flow (/analysis path).
 */

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, AlertCircle, Loader2 } from "lucide-react";
import { uploadDocument, analyzeDocument } from "@/services/api";
import { useAnalysis } from "@/context/AnalysisContext";

const LOADING_MESSAGES = [
  "Extracting text from PDF...",
  "Segmenting clauses...",
  "Classifying clause types (Legal-BERT)...",
  "Scoring risk per clause...",
  "Extracting named entities...",
  "Generating AI explanations...",
  "Finalizing results...",
];

export default function FileUpload() {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setResult, setUploadInfo } = useAnalysis();

  const cycleMessages = (): ReturnType<typeof setInterval> => {
    // Rotate status text while backend upload + analysis requests are in flight.
    let i = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[i]);
    }, 700);
    return interval;
  };

  const processFile = async (file: File) => {
    // Keep this component strict to PDF to match backend expectations.
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setError("");
    setStatus("loading");
    const interval = cycleMessages();
    try {
      const uploadRes = await uploadDocument(file);
      setUploadInfo({ filename: file.name, pages: uploadRes.page_count });
      const analysisRes = await analyzeDocument(uploadRes.contract_id);
      setResult(analysisRes);
      clearInterval(interval);
      router.push("/analysis");
    } catch (err) {
      clearInterval(interval);
      setStatus("error");
      setError(
        typeof err === "string" ? err : "Analysis failed. Please try again.",
      );
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  if (status === "loading") {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center gap-5">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-slate-700 font-medium text-sm mb-1">
            Analyzing document
          </p>
          <p className="text-slate-400 text-xs">{loadingMsg}</p>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
          <div className="bg-blue-500 h-1 rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
          ${
            dragging
              ? "border-blue-400 bg-blue-50"
              : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"
          }`}
        onDragOver={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div
          className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center
          ${dragging ? "bg-blue-100" : "bg-slate-100"}`}
        >
          {dragging ? (
            <FileText className="w-7 h-7 text-blue-500" />
          ) : (
            <UploadCloud className="w-7 h-7 text-slate-400" />
          )}
        </div>
        <p className="font-semibold text-slate-700 mb-1">
          {dragging ? "Release to upload" : "Drop your contract PDF here"}
        </p>
        <p className="text-sm text-slate-400">or click to browse files</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
