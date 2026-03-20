import axios, { type AxiosResponse } from "axios";
import { MOCK_ANALYSIS_RESULT } from "./mockData";
import {
  transformUploadResponse,
  transformAnalysisResponse,
} from "@/services/transforms";
import type { AnalysisResult, HealthResponse, UploadResponse } from "@/types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// In development Next.js rewrites proxy /api → backend, so we use relative URLs.
// In production (or if no rewrite), fall back to the full backend URL.
const BASE_URL = USE_MOCK
  ? ""
  : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const client = axios.create({ baseURL: BASE_URL });

// The interceptor unwraps `res.data` so callers receive the body directly.
client.interceptors.response.use(
  (res: AxiosResponse) => res.data,
  (err) =>
    Promise.reject(
      err.response?.data?.detail || err.message || "Request failed",
    ),
);

// Helper to cast the interceptor-unwrapped result to the expected type.
async function get<T>(url: string): Promise<T> {
  const res = await client.get(url);
  return res as unknown as T;
}

async function post<T>(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any,
): Promise<T> {
  const res = await client.post(url, data, config);
  return res as unknown as T;
}

/* ─── Health ────────────────────────────────────────────── */
export const checkHealth = (): Promise<HealthResponse> => {
  if (USE_MOCK)
    return Promise.resolve({ status: "ok", version: "mock" });
  return get<HealthResponse>("/api/v1/health");
};

/* ─── Upload ────────────────────────────────────────────── */
export const uploadDocument = async (
  file: File,
): Promise<UploadResponse> => {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            contract_id: "mock-001",
            filename: file.name,
            page_count: 14,
            clause_count: 18,
          }),
        1200,
      ),
    );
  }
  const form = new FormData();
  form.append("file", file);
  const raw = await post<Record<string, unknown>>(
    "/api/v1/contracts/upload",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return transformUploadResponse(raw);
};

/* ─── Analyze ───────────────────────────────────────────── */
export const analyzeDocument = async (
  contractId: string,
): Promise<AnalysisResult> => {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_ANALYSIS_RESULT), 2800),
    );
  }
  // Backend uses GET /api/v1/contracts/{id}/analyze
  const raw = await get<Record<string, unknown>>(
    `/api/v1/contracts/${contractId}/analyze`,
  );
  return transformAnalysisResponse(raw);
};

/* ─── LLM Phase 1: Clause-by-clause analysis ───────────── */
export const analyzeDocumentLlmClauses = async (
  contractId: string,
): Promise<AnalysisResult> => {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_ANALYSIS_RESULT), 4000),
    );
  }
  const raw = await post<Record<string, unknown>>(
    `/api/v1/contracts/${contractId}/llm-analyze-clauses`,
  );
  return transformAnalysisResponse(raw);
};

/* ─── LLM Phase 2: Missing clause detection ────────────── */
export const analyzeDocumentLlmMissing = async (
  contractId: string,
): Promise<AnalysisResult> => {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_ANALYSIS_RESULT), 4000),
    );
  }
  const raw = await post<Record<string, unknown>>(
    `/api/v1/contracts/${contractId}/llm-analyze-missing`,
  );
  return transformAnalysisResponse(raw);
};

/* ─── Get existing analysis ──────────────────────────────── */
export const getContract = async (
  contractId: string,
): Promise<AnalysisResult> => {
  const raw = await get<Record<string, unknown>>(
    `/api/v1/contracts/${contractId}`,
  );
  return transformAnalysisResponse(raw);
};
