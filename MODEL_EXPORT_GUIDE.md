# Model Export Guide for Backend Integration

**Project:** Contract Analyzer | **Backend:** Kalash | **Date:** March 2026

---

## How to Save Your Trained Models (in Colab)

**Do NOT use `pickle` or `.pkl` files** — they're insecure and break across versions.

Use the standard HuggingFace save format:

```python
# For ALL transformer-based models (BERT, Legal-BERT, RoBERTa):
model.save_pretrained("your_model_folder")
tokenizer.save_pretrained("your_model_folder")

# For Sentence-BERT specifically:
model.save("your_model_folder")
```

---

## What Each Person Should Save

| Person | Model | Folder Name | Save Command |
|--------|-------|-------------|-------------|
| **Jayesh** | Clause Classifier (Legal-BERT/RoBERTa) | `classifier/` | `model.save_pretrained("classifier")` + `tokenizer.save_pretrained("classifier")` |
| **Jayesh** | Risk Scorer (BERT + Dense) | `risk_scorer/` | `model.save_pretrained("risk_scorer")` + `tokenizer.save_pretrained("risk_scorer")` |
| **Gaurav** | NER Model (BERT-NER) | `ner/` | `model.save_pretrained("ner")` + `tokenizer.save_pretrained("ner")` |
| **Gaurav** | Clause Segmenter (if SpaCy) | `segmenter/` | `nlp.to_disk("segmenter")` |

> Kalash's models (unfair_detector, similarity, missing_clause) — handled separately.

---

## What the Saved Folder Should Contain

```
your_model_folder/
├── config.json              ← model architecture config
├── model.safetensors        ← weights (or pytorch_model.bin)
├── tokenizer.json           ← tokenizer config
├── tokenizer_config.json
├── special_tokens_map.json
└── vocab.txt                ← (if BERT-based)
```

If using SpaCy: the folder will have `meta.json`, `config.cfg`, etc. — that's fine.

---

## How to Send It

1. **Zip the entire model folder** (not individual files)
   ```python
   !zip -r classifier.zip classifier/
   ```
2. **Download from Colab** or upload to Google Drive and share the link
3. It will be placed in:
   ```
   backend/models/<folder_name>/
   ```

---

## Checklist Before Sending

- [ ] Model saved with `save_pretrained()` (NOT `torch.save()` or `pickle.dump()`)
- [ ] Tokenizer saved alongside the model
- [ ] Folder zipped as `<model_name>.zip`
- [ ] Quick test in Colab that it loads back:
  ```python
  # Verify it works before sending
  from transformers import AutoModelForSequenceClassification, AutoTokenizer
  model = AutoModelForSequenceClassification.from_pretrained("your_model_folder")
  tokenizer = AutoTokenizer.from_pretrained("your_model_folder")
  print("Loads OK!")
  ```
- [ ] Share the **label mapping** (e.g., `{0: "liability", 1: "termination", ...}`)
- [ ] Share **expected input format** (max token length, any preprocessing done)

---

## What NOT to Do

| Don't | Why |
|-------|-----|
| `pickle.dump(model, f)` | Security risk, breaks across versions |
| `torch.save(model, "model.pt")` | Saves only weights, no config/tokenizer |
| Send just a `.bin` file | Missing config — can't reconstruct the model |
| Train on GPU and not test on CPU | Backend runs on CPU by default |

---

**Questions? Message Kalash.**
