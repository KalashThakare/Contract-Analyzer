import asyncio
import json
import logging
from typing import Any, Callable, Awaitable

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_OLLAMA_TIMEOUT = httpx.Timeout(
    connect=settings.LLM_CONNECT_TIMEOUT_SECONDS,
    read=settings.LLM_READ_TIMEOUT_SECONDS,
    write=30.0,
    pool=10.0,
)

_GROQ_TIMEOUT = httpx.Timeout(
    connect=10.0,
    read=60.0, 
    write=15.0,
    pool=10.0,
)

_HF_TIMEOUT = _OLLAMA_TIMEOUT  

OnChunkDone = Callable[[dict[int, dict[str, Any]]], Awaitable[None]] | None


class LLMAnalysisService:
    def __init__(self):
        self.enabled = settings.LLM_ENABLED
        self.provider = settings.LLM_PROVIDER.lower().strip()


    @staticmethod
    def _safe_json_extract(text: str) -> dict[str, Any] | None:
        """Try to extract a valid JSON object from raw LLM text."""
        if not text:
            return None
        
        import re
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

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

    def _get_chunk_size(self) -> int:
        """Return the per-provider chunk size."""
        if self.provider == "groq":
            return settings.GROQ_CHUNK_SIZE
        elif self.provider == "ollama":
            return settings.OLLAMA_CHUNK_SIZE
        return settings.LLM_CHUNK_SIZE  
    

    @staticmethod
    def _build_chunk_prompt(
        document_context: dict[str, Any],
        clauses: list[dict[str, Any]],
    ) -> str:
        """
        Build the clause-analysis prompt.

        The prompt is structured so that BOTH Ollama-class models (DeepSeek R1,
        Llama 3) and Groq-hosted models (deepseek-r1-distill-llama-70b,
        llama-3.3-70b-versatile) respond reliably with valid JSON.
        """
        payload = {
            "document_context": document_context,
            "clauses": clauses,
            "instructions": {
                "persona": "You are an elite Senior Corporate Attorney and Contract Risk Analyst.",
                "style": "Highly clinical, strictly objective, legally precise, and exceptionally concise.",
                "task": (
                    "Perform deeper semantic evaluation of potentially dangerous "
                    "contractual clauses flagged by our initial DL classifier."
                ),
                "strict_rules": [
                    "Output exclusively valid, parsable JSON. Absolutely NO markdown wrappers like ```json.",
                    "Do NOT include any chain-of-thought, reasoning, or commentary outside the JSON object.",
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
            "Return strictly raw JSON. Do not include markdown formatting, commentary, or chain-of-thought.\n"
            + json.dumps(payload, ensure_ascii=False)
        )

    @staticmethod
    def _build_missing_clauses_prompt(clauses: list[dict[str, Any]]) -> str:
        """
        Build the missing-clause detection prompt.

        Works for both Ollama cloud models and Groq-hosted models.
        """
        full_text = "\n\n".join(c.get("text", "") for c in clauses)

        payload = {
            "instructions": {
                "persona": "You are a Senior Corporate Attorney.",
                "task": (
                    "Read the following contract clauses and identify up to 5-7 CRITICAL "
                    "missing legal clauses (Missing Assertions) that should normally be "
                    "present in a contract of this kind but are absent."
                ),
                "rules": [
                    "Return ONLY parseable JSON. No markdown. No chain-of-thought or reasoning text.",
                    "Generate a 'missing_clauses' array containing max 5-7 objects.",
                    "Each object MUST have 'name' (string), 'why_it_matters' (string), "
                    "'risk_level' (string: Critical, High, or Medium), and 'example_wording' (string).",
                ],
                "expected_schema": {
                    "missing_clauses": [
                        {
                            "name": "Clause Name",
                            "why_it_matters": "Reason",
                            "risk_level": "High",
                            "example_wording": "Example text",
                        }
                    ]
                },
            },
            "contract_text": full_text[:40000],  # clamp to avoid extreme context length
        }

        return (
            "Return strictly raw JSON. No markdown wrappers. No chain-of-thought.\n"
            + json.dumps(payload, ensure_ascii=False)
        )

    # LLM Provider Calls

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
            timeout=_OLLAMA_TIMEOUT,
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

    async def _call_groq(self, prompt: str) -> str:
        if not settings.GROQ_API_KEY:
            raise RuntimeError(
                "GROQ_API_KEY is not set in .env. "
                "Get one free at https://console.groq.com"
            )

        url = f"{settings.GROQ_BASE_URL.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        body = {
            "model": settings.GROQ_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an elite Senior Corporate Attorney and Contract Risk Analyst. "
                        "You MUST respond with strictly valid JSON. Do not include any markdown, "
                        "commentary, chain-of-thought, or explanation outside the JSON object."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            "temperature": settings.GROQ_TEMPERATURE,
            "max_tokens": settings.GROQ_MAX_TOKENS,
            "response_format": {"type": "json_object"},
        }

        async with httpx.AsyncClient(timeout=_GROQ_TIMEOUT) as client:
            response = await client.post(url, headers=headers, json=body)
            if response.status_code >= 400:
                logger.error(
                    "Groq HTTP %s: %s",
                    response.status_code,
                    response.text[:2000],
                )
            response.raise_for_status()
            data = response.json()

        choices = data.get("choices", [])
        if choices and isinstance(choices, list):
            message = choices[0].get("message", {})
            content = message.get("content", "")
            usage = data.get("usage", {})
            logger.info(
                "Groq response: model=%s, tokens_in=%s, tokens_out=%s",
                data.get("model", "?"),
                usage.get("prompt_tokens", "?"),
                usage.get("completion_tokens", "?"),
            )
            return str(content)

        return ""

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

        async with httpx.AsyncClient(timeout=_HF_TIMEOUT) as client:
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
        """Route the prompt to the active provider based on LLM_PROVIDER."""
        if self.provider == "ollama":
            return await self._call_ollama(prompt)
        elif self.provider == "groq":
            return await self._call_groq(prompt)
        elif self.provider == "huggingface":
            return await self._call_huggingface(prompt)
        logger.warning("Unsupported LLM provider '%s'", self.provider)
        return ""


    async def _process_chunk(
        self,
        document_context: dict[str, Any],
        chunk: list[dict[str, Any]],
    ) -> dict[int, dict[str, Any]]:
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
        if not self.enabled or not clauses:
            return {}

        chunk_size = self._get_chunk_size()
        priority_clauses = clauses

        logger.info(
            "LLM chunked analysis [%s]: %d total, chunk_size=%d",
            self.provider,
            len(clauses),
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

                if on_chunk_done is not None:
                    try:
                        await on_chunk_done(dict(merged))
                    except Exception:
                        logger.exception("on_chunk_done callback failed — continuing")

            if start + chunk_size < len(priority_clauses):
                delay = 0.5 if self.provider == "groq" else 1.5
                await asyncio.sleep(delay)

        logger.info(
            "LLM clause analysis complete [%s]: %d clauses annotated",
            self.provider,
            len(merged),
        )
        return merged

    async def generate_missing_clauses(self, clauses: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Evaluate the entire contract text to find missing structural clauses (max 5-7)."""
        if not self.enabled or not clauses:
            return []

        prompt = self._build_missing_clauses_prompt(clauses)

        try:
            logger.info("Requesting missing clauses from LLM [%s]...", self.provider)
            raw_text = await self._call_llm(prompt)
            parsed = self._safe_json_extract(raw_text)

            if parsed and "missing_clauses" in parsed:
                mc = parsed["missing_clauses"]
                if isinstance(mc, list):
                    logger.info("LLM [%s] generated %d missing clauses.", self.provider, len(mc))
                    return mc[:7]
        except Exception as e:
            logger.exception("Failed to generate missing clauses [%s]: %s", self.provider, e)

        return []
