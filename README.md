# AI-Powered Legal Document Analyzer

A full-stack deep learning application that analyzes legal contracts by classifying clauses, detecting unfair terms, scoring risk, and extracting named entities. Built as a lab project under **Prof. Vikas R. Gupta** for the Deep Learning course.

---

## Table of Contents

1. [Team and Contributions](#team-and-contributions)
2. [Architecture Overview](#architecture-overview)
3. [Analysis Pipeline](#analysis-pipeline)
4. [DL Models](#dl-models)
5. [API Reference](#api-reference)
6. [Tech Stack](#tech-stack)
7. [Getting Started](#getting-started)
8. [Project Structure](#project-structure)
9. [Environment Variables](#environment-variables)
10. [License](#license)

---

## Team and Contributions

| Member | Responsibilities |
|--------|-----------------|
| **Kalash Thakare** | Unfair clause detection (fine-tuned BERT binary classifier — `KalashT/unfair-clause-classifier`), backend architecture (FastAPI, database, API design), pipeline integration, clause segmentation engine |
| **Gaurav Dongre** | Named Entity Recognition model (Legal-BERT fine-tuned on CUAD — `Devil1710/Legal-Document-Analyzer-NER`), entity extraction pipeline (IOB2 decoding, subword merging) |
| **Jayesh Rajbhar** | Clause classifier (Legal-BERT fine-tuned on LEDGAR — `AnkushRaheja/Legal-Document-Analyzer`), risk scorer (TF-IDF + Ridge regression), sklearn baseline models | Frontend development (Next.js dashboard)

---

## Architecture Overview

```
                         +-------------------+
                         |   Next.js Client  |
                         |   (Port 3000)     |
                         +---------+---------+
                                   |
                              HTTP / REST
                                   |
                         +---------v---------+
                         |   FastAPI Server   |
                         |   (Port 8000)     |
                         +---------+---------+
                                   |
                    +--------------+--------------+
                    |              |               |
             +------v------+ +----v-----+ +------v-------+
             | Supabase DB | | DL Layer | | PDF Processor |
             | (PostgreSQL)| | (PyTorch,| | (PyMuPDF)     |
             +-------------+ | sklearn) | +--------------+
                              +----------+
                                   |
                     +-------------+-------------+
                     |             |              |
               HuggingFace   HuggingFace    HuggingFace
               (KalashT)    (Devil1710)   (AnkushRaheja)
```

The frontend communicates with the backend through a REST API. On upload, the PDF is parsed into raw text and stored in Supabase. On analysis, the text flows through the DL pipeline and results are persisted back to the database.

---

## Analysis Pipeline

When a user uploads a contract and triggers analysis, the following pipeline executes sequentially:

```
PDF Upload
    |
    v
[1] Text Extraction (PyMuPDF)
    |   Extracts raw text and page count from the uploaded PDF.
    v
[2] Clause Segmentation
    |   Splits the raw text into individual legal clauses.
    |   Strategy (in priority order):
    |     a. Numbered sections  -- regex: "1.", "Section 2", "Article 3"
    |     b. Legal keywords     -- "WHEREAS", "Indemnification", "Termination", etc.
    |     c. Sentence grouping  -- fallback: groups sentences into 50-150 word blocks
    |   Clauses outside 10-300 words are filtered out.
    v
[3] Unfair Clause Detection (per clause)
    |   Model:  KalashT/unfair-clause-classifier (BERT)
    |   Input:  clause text (max 128 tokens)
    |   Output: { is_unfair: bool, confidence: float, explanation: str }
    |   Labels: fair (0), unfair (1)
    v
[4] Named Entity Recognition (per clause)
    |   Model:  Devil1710/Legal-Document-Analyzer-NER (Legal-BERT)
    |   Input:  clause text (max 512 tokens)
    |   Output: [{ text, label, confidence }]
    |   Labels: PARTY, DATE, AMOUNT, TERM, JURISDICTION, etc.
    |   Process:
    |     - Tokenize with BERT tokenizer
    |     - Run inference (CPU, no gradients)
    |     - Merge subword tokens back to whole words
    |     - Convert IOB2 tags (B-PARTY, I-PARTY, O) into entity spans
    v
[5] Clause Classification (per clause)
    |   Model:  AnkushRaheja/Legal-Document-Analyzer (Legal-BERT on LEDGAR)
    |   Input:  clause text (max 512 tokens)
    |   Output: (clause_type: str, confidence: float)
    |   Fallback: sklearn LinearSVC + TF-IDF vectorizer if BERT is unavailable
    v
[6] Risk Scoring (per clause)
    |   Model:  sklearn Ridge regressor + TF-IDF vectorizer
    |   Source: AnkushRaheja/Legal-Document-Analyzer (sklearn-models/)
    |   Input:  clause text -> TF-IDF vector -> dense array
    |   Output: risk_score (0.0 - 100.0)
    |   Levels: LOW (0-39), MEDIUM (40-69), HIGH (70-100)
    v
[7] Aggregation
    |   - Per-clause results are assembled into ClauseDetail objects
    |   - Overall risk = mean of all clause risk scores
    |   - Missing clause detection checks for absent standard clauses
    v
[8] Persist and Respond
        - Results saved to AnalysisResult table (Supabase)
        - JSON response returned to frontend
```

### Risk Score Calculation

The risk score is computed in two stages:

1. **Per-clause risk**: Each clause is vectorized using a pre-trained TF-IDF vectorizer, converted to a dense NumPy array, and passed through a Ridge regression model. The raw prediction is clipped to the 0-100 range.

2. **Overall document risk**: The arithmetic mean of all per-clause risk scores, rounded to two decimal places.

Risk levels are derived from thresholds:

| Score Range | Level  |
|-------------|--------|
| 70 -- 100   | HIGH   |
| 40 -- 69    | MEDIUM |
| 0 -- 39     | LOW    |

### NER Extraction Flow

```
Clause Text
    |
    v
BERT Tokenizer (max 512 tokens)
    |
    v
Legal-BERT Token Classification
    |   Produces logits for each token across all entity labels
    v
Softmax -> argmax per token
    |   Yields predicted IOB2 tag + confidence per token
    v
Subword Merging
    |   Discards [CLS], [SEP], [PAD] special tokens
    |   Discards ## subword continuations (keeps first subword's label)
    v
IOB2 to Entity Spans
    |   B-PARTY starts a new entity
    |   I-PARTY continues the current entity
    |   O tag closes any open entity
    v
Entity List: [{ text: "Apple Inc", label: "PARTY", confidence: 0.97 }, ...]
```

### Unfair Clause Detection Flow

```
Clause Text
    |
    v
BERT Tokenizer (max 128 tokens, padded)
    |
    v
KalashT/unfair-clause-classifier (BERT Sequence Classification)
    |   2-class output: [fair, unfair]
    v
Softmax -> argmax
    |
    v
{ is_unfair: true/false, confidence: 0.92, explanation: "BERT: 'unfair' (92.0%)" }
```

---

## DL Models

| Model | Type | Source | Task |
|-------|------|--------|------|
| `KalashT/unfair-clause-classifier` | BERT (Sequence Classification) | HuggingFace | Binary unfair clause detection |
| `Devil1710/Legal-Document-Analyzer-NER` | Legal-BERT (Token Classification) | HuggingFace | Named Entity Recognition (PARTY, DATE, AMOUNT, etc.) |
| `AnkushRaheja/Legal-Document-Analyzer` | Legal-BERT (Sequence Classification) | HuggingFace | Clause type classification (100+ LEDGAR categories) |
| `risk_scorer_baseline.pkl` | Ridge Regression | AnkushRaheja (sklearn-models/) | Risk score prediction (0-100) |
| `risk_vectorizer.pkl` | TF-IDF Vectorizer | AnkushRaheja (sklearn-models/) | Text vectorization for risk scorer |
| `clause_classifier_baseline.pkl` | LinearSVC | AnkushRaheja (sklearn-models/) | Fallback clause classifier |
| `tfidf_vectorizer.pkl` | TF-IDF Vectorizer | AnkushRaheja (sklearn-models/) | Text vectorization for clause classifier |

All models are downloaded automatically from HuggingFace Hub on first startup and cached locally.

---

## API Reference

Base URL: `http://localhost:8000/api/v1`

### Health Check

```
GET /health
```

Returns server status and version.

### Upload Contract

```
POST /contracts/upload
Content-Type: multipart/form-data

Body: file (PDF)
```

**Response:**

```json
{
  "contract_id": "uuid",
  "filename": "contract.pdf",
  "page_count": 14,
  "clause_count": 18,
  "uploaded_at": "2026-03-10T12:00:00Z"
}
```

### Analyze Contract

```
GET /contracts/{contract_id}/analyze
```

Runs the full ML pipeline on a previously uploaded contract.

**Response:**

```json
{
  "contract_id": "uuid",
  "filename": "contract.pdf",
  "clauses": [
    {
      "index": 0,
      "text": "The Licensor grants...",
      "clause_type": "License Grant",
      "risk_score": 35.2,
      "risk_level": "LOW",
      "is_unfair": false,
      "unfair_confidence": 0.91,
      "similarity_score": null,
      "matched_template": null,
      "entities": [
        { "text": "Licensor", "label": "PARTY", "confidence": 0.96 }
      ]
    }
  ],
  "missing_clauses": ["Arbitration", "Force Majeure"],
  "overall_risk_score": 42.5,
  "analyzed_at": "2026-03-10T12:01:00Z"
}
```

### Get Analysis Result

```
GET /contracts/{contract_id}
```

Retrieves the most recent analysis result for a contract.

### Additional Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/unfair-clauses/detect` | POST | Standalone unfair clause detection |
| `/similarity/compare` | POST | Template similarity comparison |
| `/missing-clauses/detect` | POST | Missing clause detection |

---

## Tech Stack

### Backend

- **Framework**: FastAPI 0.115
- **Language**: Python 3.13
- **Database**: Supabase (PostgreSQL) via SQLAlchemy 2.0
- **PDF Parsing**: PyMuPDF 1.24
- **Deep Learning**: PyTorch 2.1+, HuggingFace Transformers 4.36+
- **ML**: scikit-learn 1.3+, NumPy
- **Model Hub**: HuggingFace Hub (automatic model download and caching)
- **Testing**: pytest, httpx

### Frontend

- **Framework**: Next.js 16.1 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React

---

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 18+
- PostgreSQL database (or Supabase account)

### Backend Setup

```bash
cd Contract-Analyzer/backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate      # Linux/macOS
.venv\Scripts\Activate.ps1     # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and other settings

# Run the server
uvicorn main:app --reload --port 8000
```

On first startup, all ML models are downloaded from HuggingFace Hub. This may take several minutes depending on network speed.

### Frontend Setup

```bash
cd Contract-Analyzer/frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies API requests to the backend at `http://localhost:8000`.

### Docker (Backend)

```bash
cd Contract-Analyzer/backend
docker build -t contract-analyzer-backend .
docker run -p 8000:8000 --env-file .env contract-analyzer-backend
```

---

## Project Structure

```
Contract-Analyzer/
├── backend/
│   ├── main.py                          # FastAPI app entry point, lifespan, CORS
│   ├── requirements.txt                 # Python dependencies
│   ├── Dockerfile                       # Container configuration
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── router.py               # Route registration
│   │   │   └── endpoints/
│   │   │       ├── contracts.py         # Upload, analyze, get endpoints
│   │   │       ├── health.py            # Health check
│   │   │       ├── unfair_clauses.py    # Standalone unfair detection
│   │   │       ├── similarity.py        # Template comparison
│   │   │       └── missing_clauses.py   # Missing clause detection
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic settings (env-based)
│   │   │   ├── exceptions.py           # Custom exception classes
│   │   │   ├── logging.py              # Logging configuration
│   │   │   └── middleware.py            # Request logging middleware
│   │   ├── db/
│   │   │   ├── session.py              # SQLAlchemy engine and session
│   │   │   └── models/
│   │   │       ├── contract.py          # Contract ORM model
│   │   │       └── analysis_result.py   # AnalysisResult ORM model
│   │   ├── ml/
│   │   │   ├── unfair_detector.py       # BERT unfair clause classifier (KalashT)
│   │   │   ├── ner_extractor.py         # Legal-BERT NER (Devil1710)
│   │   │   ├── clause_classifier.py     # BERT clause classifier (AnkushRaheja)
│   │   │   ├── risk_scorer.py           # Ridge regression risk scorer
│   │   │   ├── clause_segmenter.py      # Regex-based clause segmentation
│   │   │   ├── model_loader.py          # HuggingFace Hub pkl loader
│   │   │   ├── similarity_matcher.py    # Template similarity (WIP)
│   │   │   └── missing_clause_detector.py # Missing clause detection (WIP)
│   │   ├── schemas/                     # Pydantic request/response schemas
│   │   ├── services/                    # Business logic layer
│   │   └── utils/                       # Text utilities
│   └── tests/                           # pytest test suite
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx                 # Home page (upload + features)
        │   └── analysis/page.tsx        # Analysis dashboard
        ├── components/
        │   ├── FileUpload.tsx           # PDF upload component
        │   ├── ClauseList.tsx           # Clause cards with filtering
        │   ├── ClauseCard.tsx           # Individual clause display
        │   ├── RiskGauge.tsx            # Risk score visualization
        │   ├── EntityPanel.tsx          # Entity display panel
        │   ├── ExplanationPanel.tsx     # AI explanation sidebar
        │   ├── DocumentSummary.tsx      # Document metadata summary
        │   └── Navbar.tsx               # Navigation bar
        ├── context/
        │   └── AnalysisContext.tsx       # Global analysis state
        ├── services/
        │   ├── api.ts                   # Backend API client
        │   ├── transforms.ts            # Response transformations
        │   └── mockData.ts              # Mock data for development
        └── types/
            └── index.ts                 # TypeScript interfaces
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) | Required |
| `HF_REPO_ID` | HuggingFace repo for Jayesh's models | `AnkushRaheja/Legal-Document-Analyzer` |
| `HF_SUBFOLDER` | Subfolder for sklearn pickle files | `sklearn-models` |
| `NER_MODEL` | HuggingFace repo for NER model | `Devil1710/Legal-Document-Analyzer-NER` |
| `MAX_UPLOAD_SIZE_MB` | Maximum PDF upload size | `20` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `["http://localhost:3000"]` |
| `LOG_LEVEL` | Logging level | `INFO` |

---

## License

This project was developed as part of the Deep Learning Lab coursework under Prof. Vikas R. Gupta. For academic use only.
