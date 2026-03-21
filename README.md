# Legal Contract Analyzer — Deep Learning Lab Project

> A multi-model deep learning system for automated legal contract analysis — clause classification, risk scoring, unfair clause detection, entity extraction, and LLM-powered semantic review.

Built as a lab project for the **Deep Learning** course under **Prof. Vikas R. Gupta**.

---

## Table of Contents

1. [Project Objective](#project-objective)
2. [Team and Contributions](#team-and-contributions)
3. [Deep Learning Architecture](#deep-learning-architecture)
4. [DL Models — Detailed Breakdown](#dl-models--detailed-breakdown)
5. [LLM Integration Layer](#llm-integration-layer)
6. [Analysis Pipeline](#analysis-pipeline)
7. [What We Learned](#what-we-learned)
8. [Tech Stack](#tech-stack)
9. [Getting Started](#getting-started)
10. [Environment Variables](#environment-variables)
11. [Project Structure](#project-structure)
12. [API Reference](#api-reference)
13. [License](#license)

---

## Project Objective

Legal contracts contain hundreds of clauses, each carrying potential risks — indemnification traps, unilateral termination rights, asymmetric liability caps, and missing protective provisions. Manually reviewing even a single contract takes hours.

This project applies **Deep Learning** to automate this process:

- **4 fine-tuned BERT-based DL models** handle structured extraction (classification, risk scoring, unfairness detection, entity recognition)
- **An LLM layer** (Ollama Cloud / Groq) provides deep semantic review — generating human-readable explanations, identifying missing clauses, and recommending redline actions

The system processes a contract PDF end-to-end and produces a comprehensive risk report in under a minute.

---

## Team and Contributions

| Member | Responsibilities |
|--------|-----------------|
| **Jayesh Rajbhar** | Multi-task Legal-BERT model (HF: `AnkushRaheja/Cls_Class_Risk_Scr`) for simultaneous clause classification + risk scoring, sklearn baseline models, LLM integration (hybrid Ollama/Groq provider), frontend dashboard, project lead |
| **Kalash Thakare** | Unfair clause detection — fine-tuned BERT binary classifier (`KalashT/unfair-clause-classifier`), backend architecture (FastAPI, database, API design), pipeline integration, clause segmentation engine |
| **Gaurav Dongre** | Named Entity Recognition — Legal-BERT fine-tuned on CUAD (`Devil1710/Legal-NER-v2`), entity extraction pipeline (IOB2 decoding, subword merging) |

> *Note:* `AnkushRaheja` is Jayesh Rajbhar's HuggingFace username. All models under that namespace were trained and published by Jayesh.

---

## Deep Learning Architecture

```
   PDF Upload
       │
       ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  FAST DL PIPELINE (~3-5 seconds)                                   │
  │                                                                     │
  │  [1] PyMuPDF Text Extraction                                       │
  │       │                                                             │
  │       ▼                                                             │
  │  [2] Clause Segmentation (regex heuristics)                        │
  │       │                                                             │
  │       ▼                                                             │
  │  ┌────┴────────────┬──────────────────┬──────────────────┐         │
  │  │                 │                  │                   │         │
  │  ▼                 ▼                  ▼                   ▼         │
  │  Multi-Task        Unfairness         Legal-NER           SHAP     │
  │  Legal-BERT        Detection          Token                Risk    │
  │  (Cls+Risk)        BERT               Classification      Terms   │
  │  768d→2 heads      768d→2 class       768d→IOB2 tags              │
  │  │                 │                  │                            │
  │  ▼                 ▼                  ▼                            │
  │  clause_type       is_unfair          entities                     │
  │  risk_score        confidence         (PARTY, DATE,                │
  │  (0-100)           (0.0-1.0)           AMOUNT, TERM)               │
  │                                                                     │
  └──────────────────────────┬──────────────────────────────────────────┘
                             │
                     Results stored in DB
                     Frontend shows DL scores
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  LLM SEMANTIC REVIEW (background, progressive)                     │
  │                                                                     │
  │  Phase 1: Clause-by-clause deep analysis                           │
  │   → explanation, recommendation, top_risk_terms per clause          │
  │   → Chunks of N clauses sent to LLM sequentially                   │
  │   → Each chunk result saved to DB immediately (progressive poll)   │
  │                                                                     │
  │  Phase 2: Missing clause identification                            │
  │   → Full contract text sent to LLM                                  │
  │   → Returns 5-7 critical missing clauses with example wording      │
  │                                                                     │
  │  Provider: Ollama Cloud OR Groq  (switchable via .env)             │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## DL Models — Detailed Breakdown

### Model 1: Multi-Task Legal-BERT (Classification + Risk Scoring)

| Property | Value |
|----------|-------|
| **HuggingFace Repo** | `AnkushRaheja/Cls_Class_Risk_Scr` |
| **Base Architecture** | `nlpaueb/legal-bert-base-uncased` (768-dim) |
| **Training Data** | LEDGAR dataset (100+ clause types) |
| **Task** | Joint clause classification + risk regression |
| **Architecture** | Shared BERT encoder → two task-specific heads |

```
Input: clause text (max 512 tokens)
          │
          ▼
   BERT Encoder (12 layers, 768-dim)
          │
     [CLS] pooled output
          │
    ┌─────┴─────┐
    ▼           ▼
 Classifier   Regressor
 768→384→ReLU  768→384→ReLU
 384→N_labels  384→1→Sigmoid
    │           │
    ▼           ▼
 clause_type   risk_score
 (softmax)     (0.0 - 1.0 → scaled to 0-100)
```

**DL Concepts Applied:**
- Multi-task learning with shared BERT backbone — two independent heads trained jointly
- Transfer learning from Legal-BERT (pre-trained on 12GB of legal documents)
- Dropout regularization (p=0.25) between dense layers
- Sigmoid activation on regressor head for bounded risk output

### Model 2: Unfair Clause Detection BERT

| Property | Value |
|----------|-------|
| **HuggingFace Repo** | `KalashT/unfair-clause-classifier` |
| **Base Architecture** | `bert-base-uncased` |
| **Task** | Binary classification (fair vs. unfair) |
| **Max Tokens** | 128 |

```
Input: clause text (max 128 tokens, padded)
          │
          ▼
  BERT Sequence Classification (2-class)
          │
          ▼
     Softmax → argmax
          │
          ▼
  { is_unfair: bool, confidence: float }
```

**DL Concepts Applied:**
- Fine-tuned BERT for binary sequence classification
- Domain adaptation — detecting commercially asymmetric legal language
- Short context window (128 tokens) optimized for individual clause-level decisions

### Model 3: Legal Named Entity Recognition (NER)

| Property | Value |
|----------|-------|
| **HuggingFace Repo** | `Devil1710/Legal-NER-v2` |
| **Base Architecture** | Legal-BERT (Token Classification) |
| **Task** | IOB2 sequence labeling |
| **Entity Types** | PARTY, DATE, AMOUNT, TERM, JURISDICTION, etc. |

```
Input: clause text (max 512 tokens)
          │
          ▼
  BERT Tokenizer → subword tokens
          │
          ▼
  Legal-BERT Token Classification
  (logits per token per label)
          │
          ▼
  Softmax → argmax per token → IOB2 tags
          │
          ▼
  Subword Merging:
    - Discard [CLS], [SEP], [PAD]
    - Discard ## subword continuations
          │
          ▼
  IOB2 → Entity Span Conversion:
    B-PARTY starts entity, I-PARTY continues, O closes
          │
          ▼
  [{ text: "Apple Inc", label: "PARTY", confidence: 0.97 }]
```

**DL Concepts Applied:**
- Token-level classification (vs. sequence-level in Models 1 & 2)
- IOB2 tagging scheme for named entity boundary detection
- Subword-to-word alignment — merging BERT's WordPiece tokens back into readable entities
- Confidence scoring per entity span

### Model 4: sklearn Baseline Risk Scorer

| Property | Value |
|----------|-------|
| **Source** | `AnkushRaheja/Legal-Document-Analyzer` (sklearn-models/) |
| **Architecture** | TF-IDF Vectorizer → Ridge Regression |
| **Task** | Risk score prediction (0-100) |

This acts as a fallback when the Multi-Task BERT model is unavailable. While not a deep learning model in the traditional sense, it demonstrates the contrast between classical ML feature engineering (TF-IDF bag-of-words) and learned representations (BERT embeddings).

### Risk Score Calculation

| Score Range | Level  |
|-------------|--------|
| 70 – 100    | HIGH   |
| 40 – 69     | MEDIUM |
| 0 – 39      | LOW    |

**Overall document risk** = arithmetic mean of all per-clause risk scores.

---

## LLM Integration Layer

### Why LLMs on Top of DL Models?

The four DL models above produce **structured, deterministic outputs** — a clause type label, a risk score, a fair/unfair flag, entity tags. But they cannot explain *why* a clause is dangerous in natural language, nor can they reason about what's *missing* from a contract.

The LLM layer addresses this gap:
- **Phase 1 — Clause Analysis**: For each clause, the LLM generates a human-readable explanation of liability exposure, identifies exact risk terms (verbatim substrings), and recommends a redline action.
- **Phase 2 — Missing Clause Detection**: The LLM reads the full contract text and identifies 5–7 critical clauses that should be present but are absent (e.g., Force Majeure, Arbitration, Data Protection).

### Hybrid Provider Architecture

The system supports **two LLM providers** that can be swapped with a single `.env` variable:

```
LLM_PROVIDER=ollama    # OR  LLM_PROVIDER=groq
```

| Feature | Ollama (Cloud) | Groq |
|---------|---------------|------|
| **Model** | DeepSeek V3.2 (configurable) | deepseek-r1-distill-llama-70b |
| **Hosting** | Ollama Cloud | Groq LPU Cloud |
| **Speed** | ~2-5 min per chunk | ~5-15 sec per chunk |
| **Chunk Size** | 3 clauses/prompt | 8 clauses/prompt |
| **Read Timeout** | 600s | 60s |
| **API Format** | `/api/generate` | OpenAI-compatible `/chat/completions` |
| **JSON Enforcement** | `format: "json"` | `response_format: { type: "json_object" }` |
| **Cost** | Free tier available | Free tier (14,400 req/day) |

**Switching providers** requires changing only `LLM_PROVIDER` in `.env` and restarting the backend. No code changes needed.

### Progressive Results

LLM analysis runs **asynchronously in the background** after the fast DL pipeline completes:

1. User uploads PDF → DL pipeline runs (~3-5s) → results displayed immediately
2. LLM Phase 1 starts in background → each chunk is saved to DB as it completes → frontend polls every 15s and shows progressive updates
3. After Phase 1 completes, Phase 2 (missing clauses) starts automatically
4. Each phase has independent loading states and error handling on the frontend

### DeepSeek R1 `<think>` Tag Handling

DeepSeek R1 models emit chain-of-thought reasoning inside `<think>...</think>` XML blocks before outputting JSON. The `_safe_json_extract()` method strips these tags automatically using regex before JSON parsing, ensuring compatibility with both standard models and reasoning models.

---

## What We Learned

### Deep Learning Concepts Applied

1. **Transfer Learning** — All four models leverage pre-trained BERT weights, fine-tuned on domain-specific legal corpora. This dramatically reduces the training data requirement versus training from scratch.

2. **Multi-Task Learning** — The `Cls_Class_Risk_Scr` model shares a single BERT encoder between two task-specific heads (classifier + regressor). This forces the shared representation to encode features useful for both tasks, improving generalization.

3. **Token Classification vs. Sequence Classification** — We implemented both paradigms:
   - Sequence classification (Models 1 & 2): One label per input sequence
   - Token classification (Model 3): One label per token, requiring IOB2 decoding and subword merging

4. **Domain Adaptation** — Using `legal-bert-base-uncased` (pre-trained on 12GB of legal text) as the base model instead of generic `bert-base-uncased` significantly improved performance on legal-specific terminology.

5. **Dropout Regularization** — Applied at p=0.25 between dense layers in the multi-task heads to prevent overfitting on the relatively small LEDGAR training set.

6. **Sigmoid vs. Softmax Activation** — The risk regressor uses Sigmoid to produce bounded [0, 1] output (scaled to 0-100), while the classifier uses Softmax for probability distribution across classes.

### LLM Integration Insights

7. **Structured Output Enforcement** — We discovered that LLMs require explicit prompt engineering to produce valid JSON. Different providers need different enforcement mechanisms (`format: "json"` for Ollama vs. `response_format: { type: "json_object" }` for Groq's OpenAI-compatible API).

8. **Chain-of-Thought Contamination** — DeepSeek R1 reasoning models wrap their internal reasoning in `<think>` tags before the actual response. Without stripping these, JSON parsing fails silently. This was a non-obvious integration challenge.

9. **Chunking Strategy** — Sending all clauses in one prompt causes context overflow and degraded output quality. Splitting into small chunks (3-8 clauses) and processing sequentially produces far more reliable results.

10. **Progressive Loading UX** — LLM responses can take minutes. Instead of blocking the UI, we implemented a callback-based system where each chunk is persisted to the database immediately upon completion, and the frontend polls for updates.

11. **Provider Abstraction** — By abstracting the LLM layer behind a provider interface, we can swap between Ollama and Groq (or add new providers) without touching any business logic. This proved essential when one provider's rate limits were exhausted.

### Classical ML vs. Deep Learning

12. **Feature Engineering vs. Learned Representations** — The sklearn baseline (TF-IDF + Ridge) requires manual feature engineering and loses semantic context. The BERT-based models automatically learn contextual representations, capturing nuances like negation ("shall NOT be liable") that bag-of-words approaches miss entirely.

---

## Tech Stack

### Backend (Python)
- **Framework**: FastAPI
- **Deep Learning**: PyTorch, HuggingFace Transformers
- **Classical ML**: scikit-learn, NumPy
- **Database**: Supabase (PostgreSQL) via SQLAlchemy
- **PDF Parsing**: PyMuPDF
- **LLM Client**: httpx (async HTTP)
- **Model Hub**: HuggingFace Hub (automatic download + caching)

### Frontend (TypeScript)
- **Framework**: Next.js (React)
- **Styling**: TailwindCSS and Vanilla CSS with CSS variables (dark/light theme)
- **HTTP Client**: Axios
- **Icons**: Lucide React

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL database (or Supabase account)
- (Optional) Groq API key for fast LLM inference

### Backend Setup

```bash
cd Legal-Contract-Analyzer/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\Activate.ps1       # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, LLM provider settings, etc.

# Run the server
python main.py
```

On first startup, all DL models are downloaded from HuggingFace Hub and cached locally. This may take several minutes.

### Frontend Setup

```bash
cd Legal-Contract-Analyzer/frontend

npm install
npm run dev
```

The frontend runs on `http://localhost:3000`.

---

## Environment Variables

Create a `.env` file in `backend/`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) | *Required* |
| `LLM_ENABLED` | Enable/disable LLM analysis | `true` |
| `LLM_PROVIDER` | Active LLM provider: `ollama` or `groq` | `ollama` |
| **Ollama Config** | | |
| `OLLAMA_BASE_URL` | Ollama API endpoint | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3` |
| `OLLAMA_API_KEY` | Ollama Cloud API key (if using cloud) | `None` |
| `OLLAMA_CHUNK_SIZE` | Clauses per LLM prompt (Ollama) | `3` |
| **Groq Config** | | |
| `GROQ_API_KEY` | Groq API key from console.groq.com | `None` |
| `GROQ_MODEL` | Groq model name | `deepseek-r1-distill-llama-70b` |
| `GROQ_CHUNK_SIZE` | Clauses per LLM prompt (Groq) | `8` |
| `GROQ_MAX_TOKENS` | Max output tokens | `4096` |
| **Shared** | | |
| `LLM_TIMEOUT_SECONDS` | Total LLM timeout | `900` |
| `LLM_READ_TIMEOUT_SECONDS` | Per-chunk read timeout | `600` |
| `NER_MODEL` | HuggingFace NER model | `Devil1710/Legal-NER-v2` |
| `HF_MULTITASK_REPO_ID` | Multi-task BERT model | `AnkushRaheja/Cls_Class_Risk_Scr` |
| `MAX_UPLOAD_SIZE_MB` | Maximum PDF upload size | `20` |

---

## Project Structure

```
Legal-Contract-Analyzer/
├── backend/
│   ├── main.py                              # FastAPI entry point, model warmup
│   ├── requirements.txt
│   ├── app/
│   │   ├── ml/                              # ← DL MODEL LAYER
│   │   │   ├── multitask_predictor.py       #   Multi-Task Legal-BERT (Cls + Risk)
│   │   │   ├── unfair_detector.py           #   BERT Unfair Clause Classifier
│   │   │   ├── ner_extractor.py             #   Legal-BERT NER (IOB2)
│   │   │   ├── clause_classifier.py         #   BERT clause classifier
│   │   │   ├── risk_scorer.py               #   sklearn Ridge baseline
│   │   │   ├── clause_segmenter.py          #   Regex clause segmentation
│   │   │   ├── similarity_matcher.py        #   Template similarity
│   │   │   ├── missing_clause_detector.py   #   Rule-based missing clause detection
│   │   │   └── model_loader.py              #   HuggingFace Hub pkl loader
│   │   ├── services/                        # ← BUSINESS LOGIC
│   │   │   ├── contract_service.py          #   Full pipeline orchestrator
│   │   │   ├── llm_analysis_service.py      #   Hybrid LLM provider (Ollama/Groq)
│   │   │   ├── pdf_processor.py             #   PDF text extraction
│   │   │   ├── unfair_clause_service.py     #   Standalone unfair detection
│   │   │   ├── similarity_service.py        #   Similarity comparison
│   │   │   └── missing_clause_service.py    #   Missing clause detection
│   │   ├── api/v1/endpoints/               # REST endpoints
│   │   ├── core/config.py                  # Pydantic settings (all env vars)
│   │   ├── db/                             # SQLAlchemy models + session
│   │   └── schemas/                        # Pydantic request/response schemas
│   └── tests/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx                     # Landing page
│       │   └── dashboard/
│       │       ├── page.tsx                 # Main dashboard
│       │       ├── upload/                  # Upload pipeline UI
│       │       ├── clauses/                 # Clause explorer with LLM status
│       │       ├── missing-clauses/         # Missing clause detection UI
│       │       ├── entities/                # NER entity browser
│       │       ├── similarity/              # Template similarity
│       │       ├── risk/                    # Risk analysis
│       │       └── models/                  # Model info page
│       ├── context/AnalysisContext.tsx       # Global state + notifications
│       ├── components/                      # Reusable UI components
│       └── services/api.ts                  # Backend API client
└── README.md
```

---

## API Reference

Base URL: `http://localhost:8000/api/v1`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server status |
| `/contracts/upload` | POST | Upload PDF contract |
| `/contracts/{id}/analyze` | GET | Run full DL pipeline |
| `/contracts/{id}` | GET | Get analysis results |
| `/contracts/{id}/llm-analyze-clauses` | POST | LLM Phase 1: clause analysis |
| `/contracts/{id}/llm-analyze-missing` | POST | LLM Phase 2: missing clauses |
| `/unfair-clauses/detect` | POST | Standalone unfair detection |
| `/similarity/compare` | POST | Template similarity |
| `/missing-clauses/detect` | POST | Missing clause detection |

---

## License

This project was developed by **Jayesh Rajbhar**, **Gaurav Dongre** and **Kalash Thakare** as part of the Deep Learning Lab coursework under **Prof. Vikas R. Gupta**. For academic use only.
