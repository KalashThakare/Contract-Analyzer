# Contract Analyzer

An AI-powered legal contract analysis system that classifies clauses, detects unfair terms, extracts named entities, identifies missing clauses, and assesses contract risk — built with Legal-BERT, FastAPI, and Next.js.

![Aethel-AI](https://github.com/KalashThakare/Contract-Analyzer/blob/main/screenshots/1.png)

---

## Project Guide

**Prof. Vikas R Gupta**

---

## Team Members

| Name | Roll No. | Contribution |
|------|----------|--------------|
| Kalash Thakare | 35 | Unfair Clause Detection |
| Jayesh Rajbhar | 34 | Clause Classification (Legal-BERT on LEDGAR) |
| Gaurav Dongre | 28 | Named Entity Recognition (Legal-BERT NER) |

---

## Model Links (Hugging Face)

- **Kalash Thakare — Unfair Clause Detection**  
  https://huggingface.co/KalashT/unfair-clause-classifier  

- **Jayesh Rajbhar — Clause Classification / Risk Scoring**  
  https://huggingface.co/AnkushRaheja/Cls_Class_Risk_Scr  

- **Gaurav Dongre — Named Entity Recognition (NER)**  
  https://huggingface.co/Devil1710/Legal-NER-v2  

---

## Screenshots

### Dashboard Overview

![Dashboard](https://github.com/KalashThakare/Contract-Analyzer/blob/main/screenshots/2.png)

### Graph visualisation

![Clause Classification](https://github.com/KalashThakare/Contract-Analyzer/blob/main/screenshots/3.png)

### Detailed Analysis

![NER Panel](https://github.com/KalashThakare/Contract-Analyzer/blob/main/screenshots/4.png)

---

## Model Performance

### Jayesh Rajbhar — Clause Classification

- **Model:** `nlpaueb/legal-bert-base-uncased`
- **Dataset:** LEDGAR (60k train / 10k val / 10k test)
- **Epochs:** 3
- **Val Accuracy:** 86.12% | **Val F1 (weighted):** 0.8525
- **Test Accuracy:** 86.47% | **Test F1 (weighted):** 0.8558
- **Baseline Accuracy:** 84.00% — Improvement: +2.47%

---

### Kalash Thakare — Unfair Clause Detection

- **Model:** `bert-base-uncased` (fine-tuned with Focal Loss + class balancing)
- **Dataset:** LEXGLUE Unfair ToS (4.4k train / 1.1k val)
- **Epochs:** 6
- **Val Accuracy:** 89% | **Val F1 (weighted):** 0.81
- **Baseline Accuracy:** 85% — Improvement: ~+4%

---

### Gaurav Dongre — Named Entity Recognition

- **Model:** Legal-BERT (fine-tuned)
- **Dataset:** Contract NER Dataset (~60k samples)
- **Training:** 8 epochs, AdamW optimizer, Linear warmup + decay, fp16, 2x Tesla T4 on Kaggle
- **Test F1:** 0.744 | **Precision:** 0.653 | **Recall:** 0.864
- **Baseline F1:** 0.634 — Improvement: +0.110

---

## Project Structure

```
Contract-Analyzer/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── contracts.py
│   │   │       │   ├── health.py
│   │   │       │   ├── missing_clauses.py
│   │   │       │   ├── similarity.py
│   │   │       │   └── unfair_clauses.py
│   │   │       └── router.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── exceptions.py
│   │   │   ├── logging.py
│   │   │   └── middleware.py
│   │   ├── db/
│   │   │   ├── models/
│   │   │   └── base_class.py
│   │   ├── ml/
│   │   │   ├── clause_classifier.py
│   │   │   ├── missing_clause_detector.py
│   │   │   ├── model_loader.py
│   │   │   ├── multitask_predictor.py
│   │   │   ├── ner_extractor.py
│   │   │   ├── risk_scorer.py
│   │   │   ├── similarity_matcher.py
│   │   │   └── unfair_detector.py
│   │   ├── schemas/
│   │   │   ├── contract.py
│   │   │   ├── health.py
│   │   │   ├── missing_clause.py
│   │   │   └── similarity.py
│   │   ├── services/
│   │   │   ├── contract_service.py
│   │   │   ├── llm_analysis_service.py
│   │   │   ├── missing_clause_service.py
│   │   │   ├── pdf_processor.py
│   │   │   ├── similarity_service.py
│   │   │   └── unfair_clause_service.py
│   │   └── utils/
│   │       └── text.py
│   ├── models/          # Trained model weights (not committed)
│   ├── uploads/
│   ├── .env
│   ├── .env.example
│   ├── main.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── analysis/
    │   │   ├── dashboard/
    │   │   │   ├── clauses/
    │   │   │   ├── entities/
    │   │   │   ├── missing-clauses/
    │   │   │   ├── models/
    │   │   │   ├── reports/
    │   │   │   ├── risk/
    │   │   │   ├── settings/
    │   │   │   └── similarity/
    │   │   └── upload/
    │   ├── components/
    │   │   ├── layout/
    │   │   └── ui/
    │   │       ├── ClauseCard.tsx
    │   │       ├── DocumentSummary.tsx
    │   │       ├── EntityPanel.tsx
    │   │       ├── FileUpload.tsx
    │   │       ├── RiskGauge.tsx
    │   │       └── ...
    │   ├── context/
    │   ├── services/
    │   │   ├── api.ts
    │   │   └── transforms.ts
    │   └── types/
    ├── .env.local
    └── package.json
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11+ |
| ML Models | HuggingFace Transformers, PyTorch |
| PDF Processing | PyMuPDF / pdfplumber |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/Contract-Analyzer.git
cd Contract-Analyzer
```

---

### 2. Backend Setup

```bash
cd backend
```

Create and activate a virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

```env
DATABASE_URL=sqlite:///./contract_analyzer.db
MODEL_DIR=./models
UPLOAD_DIR=./uploads
SECRET_KEY=your-secret-key-here
```

Place trained model weights in the `models/` directory. The expected structure is:

```
backend/models/
├── clause_classifier/
├── unfair_detector/
└── ner_extractor/
```

Run the backend server:

```bash
python -m main
```

The API will be available at `http://localhost:8000`  
Swagger docs at `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## Features

- **Clause Classification** — Automatically categorizes contract clauses using Legal-BERT trained on LEDGAR
- **Unfair Clause Detection** — Identifies potentially unfair terms using BERT with Focal Loss
- **Named Entity Recognition** — Extracts parties, dates, amounts, jurisdictions, and terms
- **Missing Clause Detection** — Flags standard clauses that are absent from the contract
- **Risk Scoring** — Generates an overall risk score with per-clause breakdown
- **Contract Similarity** — Compares contracts for similarity analysis
- **PDF Upload** — Supports direct PDF contract upload and processing

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/contracts/analyze` | Full contract analysis |
| POST | `/api/v1/contracts/upload` | Upload a contract PDF |
| GET | `/api/v1/missing-clauses` | Get missing clause report |
| POST | `/api/v1/similarity` | Compare two contracts |
| GET | `/api/v1/unfair-clauses` | List detected unfair clauses |

Full interactive API documentation is available at `/docs` when the backend is running.

---

## Key Dependencies

**Backend**
```
fastapi
uvicorn
transformers
torch
sqlalchemy
pydantic
python-multipart
pdfplumber
```

**Frontend**
```
next
react
typescript
tailwindcss
axios
```

---

## License

This project was developed as an academic project. All rights reserved by the respective authors.

---

## Acknowledgements

- [HuggingFace Transformers](https://huggingface.co/transformers/)
- [nlpaueb/legal-bert-base-uncased](https://huggingface.co/nlpaueb/legal-bert-base-uncased)
- [LEDGAR Dataset](https://huggingface.co/datasets/coastalcph/lex_glue)
- [LEXGLUE Benchmark](https://huggingface.co/datasets/coastalcph/lex_glue)
- [seqeval](https://github.com/chakki-works/seqeval) for NER evaluation
