"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { AnalysisResult, UploadInfo } from "@/types";
import { getContract } from "@/services/api";

export interface ContractHistoryItem {
  id: string;
  filename: string;
  date: string;
  risk_level: string;
  risk_score: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: "success" | "info" | "error";
  contractId?: string;
}

interface AnalysisContextValue {
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;
  uploadInfo: UploadInfo | null;
  setUploadInfo: (info: UploadInfo | null) => void;
  history: ContractHistoryItem[];
  loadContractFromHistory: (id: string) => Promise<void>;
  clearHistory: () => void;
  clearStoredResults: () => void;
  isLoadingHistory: boolean;

  // Notifications
  notifications: AppNotification[];
  addNotification: (noti: Omit<AppNotification, "id" | "date" | "isRead">) => void;
  deleteNotification: (id: string) => void;
  markNotificationsAsRead: () => void;

  // Phase 1 — clause-by-clause LLM analysis
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
  llmClauseError: string | null;
  setLlmClauseError: (v: string | null) => void;

  // Phase 2 — missing-clause LLM detection (independent)
  isMissingAnalyzing: boolean;
  setIsMissingAnalyzing: (v: boolean) => void;
  llmMissingError: string | null;
  setLlmMissingError: (v: string | null) => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [result, setResultState] = useState<AnalysisResult | null>(null);
  const [uploadInfo, setUploadInfoState] = useState<UploadInfo | null>(null);
  const [history, setHistoryState] = useState<ContractHistoryItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [llmClauseError, setLlmClauseError] = useState<string | null>(null);

  const [isMissingAnalyzing, setIsMissingAnalyzing] = useState(false);
  const [llmMissingError, setLlmMissingError] = useState<string | null>(null);

  // Hydrate state from localStorage on initial mount
  useEffect(() => {
    const storedResult = localStorage.getItem("legal_analysis_result");
    const storedUploadInfo = localStorage.getItem("legal_upload_info");
    const storedHistory = localStorage.getItem("legal_history");
    const storedNotifications = localStorage.getItem("legal_notifications");

    if (storedResult) {
      try {
        setResultState(JSON.parse(storedResult));
      } catch (e) {}
    }

    if (storedUploadInfo) {
      try {
        setUploadInfoState(JSON.parse(storedUploadInfo));
      } catch (e) {}
    }

    if (storedHistory) {
      try {
        setHistoryState(JSON.parse(storedHistory));
      } catch (e) {}
    }

    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications));
      } catch (e) {}
    }
  }, []);

  const setResult = (newResult: AnalysisResult | null) => {
    setResultState(newResult);
    if (newResult) {
      localStorage.setItem("legal_analysis_result", JSON.stringify(newResult));

      // Append to history
      setHistoryState((prev) => {
        const item: ContractHistoryItem = {
          id: newResult.document.document_id,
          filename:
            newResult.document.filename ||
            uploadInfo?.filename ||
            "Unknown Contract",
          date: new Date().toISOString(),
          risk_level: newResult.summary.risk_level,
          risk_score: newResult.summary.overall_risk_score,
        };
        const filtered = prev.filter((p) => p.id !== item.id);
        const next = [item, ...filtered].slice(0, 30); // Keep last 30 contracts
        localStorage.setItem("legal_history", JSON.stringify(next));
        return next;
      });
    } else {
      localStorage.removeItem("legal_analysis_result");
    }
  };

  const setUploadInfo = (newInfo: UploadInfo | null) => {
    setUploadInfoState(newInfo);
    if (newInfo) {
      localStorage.setItem("legal_upload_info", JSON.stringify(newInfo));
    } else {
      localStorage.removeItem("legal_upload_info");
    }
  };

  const loadContractFromHistory = async (id: string) => {
    setIsLoadingHistory(true);
    try {
      const pastContact = await getContract(id);

      // Attempt to find original filename from history since API might not return it fully
      const histItem = history.find((h) => h.id === id);

      setUploadInfoState({
        filename:
          histItem?.filename ||
          pastContact.document.filename ||
          "History Contract",
        pages: pastContact.document.pages || 0,
      });
      setResult(pastContact); // This will update local storage implicitly
    } catch (e) {
      console.error("Failed to load historical contract", e);
      throw e;
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const clearHistory = () => {
    setHistoryState([]);
    localStorage.removeItem("legal_history");
  };

  const clearStoredResults = () => {
    setResultState(null);
    setUploadInfoState(null);
    setHistoryState([]);

    localStorage.removeItem("legal_analysis_result");
    localStorage.removeItem("legal_upload_info");
    localStorage.removeItem("legal_history");
  };

  const addNotification = (noti: Omit<AppNotification, "id" | "date" | "isRead">) => {
    setNotifications((prev) => {
      const newNoti: AppNotification = {
        ...noti,
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString(),
        isRead: false,
      };
      const next = [newNoti, ...prev].slice(0, 50); // Keep last 50 notifications
      localStorage.setItem("legal_notifications", JSON.stringify(next));
      return next;
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      localStorage.setItem("legal_notifications", JSON.stringify(next));
      return next;
    });
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isRead: true }));
      localStorage.setItem("legal_notifications", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AnalysisContext.Provider
      value={{
        result,
        setResult,
        uploadInfo,
        setUploadInfo,
        history,
        loadContractFromHistory,
        clearHistory,
        clearStoredResults,
        isLoadingHistory,
        
        notifications,
        addNotification,
        deleteNotification,
        markNotificationsAsRead,

        isAnalyzing,
        setIsAnalyzing,
        llmClauseError,
        setLlmClauseError,
        isMissingAnalyzing,
        setIsMissingAnalyzing,
        llmMissingError,
        setLlmMissingError,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used inside AnalysisProvider");
  return ctx;
}
