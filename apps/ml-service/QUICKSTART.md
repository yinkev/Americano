# Quick Start Guide - Struggle Prediction Model Training

**5-Minute Guide to Train Your First Model**

---

## Prerequisites

```bash
# 1. Ensure you're in the ML service directory
cd apps/ml-service

# 2. Python 3.13+ installed
python --version  # Should be 3.13.x

# 3. Database populated with labeled struggle predictions
# Need at least 100 samples with actualOutcome recorded
```

---

## Setup (One-Time)

```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate  # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. (Deprecated) Prisma client
Prisma Python is deprecated. No client generation is required. Runtime uses SQLAlchemy.

# 5. Verify database connection
# Check .env file has DATABASE_URL configured
cat .env | grep DATABASE_URL
```

---

## Training Commands

### Option 1: Quick Training (2 minutes)

**Use when:** Testing, rapid iteration, or limited data
**Hyperparameters:** Default sensible values
**Training time:** 1-2 minutes

```bash
python scripts/train_model.py
```

### Option 2: Full Training (15 minutes) ⭐ RECOMMENDED

**Use when:** Production deployment
**Hyperparameters:** GridSearchCV optimization (243 configs)
**Training time:** 10-30 minutes (depending on data size)

```bash
python scripts/train_model.py --tune --cv-folds 5
```

### Option 3: Custom Training

```bash
python scripts/train_model.py \
    --tune \
    --cv-folds 10 \
    --model-name "production_v1_oct17"
```

---

## Output Files

After training, find these files in `models/`:

```
models/
├── struggle_model_v1.0.0_20251017_143000.joblib         # Trained model
├── struggle_model_v1.0.0_20251017_143000_metadata.json  # Metadata
└── struggle_model_v1.0.0_training_report.md             # Evaluation report
```

### What to Check

**1. Training Report (Markdown)**
```bash
# Open the training report
cat models/*_training_report.md | grep "Test Accuracy"
# Should show: Test Accuracy: 0.XXX
```

**2. Key Metrics**
- ✅ Test Accuracy ≥ 0.60 (60%) → MVP ready
- ✅ Test Accuracy ≥ 0.75 (75%) → Research-grade
- ✅ Train-Test gap < 0.05 → Good generalization

**3. Model Files**
```bash
# Verify files exist
ls -lh models/*.joblib
ls -lh models/*.json
ls -lh models/*.md
```

---

## Troubleshooting

### Error: "Insufficient training data"

**Problem:** < 100 labeled samples in database

**Solutions:**
1. Wait for more data collection (users completing predictions)
2. Check database query:
   ```sql
   SELECT COUNT(*) FROM struggle_predictions
   WHERE actual_outcome IS NOT NULL;
   ```

### Error: "Database connection failed"

**Problem:** Prisma can't connect to PostgreSQL

**Solutions:**
1. Check `.env` file exists: `cat .env`
2. Verify DATABASE_URL format:
   ```
   DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
   ```
3. Test connection: `prisma db pull`

### Error: "Module not found: xgboost"

**Problem:** Dependencies not installed

**Solution:**
```bash
pip install -r requirements.txt
```

### Low Accuracy (<60%)

**Problem:** Model not learning well

**Solutions:**
1. **More data:** Train with 500+ samples
2. **Tune hyperparameters:**
   ```bash
   python scripts/train_model.py --tune --cv-folds 10
   ```
3. **Check feature quality:** Review `featureVector` in database
4. **Review labels:** Ensure `actualOutcome` is accurate

---

## Next Steps

After successful training:

1. **Review Training Report**
   ```bash
   cat models/*_training_report.md | less
   ```

2. **Check Feature Importance**
   - See which features matter most
   - Validate against domain knowledge

3. **Deploy to API**
   - Implement `/ml/predict` endpoint (see MODEL_TRAINING_GUIDE.md)
   - Load model at FastAPI startup

4. **Monitor Performance**
   - Track prediction accuracy in production
   - Set up weekly retraining

---

## Example Output

```
================================================
STRUGGLE PREDICTION MODEL TRAINING PIPELINE
================================================
Hyperparameter tuning: True
Cross-validation folds: 5
Model name: struggle_model_v1.0.0
================================================

[Step 1/4] Extracting training data from database...
Found 523 labeled predictions
Extracted 523 samples
Feature matrix shape: (523, 15)

[Step 2/4] Preparing training data...
Final training dataset: X shape=(523, 15), y shape=(523,)
Class distribution: [298 225]

[Step 3/4] Training model...
Data splits - Train: 366, Val: 78, Test: 79
Starting hyperparameter tuning with GridSearchCV...
Best parameters: {'max_depth': 5, 'learning_rate': 0.05, ...}
Best CV F1 score: 0.712

Model Performance:
  Test Accuracy:  0.722
  Test Precision: 0.680
  Test Recall:    0.756
  Test F1 Score:  0.716
  Test ROC-AUC:   0.791

[Step 4/4] Saving model and generating report...
Model saved to: models/struggle_model_v1.0.0_20251017_143000.joblib
Metadata saved to: models/struggle_model_v1.0.0_20251017_143000_metadata.json
Training report saved to: models/struggle_model_v1.0.0_training_report.md

================================================
TRAINING COMPLETE!
================================================
✅ Model meets 60%+ accuracy target for MVP deployment
⚠️  Continue improving for 75%+ research-grade quality

Key Metrics:
  Test Accuracy:  0.722
  Test Precision: 0.680
  Test Recall:    0.756
  Test F1 Score:  0.716
  Test ROC-AUC:   0.791
================================================
```

---

## Quick Reference

| Command | Use Case | Time |
|---------|----------|------|
| `python scripts/train_model.py` | Testing, MVP | 1-2 min |
| `python scripts/train_model.py --tune` | Production | 10-30 min |
| `python scripts/train_model.py --help` | See all options | 1 sec |

| File | Purpose |
|------|---------|
| `*.joblib` | Trained model (load for inference) |
| `*_metadata.json` | Model config and metrics |
| `*_training_report.md` | Comprehensive evaluation |

---

**Need more details?** See `MODEL_TRAINING_GUIDE.md` (500+ lines)

**Ready to train?** Run:
```bash
python scripts/train_model.py --tune
```

**Questions?** Check `ML_MODEL_TRAINING_REPORT.md`
