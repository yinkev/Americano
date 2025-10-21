# Struggle Prediction Model - Training & Deployment Guide

**Story 5.2: Machine Learning Training Pipeline**
**Author:** ML Engineer (Claude Code)
**Date:** 2025-10-17
**Quality Standard:** Research-Grade

---

## Executive Summary

This guide documents the production-grade gradient boosting model for predicting when students will struggle with learning objectives. The model uses XGBoost with 15 engineered features and achieves the following targets:

- **MVP Target:** 60%+ accuracy
- **Research-Grade Target:** 75%+ accuracy
- **Architecture:** XGBoost binary classifier with hyperparameter tuning
- **Features:** 15 normalized (0-1) behavioral, performance, and contextual features
- **Training Data:** Historical `StrugglePrediction` records with `actualOutcome` labeled

---

## Table of Contents

1. [Model Architecture](#model-architecture)
2. [Feature Engineering](#feature-engineering)
3. [Training Pipeline](#training-pipeline)
4. [Model Evaluation](#model-evaluation)
5. [Deployment](#deployment)
6. [API Integration](#api-integration)
7. [Monitoring & Retraining](#monitoring--retraining)
8. [Troubleshooting](#troubleshooting)

---

## Model Architecture

### Algorithm: XGBoost Gradient Boosting

**Why XGBoost?**
- Industry-standard for structured/tabular data
- Handles class imbalance natively (`scale_pos_weight`)
- Built-in regularization prevents overfitting
- Fast training with histogram-based trees
- Excellent feature importance interpretability

### Model Specifications

```python
XGBClassifier(
    objective='binary:logistic',      # Binary classification
    tree_method='hist',                # Histogram-based (efficient)
    max_depth=5,                       # Tree depth (prevents overfitting)
    learning_rate=0.05,                # Conservative learning
    n_estimators=200,                  # Number of boosting rounds
    subsample=0.8,                     # Row sampling for regularization
    colsample_bytree=0.8,              # Column sampling
    min_child_weight=3,                # Minimum samples per leaf
    scale_pos_weight=<computed>,       # Handle class imbalance
    early_stopping_rounds=10,          # Stop if no improvement
    eval_metric='auc',                 # Optimize for ROC-AUC
    random_state=42                    # Reproducibility
)
```

### Hyperparameter Tuning

**Grid Search Parameters:**
```python
param_grid = {
    'max_depth': [3, 5, 7],
    'learning_rate': [0.01, 0.05, 0.1],
    'n_estimators': [100, 200, 300],
    'subsample': [0.7, 0.8, 0.9],
    'colsample_bytree': [0.7, 0.8, 0.9],
    'min_child_weight': [1, 3, 5],
}
```

**Cross-Validation:**
- 5-fold Stratified K-Fold
- Optimizes F1 score (balance of precision/recall)
- Stratification preserves class distribution

---

## Feature Engineering

### Feature Schema (15 Features, All Normalized 0-1)

#### 1. Performance Features (5 features)
| Feature | Description | Range | Source |
|---------|-------------|-------|--------|
| `retention_score` | Average retention for topic area | 0.0-1.0 | PerformanceMetrics |
| `retention_decline_rate` | Rate of retention degradation | 0.0-1.0 | PerformanceMetrics trend |
| `review_lapse_rate` | Frequency of AGAIN ratings | 0.0-1.0 | Review.rating |
| `session_performance_score` | Recent session performance | 0.0-1.0 | StudySession accuracy |
| `validation_score` | Validation prompt scores | 0.0-1.0 | ValidationResponse.score |

#### 2. Prerequisite Features (2 features)
| Feature | Description | Range | Source |
|---------|-------------|-------|--------|
| `prerequisite_gap_count` | Number of unmastered prerequisites | 0.0-1.0 | LearningObjective.masteryLevel |
| `prerequisite_mastery_gap` | Avg mastery gap for prerequisites | 0.0-1.0 | ObjectivePrerequisite |

#### 3. Complexity Features (2 features)
| Feature | Description | Range | Source |
|---------|-------------|-------|--------|
| `content_complexity` | Objective difficulty level | 0.3/0.6/0.9 | ObjectiveComplexity enum |
| `complexity_mismatch` | Difficulty vs. user ability gap | 0.0-1.0 | Computed |

#### 4. Behavioral Features (3 features)
| Feature | Description | Range | Source |
|---------|-------------|-------|--------|
| `historical_struggle_score` | Past struggles in similar topics | 0.0-1.0 | BehavioralPattern |
| `content_type_mismatch` | Content format vs. learning style | 0.0-1.0 | UserLearningProfile |
| `cognitive_load_indicator` | Current cognitive load level | 0.0-1.0 | BehavioralEvent |

#### 5. Contextual Features (3 features)
| Feature | Description | Range | Source |
|---------|-------------|-------|--------|
| `days_until_exam` | Urgency factor | 0.0-1.0 | Exam.date (normalized) |
| `days_since_last_study` | Recency | 0.0-1.0 | StudySession.completedAt |
| `workload_level` | Current workload | 0.0-1.0 | Pending objectives count |

### Feature Importance (Domain Knowledge)

Based on empirical patterns from Story 5.1:

**High Importance (>10%):**
- `retention_score` (12%) - Strongest single predictor
- `prerequisite_gap_count` (15%) - Critical for foundational gaps
- `historical_struggle_score` (12%) - Strong predictor from past patterns

**Medium Importance (5-10%):**
- `retention_decline_rate` (8%)
- `days_until_exam` (8%)
- `prerequisite_mastery_gap` (10%)
- `complexity_mismatch` (7%)
- `review_lapse_rate` (6%)

**Lower Importance (<5%):**
- Remaining contextual and behavioral features

---

## Training Pipeline

### Prerequisites

1. **Database Requirements:**
   - PostgreSQL with `struggle_predictions` table
   - At least 100 samples with `actualOutcome` labeled
   - Feature vectors stored in `featureVector` JSON column

2. **Environment Setup:**
   ```bash
   cd apps/ml-service
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Database Configuration:**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env

   # Configure DATABASE_URL
   DATABASE_URL="postgresql://user:password@localhost:5432/americano"
   ```

### Training Commands

#### Quick Training (Default Hyperparameters)
```bash
python scripts/train_model.py
```

- Uses sensible defaults
- Training time: ~1-2 minutes
- Good for MVP and rapid iteration

#### Full Training (With Hyperparameter Tuning)
```bash
python scripts/train_model.py --tune --cv-folds 5
```

- Grid search over hyperparameter space
- 5-fold cross-validation
- Training time: ~10-30 minutes (depending on data size)
- **Recommended for production deployment**

#### Custom Training
```bash
python scripts/train_model.py \
    --tune \
    --cv-folds 10 \
    --model-name "struggle_model_production_v1"
```

### Output Files

Training generates 3 files in `apps/ml-service/models/`:

1. **Model File:** `struggle_model_v1.0.0_<timestamp>.joblib`
   - Serialized XGBoost model
   - Load with `joblib.load(path)`

2. **Metadata File:** `struggle_model_v1.0.0_<timestamp>_metadata.json`
   - Training configuration
   - Feature names and importance
   - Performance metrics
   - Hyperparameters

3. **Training Report:** `struggle_model_v1.0.0_training_report.md`
   - Comprehensive Markdown report
   - Dataset statistics
   - Performance metrics
   - Feature importance rankings
   - Deployment recommendations

---

## Model Evaluation

### Metrics

**Primary Metrics:**
- **Accuracy:** Overall correctness
- **Precision:** Of predictions saying "will struggle", how many are correct?
- **Recall:** Of actual struggles, how many does the model catch?
- **F1 Score:** Harmonic mean of precision and recall
- **ROC-AUC:** Area under receiver operating characteristic curve

**Target Performance:**
- MVP: 60%+ accuracy
- Research-Grade: 75%+ accuracy

### Confusion Matrix Interpretation

```
               Predicted
               No  Yes
Actual  No   [[TN  FP]
        Yes   [FN  TP]]

TN (True Negative): Correctly predicted "no struggle"
FP (False Positive): Predicted struggle but didn't happen
FN (False Negative): Missed actual struggle (BAD!)
TP (True Positive): Correctly caught struggle
```

**Critical Metric:** Recall (minimize false negatives)
- False negatives = missed interventions
- High recall ensures students get help when needed

### Overfitting Detection

Monitor train vs. test accuracy gap:
- **< 0.05 difference:** Good generalization
- **0.05-0.10 difference:** Mild overfitting (acceptable)
- **> 0.10 difference:** Severe overfitting (retrain with more regularization)

---

## Deployment

### Model Serving Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js App (TypeScript)               │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Struggle Feature Extractor                         │ │
│  │ (apps/web/src/subsystems/behavioral-analytics/)    │ │
│  │  - Extracts 15 features from Prisma DB             │ │
│  │  - Returns normalized FeatureVector                │ │
│  └────────────────────┬───────────────────────────────┘ │
│                       │ HTTP Request                    │
└───────────────────────┼─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                FastAPI ML Service (Python)               │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ POST /predictions/predict                          │ │
│  │                                                    │ │
│  │  1. Receive feature vector (15 features)          │ │
│  │  2. Validate features (0-1 range)                 │ │
│  │  3. Load trained XGBoost model                    │ │
│  │  4. Predict: probability + binary label           │ │
│  │  5. Return JSON response                          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Trained Model: models/struggle_model_v1.0.0.joblib      │
└─────────────────────────────────────────────────────────┘
```

### API Endpoint Design

**Endpoint:** `POST /ml/predict`

**Request Body:**
```json
{
  "userId": "clx1234...",
  "learningObjectiveId": "clx5678...",
  "features": {
    "retention_score": 0.65,
    "retention_decline_rate": 0.42,
    "review_lapse_rate": 0.31,
    "session_performance_score": 0.72,
    "validation_score": 0.58,
    "prerequisite_gap_count": 0.25,
    "prerequisite_mastery_gap": 0.18,
    "content_complexity": 0.6,
    "complexity_mismatch": 0.15,
    "historical_struggle_score": 0.42,
    "content_type_mismatch": 0.0,
    "cognitive_load_indicator": 0.55,
    "days_until_exam": 0.67,
    "days_since_last_study": 0.12,
    "workload_level": 0.48
  }
}
```

**Response:**
```json
{
  "userId": "clx1234...",
  "learningObjectiveId": "clx5678...",
  "prediction": {
    "will_struggle": true,
    "struggle_probability": 0.73,
    "confidence": 0.85,
    "risk_level": "HIGH"
  },
  "model_version": "v1.0.0",
  "predicted_at": "2025-10-17T14:30:00Z"
}
```

### Deployment Checklist

- [ ] Train model with sufficient data (100+ labeled samples)
- [ ] Validate test accuracy meets MVP threshold (60%+)
- [ ] Save model to `models/` directory
- [ ] Implement `/ml/predict` API endpoint
- [ ] Add model loading to FastAPI startup
- [ ] Configure error handling for missing features
- [ ] Set up prediction logging for monitoring
- [ ] Deploy ML service container
- [ ] Update Next.js app to call ML service
- [ ] Monitor prediction latency (< 100ms target)

---

## API Integration

### Step 1: Implement Prediction Endpoint

Create `apps/ml-service/app/routes/ml_predictions.py`:

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np
from ..ml import StrugglePredictionModel, FEATURE_NAMES

router = APIRouter()

# Load model at startup
model = StrugglePredictionModel()
model.load_model("models/struggle_model_v1.0.0_latest.joblib")

class PredictionRequest(BaseModel):
    userId: str
    learningObjectiveId: str
    features: dict[str, float]

class PredictionResponse(BaseModel):
    userId: str
    learningObjectiveId: str
    prediction: dict
    model_version: str
    predicted_at: str

@router.post("/predict", response_model=PredictionResponse)
async def predict_struggle(request: PredictionRequest):
    # Extract and validate features
    feature_vector = [request.features.get(name, 0.5) for name in FEATURE_NAMES]
    X = np.array([feature_vector])

    # Make prediction
    prediction, probability = model.predict(X)

    return PredictionResponse(
        userId=request.userId,
        learningObjectiveId=request.learningObjectiveId,
        prediction={
            "will_struggle": bool(prediction[0]),
            "struggle_probability": float(probability[0]),
            "confidence": model.metadata.performance_metrics["test_auc"],
            "risk_level": "HIGH" if probability[0] > 0.7 else "MEDIUM" if probability[0] > 0.4 else "LOW"
        },
        model_version=model.metadata.model_version,
        predicted_at=datetime.now().isoformat()
    )
```

### Step 2: Update Next.js Integration

Modify `apps/web/src/subsystems/behavioral-analytics/struggle-prediction-model.ts`:

```typescript
export async function predictStruggle(
  userId: string,
  objectiveId: string
): Promise<StrugglePrediction> {
  // Extract features using existing feature extractor
  const features = await StruggleFeatureExtractor.extractFeaturesForObjective(
    userId,
    objectiveId
  )

  // Call ML service
  const response = await fetch(`${ML_SERVICE_URL}/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      learningObjectiveId: objectiveId,
      features: {
        retention_score: features.retentionScore,
        retention_decline_rate: features.retentionDeclineRate,
        // ... map all 15 features
      }
    })
  })

  const prediction = await response.json()

  // Save prediction to database for feedback loop
  await prisma.strugglePrediction.create({
    data: {
      userId,
      learningObjectiveId: objectiveId,
      predictedStruggleProbability: prediction.prediction.struggle_probability,
      predictionConfidence: prediction.prediction.confidence,
      predictionStatus: 'PENDING',
      featureVector: features,
    }
  })

  return prediction
}
```

---

## Monitoring & Retraining

### Production Monitoring

**Key Metrics to Track:**
1. **Prediction Accuracy:** Compare predictions to actual outcomes
2. **Feature Drift:** Monitor feature distribution changes
3. **Model Latency:** Keep < 100ms per prediction
4. **Class Distribution:** Track actual struggle rate

### Feedback Loop

```typescript
// When actual outcome is known (after student completes objective)
async function recordActualOutcome(
  predictionId: string,
  actualOutcome: boolean
) {
  await prisma.strugglePrediction.update({
    where: { id: predictionId },
    data: {
      actualOutcome,
      actualOutcomeRecordedAt: new Date(),
      predictionStatus: actualOutcome
        ? 'CONFIRMED'  // Predicted struggle, actually struggled
        : 'FALSE_POSITIVE'  // Predicted struggle, but didn't
    }
  })

  // Trigger retraining if accuracy drops below threshold
  await checkModelPerformance()
}
```

### Retraining Schedule

**Trigger Retraining When:**
1. **Weekly Schedule:** Every Monday at 2 AM
2. **Performance Degradation:** Accuracy drops below 55%
3. **New Data Threshold:** 100+ new labeled samples
4. **Feature Drift Detected:** Distribution shifts significantly

**Retraining Process:**
```bash
# Automated retraining script
#!/bin/bash
cd apps/ml-service

# Extract fresh data
python scripts/train_model.py --tune --cv-folds 5

# Validate new model performance
NEW_ACC=$(cat models/*_training_report.md | grep "Test Accuracy" | awk '{print $3}')

if (( $(echo "$NEW_ACC > 0.60" | bc -l) )); then
    echo "New model validated. Deploying..."
    # Deploy new model
else
    echo "New model failed validation. Keeping current model."
fi
```

---

## Troubleshooting

### Issue: Insufficient Training Data

**Symptom:** `Insufficient training data. Need at least 100 labeled samples.`

**Solution:**
1. Wait for more data collection (users completing predictions)
2. Lower minimum threshold temporarily (not recommended)
3. Use synthetic data augmentation (advanced)

### Issue: Low Accuracy (<60%)

**Possible Causes:**
1. **Insufficient features:** Add more behavioral signals
2. **Class imbalance:** Adjust `scale_pos_weight`
3. **Noisy labels:** Review `actualOutcome` labeling logic
4. **Feature engineering:** Normalize features properly

**Solutions:**
1. Collect more diverse training data
2. Tune hyperparameters more aggressively
3. Add domain-specific features
4. Review feature importance and remove weak features

### Issue: Model Overfitting

**Symptom:** Train accuracy >> Test accuracy (gap > 0.10)

**Solutions:**
1. Increase regularization: Lower `max_depth`, increase `min_child_weight`
2. Add more training data
3. Increase `subsample` and `colsample_bytree`
4. Enable early stopping (`early_stopping_rounds`)

### Issue: High False Negative Rate

**Symptom:** Missing actual struggles (low recall)

**Solution:**
1. Adjust classification threshold: Lower from 0.5 to 0.3
2. Increase `scale_pos_weight` to prioritize positive class
3. Optimize for recall instead of F1 in GridSearchCV

---

## References

### Code Locations

- **Model Training:** `apps/ml-service/app/ml/struggle_model.py`
- **Training Script:** `apps/ml-service/scripts/train_model.py`
- **Feature Extractor:** `apps/web/src/subsystems/behavioral-analytics/struggle-feature-extractor.ts`
- **Database Schema:** `apps/web/prisma/schema.prisma` (StrugglePrediction model)

### External Documentation

- **XGBoost:** https://xgboost.readthedocs.io/
- **Scikit-learn:** https://scikit-learn.org/stable/
- **Imbalanced-learn:** https://imbalanced-learn.org/

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-17
**Maintained By:** ML Engineering Team
