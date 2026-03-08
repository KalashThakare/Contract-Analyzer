"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { AnalysisResult, UploadInfo } from "@/types";

interface AnalysisContextValue {
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;
  uploadInfo: UploadInfo | null;
  setUploadInfo: (info: UploadInfo | null) => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uploadInfo, setUploadInfo] = useState<UploadInfo | null>(null);

  return (
    <AnalysisContext.Provider
      value={{ result, setResult, uploadInfo, setUploadInfo }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext);
  if (!ctx)
    throw new Error("useAnalysis must be used inside AnalysisProvider");
  return ctx;
}
