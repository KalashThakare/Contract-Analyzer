import asyncio
import json
import logging
from typing import Any, Callable, Awaitable

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Separate connect vs. read timeout:
# connect: how long to wait for TCP handshake (should be very short)
# read: how long to wait for the LLM to stream back its response (can be huge)
_LLM_TIMEOUT = httpx.Timeout(
    connect=settings.LLM_CONNECT_TIMEOUT_SECONDS,
    read=settings.LLM_READ_TIMEOUT_SECONDS,
    write=30.0,
    pool=10.0,
)

# Type alias for the on_chunk_done callback
OnChunkDone = Callable[[dict[int, dict[str, Any]]], Awaitable[None]] | None


class LLMAnalysisService:
    def __init__(self):
        self.enabled = settings.LLM_ENABLED
        self.provider = settings.LLM_PROVIDER.lower().strip()

    @staticmethod
    def _safe_json_extract(text: str) -> dict[str, Any] | None:
        if not text:
            return None
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                return data
        except Exception:
            pass

        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None

        candidate = text[start : end + 1]
        try:
            data = json.loads(candidate)
            if isinstance(data, dict):
                return data
        except Exception:
            return None

        return None

    @staticmethod
    def _build_chunk_prompt(
        document_context: dict[str, Any],
        clauses: list[dict[str, Any]],
    ) -> str:
        payload = {
            "document_context": document_context,
            "clauses": clauses,
            "instructions": {
                "persona": "You are an elite Senior Corporate Attorney and Contract Risk Analyst.",
                "style": "Highly clinical, strictly objective, legally precise, and exceptionally concise.",
                "task": "Perform deeper semantic evaluation of potentially dangerous contractual clauses flagged by our initial ML classifier.",
                "strict_rules": [
                    "Output exclusively valid, parsable JSON. Absolutely NO markdown wrappers like ```json.",
                    "You MUST return a JSON entry for EVERY clause index provided. Do not skip any.",
                    "Base all analysis entirely on provided text. Do not invent entities, jurisdictions, or assumptions.",
                    "The top_risk_terms MUST be exact, verbatim substrings extracted directly from the clause text.",
                    "Your 'explanation' must be 2-3 precise sentences detailing liability exposure, asymmetrical obligations, or statutory friction.",
                    "Your 'recommendation' must be a single, actionable sentence on how to redline or neutralize the identified risk.",
                ],
                "expected_json_schema": {
                    "clauses": [
                        {
                            "index": "Integer (must exactly match the input index)",
                            "explanation": "String",
                            "top_risk_terms": ["String (Verbatim quote 1)", "String (Verbatim quote 2)"],
                            "recommendation": "String",
                        }
                    ],
                    "document_summary": {
                        "executive_summary": "String (2-sentence risk evaluation of this chunk)",
                        "priority_actions": ["String", "String"],
                    },
                },
            },
        }

        return (
            "Return strictly raw JSON. Do not include markdown formatting or commentary.\n"
            + json.dumps(payload, ensure_ascii=False)
        )

    async def _call_ollama(self, prompt: str) -> str:
        url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
        body = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.1},
        }

        headers: dict[str, str] = {}
        if settings.OLLAMA_API_KEY:
            headers["Authorization"] = f"Bearer {settings.OLLAMA_API_KEY}"

        import certifi
        async with httpx.AsyncClient(
            timeout=_LLM_TIMEOUT,
            verify=certifi.where(),
        ) as client:
            response = await client.post(url, headers=headers, json=body)
            if response.status_code >= 400:
                logger.error(
                    "Ollama HTTP %s: %s",
                    response.status_code,
                    response.text[:2000],
                )
            response.raise_for_status()
            data = response.json()
            logger.info("Ollama response keys: %s", list(data.keys()))
            return str(data.get("response", ""))

    async def _call_huggingface(self, prompt: str) -> str:
        url = f"https://api-inference.huggingface.co/models/{settings.HF_LLM_MODEL}"
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if settings.HF_TOKEN:
            headers["Authorization"] = f"Bearer {settings.HF_TOKEN}"

        body = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 2000,
                "temperature": 0.1,
                "return_full_text": False,
            },
        }

        async with httpx.AsyncClient(timeout=_LLM_TIMEOUT) as client:
            response = await client.post(url, headers=headers, json=body)
            if response.status_code >= 400:
                logger.error(
                    "HF LLM HTTP %s: %s",
                    response.status_code,
                    response.text[:2000],
                )
            response.raise_for_status()
            data = response.json()

        if isinstance(data, list) and data:
            first = data[0]
            if isinstance(first, dict):
                return str(first.get("generated_text", ""))
        if isinstance(data, dict):
            if "generated_text" in data:
                return str(data["generated_text"])
            if "error" in data:
                raise RuntimeError(str(data["error"]))

        return ""

    async def _call_llm(self, prompt: str) -> str:
        if self.provider == "ollama":
            return await self._call_ollama(prompt)
        elif self.provider == "huggingface":
            return await self._call_huggingface(prompt)
        logger.warning("Unsupported LLM provider '%s'", self.provider)
        return ""

    async def _process_chunk(
        self,
        document_context: dict[str, Any],
        chunk: list[dict[str, Any]],
    ) -> dict[int, dict[str, Any]]:
        """Send one chunk to the LLM and parse clause-level results."""
        prompt = self._build_chunk_prompt(document_context, chunk)
        max_terms = max(1, settings.LLM_MAX_TERMS_PER_CLAUSE)

        try:
            raw_text = await self._call_llm(prompt)
            parsed = self._safe_json_extract(raw_text)
            if not parsed:
                logger.warning("LLM chunk output could not be parsed as JSON")
                return {}

            clause_items = parsed.get("clauses", [])
            if not isinstance(clause_items, list):
                return {}

            result: dict[int, dict[str, Any]] = {}
            for item in clause_items:
                if not isinstance(item, dict):
                    continue
                idx = item.get("index")
                if not isinstance(idx, int):
                    continue

                explanation = item.get("explanation")
                recommendation = item.get("recommendation")
                top_terms = item.get("top_risk_terms")

                if not isinstance(explanation, str):
                    explanation = None
                if not isinstance(recommendation, str):
                    recommendation = None
                if not isinstance(top_terms, list):
                    top_terms = []

                clean_terms = [str(t).strip() for t in top_terms if str(t).strip()][:max_terms]

                result[idx] = {
                    "explanation": explanation,
                    "recommendation": recommendation,
                    "top_risk_terms": clean_terms,
                }

            return result

        except Exception:
            logger.exception("LLM chunk failed (%s)", self.provider)
            return {}

    async def generate_clause_analysis(
        self,
        document_context: dict[str, Any],
        clauses: list[dict[str, Any]],
        on_chunk_done: OnChunkDone = None,
    ) -> dict[int, dict[str, Any]]:
        """
        Analyse clauses by splitting into fixed-size chunks and calling the LLM
        sequentially.

        After each chunk succeeds, `on_chunk_done(partial_results)` is awaited if
        provided — this lets the caller persist partial results immediately so the
        frontend can poll and show progressive updates.
        """
        if not self.enabled or not clauses:
            return {}

        priority_clauses = clauses
        chunk_size = settings.LLM_CHUNK_SIZE

        logger.info(
            "LLM chunked analysis: %d total, %d priority, chunk_size=%d",
            len(clauses),
            len(priority_clauses),
            chunk_size,
        )

        merged: dict[int, dict[str, Any]] = {}

        for i, start in enumerate(range(0, len(priority_clauses), chunk_size)):
            chunk = priority_clauses[start : start + chunk_size]
            chunk_result = await self._process_chunk(document_context, chunk)

            if chunk_result:
                merged.update(chunk_result)
                logger.info(
                    "Chunk %d/%d done: %d clauses annotated so far",
                    i + 1,
                    -(-len(priority_clauses) // chunk_size),  # ceil division
                    len(merged),
                )

                # Persist partial results immediately after each chunk
                if on_chunk_done is not None:
                    try:
                        await on_chunk_done(dict(merged))
                    except Exception:
                        logger.exception("on_chunk_done callback failed — continuing")

            # Small delay between chunks to avoid rate-limit hammering
            if start + chunk_size < len(priority_clauses):
                await asyncio.sleep(1.5)

        logger.info("LLM clause analysis complete: %d clauses annotated", len(merged))
        return merged

    async def generate_missing_clauses(self, clauses: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Evaluate the entire contract text to find missing structural clauses (max 5-7)."""
        if not self.enabled or not clauses:
            return []
            
        full_text = "\n\n".join(c.get("text", "") for c in clauses)
        
        payload = {
            "instructions": {
                "persona": "You are a Senior Corporate Attorney.",
                "task": "Read the following contract clauses and identify up to 5-7 CRITICAL missing legal clauses (Missing Assertions) that should normally be present in a contract of this kind but are absent.",
                "rules": [
                    "Return ONLY parseable JSON.",
                    "Generate a 'missing_clauses' array containing max 5-7 objects.",
                    "Each object MUST have 'name' (string), 'why_it_matters' (string), 'risk_level' (string: Critical, High, or Medium), and 'example_wording' (string)."
                ],
                "expected_schema": {
                    "missing_clauses": [
                        {
                            "name": "Clause Name",
                            "why_it_matters": "Reason",
                            "risk_level": "High",
                            "example_wording": "Example text"
                        }
                    ]
                }
            },
            "contract_text": full_text[:40000]  # clamp to avoid extreme context length
        }
        
        prompt = (
            "Return strictly raw JSON. No markdown wrappers.\n"
            + json.dumps(payload, ensure_ascii=False)
        )
        
        try:
            logger.info("Requesting missing clauses from LLM...")
            raw_text = await self._call_llm(prompt)
            parsed = self._safe_json_extract(raw_text)
            
            if parsed and "missing_clauses" in parsed:
                mc = parsed["missing_clauses"]
                if isinstance(mc, list):
                    logger.info("LLM generated %d missing clauses.", len(mc))
                    return mc[:7]
        except Exception as e:
            logger.exception("Failed to generate missing clauses: %s", e)
            
        return []
