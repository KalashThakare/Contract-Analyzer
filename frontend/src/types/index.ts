// ─── Entity types ──────────────────────────────────────────────
export interface ClauseEntities {
  parties: string[];
  dates: string[];
  amounts: string[];
}

export interface DocumentEntities extends ClauseEntities {
  jurisdictions: string[];
}

// ─── Clause ────────────────────────────────────────────────────
export type RiskLevel = "high" | "medium" | "low";

export interface Clause {
  id: number;
  text: string;
  type: string;
  confidence: number;
  risk_score: number;
  risk_level: RiskLevel;
  is_unfair: boolean;
  entities: ClauseEntities;
  explanation: string | null;
  top_risk_terms: string[];
  recommendation?: string | null;
  ai_source?: string | null;
  similarity_score?: number | null;
  matched_template?: string | null;
}

// ─── Summary ───────────────────────────────────────────────────
export interface Summary {
  overall_risk_score: number;
  risk_level: RiskLevel;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

// ─── Missing Clause ───────────────────────────────────────────
export interface MissingClause {
  name: string;
  why_it_matters: string;
  risk_level: RiskLevel | string;
  example_wording: string;
}

// ─── Document meta ────────────────────────────────────────────
export interface DocumentMeta {
  document_id: string;
  pages: number;
  total_clauses: number;
  processing_time_ms: number;
  filename?: string;
}

// ─── Full analysis result ─────────────────────────────────────
export interface AnalysisResult {
  document: DocumentMeta;
  summary: Summary;
  entities: DocumentEntities;
  clauses: Clause[];
  missing_clauses: MissingClause[];
}

// ─── Upload info ──────────────────────────────────────────────
export interface UploadInfo {
  filename: string;
  pages: number;
}

// ─── API responses (matching backend schemas) ─────────────────
export interface HealthResponse {
  status: string;
  version: string;
}

export interface UploadResponse {
  contract_id: string;
  filename: string;
  page_count: number;
  clause_count: number;
}
