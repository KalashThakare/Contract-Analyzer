/**
 * transforms.ts
 * ─────────────────────────────────────────────────────────
 * Maps raw backend response shapes to the rich frontend types.
 *
 * The backend returns a flatter schema (ClauseDetail) while the
 * frontend components expect richer objects (Clause, Summary, etc.).
 * This file bridges that gap so the rest of the frontend stays
 * blissfully unaware of the backend schema.
 */

import type {
  AnalysisResult,
  Clause,
  ClauseEntities,
  DocumentEntities,
  DocumentMeta,
  RiskLevel,
  Summary,
  UploadResponse,
} from "@/types";

/* ─── Raw backend shapes (mirrors backend Pydantic schemas) ──── */

interface RawClauseDetail {
  index: number;
  text: string;
  clause_type?: string | null;
  is_unfair?: boolean | null;
  unfair_confidence?: number | null;
  risk_score?: number | null;
  similarity_score?: number | null;
  matched_template?: string | null;
}

interface RawContractAnalysis {
  contract_id: string;
  filename: string;
  clauses: RawClauseDetail[];
  missing_clauses: string[];
  overall_risk_score: number;
  analyzed_at: string;
}

interface RawUploadResponse {
  contract_id: string;
  filename: string;
  page_count: number;
  clause_count: number;
  uploaded_at: string;
}

/* ─── Helpers ─────────────────────────────────────────────── */

function computeRiskLevel(score: number): RiskLevel {
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}

/** Very basic entity extraction from clause text (best-effort). */
function extractClauseEntities(text: string): ClauseEntities {
  const partyPatterns = [
    /\b(?:the\s+)?(?:Company|Employer|Employee|Executive|Contractor|Consultant|Client|Vendor|Seller|Buyer|Licensor|Licensee|Lessee|Lessor|Tenant|Landlord|Borrower|Lender|Guarantor|Assignor|Assignee|either\s+party|both\s+parties)\b/gi,
  ];
  const datePatterns = [
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
  ];
  const amountPatterns = [/\$[\d,]+(?:\.\d{2})?(?:\s+(?:per\s+\w+|million|billion))?/gi];

  const parties = new Set<string>();
  const dates = new Set<string>();
  const amounts = new Set<string>();

  for (const p of partyPatterns) {
    for (const m of text.matchAll(p)) parties.add(m[0]);
  }
  for (const p of datePatterns) {
    for (const m of text.matchAll(p)) dates.add(m[0]);
  }
  for (const p of amountPatterns) {
    for (const m of text.matchAll(p)) amounts.add(m[0]);
  }

  return {
    parties: [...parties],
    dates: [...dates],
    amounts: [...amounts],
  };
}

/** Derive a human-friendly clause type label from the matched template or text. */
function deriveClauseType(raw: RawClauseDetail): string {
  if (raw.clause_type) return raw.clause_type;
  if (raw.matched_template) return raw.matched_template;

  // Simple keyword-based fallback
  const t = raw.text.toLowerCase();
  if (t.includes("indemnif")) return "Indemnification";
  if (t.includes("terminat")) return "Termination";
  if (t.includes("non-compete") || t.includes("noncompete")) return "Non-Compete";
  if (t.includes("confidential")) return "Confidentiality";
  if (t.includes("intellectual property") || t.includes("invention"))
    return "Intellectual Property";
  if (t.includes("governing law") || t.includes("jurisdiction"))
    return "Governing Law";
  if (t.includes("limitation of liability") || t.includes("consequential"))
    return "Limitation of Liability";
  if (t.includes("salary") || t.includes("compensation"))
    return "Compensation";
  if (t.includes("warranty") || t.includes("warranties")) return "Warranty";
  if (t.includes("force majeure")) return "Force Majeure";
  return "General";
}

/** Build risk terms from clause text when the backend doesn't provide them. */
function extractRiskTerms(text: string): string[] {
  const RISK_KEYWORDS = [
    "indemnify",
    "hold harmless",
    "any and all liability",
    "consequential damages",
    "limitation",
    "terminate",
    "non-compete",
    "exclusive property",
    "without cause",
    "immediately due",
    "at any time",
    "directly or indirectly",
    "whether or not",
    "working hours",
    "sole discretion",
    "irrevocable",
    "perpetual",
    "liquidated damages",
  ];
  const lowerText = text.toLowerCase();
  return RISK_KEYWORDS.filter((kw) => lowerText.includes(kw)).slice(0, 5);
}

/* ─── Public transform functions ───────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformUploadResponse(raw: any): UploadResponse {
  const data = raw as RawUploadResponse;
  return {
    contract_id: data.contract_id,
    filename: data.filename,
    page_count: data.page_count,
    clause_count: data.clause_count,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformAnalysisResponse(raw: any): AnalysisResult {
  const data = raw as RawContractAnalysis;

  // ── Build clauses ────────────────────────────────────
  const clauses: Clause[] = data.clauses.map((rc) => {
    const riskScore = rc.risk_score ?? (rc.is_unfair ? 75 : 25);
    const riskLevel = computeRiskLevel(riskScore);
    const entities = extractClauseEntities(rc.text);

    return {
      id: rc.index,
      text: rc.text,
      type: deriveClauseType(rc),
      confidence: rc.unfair_confidence ?? rc.similarity_score ?? 0.5,
      risk_score: Math.round(riskScore * 10) / 10,
      risk_level: riskLevel,
      is_unfair: rc.is_unfair ?? false,
      entities,
      explanation: null, // backend doesn't provide explanations yet
      top_risk_terms: extractRiskTerms(rc.text),
    };
  });

  // ── Build summary ────────────────────────────────────
  const highCount = clauses.filter((c) => c.risk_level === "high").length;
  const mediumCount = clauses.filter((c) => c.risk_level === "medium").length;
  const lowCount = clauses.filter((c) => c.risk_level === "low").length;

  const summary: Summary = {
    overall_risk_score: Math.round(data.overall_risk_score * 10) / 10,
    risk_level: computeRiskLevel(data.overall_risk_score),
    high_risk_count: highCount,
    medium_risk_count: mediumCount,
    low_risk_count: lowCount,
  };

  // ── Build document-level entities ────────────────────
  const allParties = new Set<string>();
  const allDates = new Set<string>();
  const allAmounts = new Set<string>();
  for (const c of clauses) {
    c.entities.parties.forEach((p) => allParties.add(p));
    c.entities.dates.forEach((d) => allDates.add(d));
    c.entities.amounts.forEach((a) => allAmounts.add(a));
  }
  const entities: DocumentEntities = {
    parties: [...allParties],
    dates: [...allDates],
    amounts: [...allAmounts],
    jurisdictions: [], // TODO: extract from text if needed
  };

  // ── Build document meta ──────────────────────────────
  const document: DocumentMeta = {
    document_id: data.contract_id,
    pages: 0, // backend doesn't return pages in the analysis response
    total_clauses: clauses.length,
    processing_time_ms: 0, // not provided by backend
    filename: data.filename,
  };

  return { document, summary, entities, clauses };
}
