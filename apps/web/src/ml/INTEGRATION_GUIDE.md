# ML Package Integration Guide

## Overview

This guide explains how to integrate the Python ML package with the existing TypeScript codebase for Story 5.2 (Predictive Analytics for Learning Struggles).

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Next.js Application (TypeScript)         │
│                                                          │
│  ┌────────────────┐         ┌─────────────────┐        │
│  │  API Routes    │────────▶│  Python ML      │        │
│  │  /api/analytics│         │  Subprocess     │        │
│  └────────────────┘         └─────────────────┘        │
│         │                            │                  │
│         │                            ▼                  │
│         │                   ┌─────────────────┐        │
│         │                   │ ML Package      │        │
│         │                   │ - Feature Eng.  │        │
│         │                   │ - Prediction    │        │
│         │                   └─────────────────┘        │
│         ▼                                               │
│  ┌────────────────────────────────────────┐            │
│  │         Prisma Database                │            │
│  │  - StrugglePrediction                  │            │
│  │  - PerformanceMetric                   │            │
│  │  - BehavioralPattern                   │            │
│  └────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

## Integration Options

### Option 1: Python Subprocess (Recommended for MVP)

Call Python scripts from Next.js API routes using child_process.

**Pros:**
- Simple integration
- Leverages existing Python ML code
- Clear separation of concerns

**Cons:**
- Slower than in-process (process startup overhead)
- Requires Python runtime in production

**Implementation:**

```typescript
// apps/web/src/app/api/analytics/predictions/generate/route.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '@/lib/prisma';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  const { userId, objectiveId } = await request.json();

  try {
    // Call Python ML script
    const { stdout, stderr } = await execAsync(
      `python3 /path/to/predict.py ${userId} ${objectiveId}`,
      { timeout: 5000 }
    );

    if (stderr) {
      console.error('Python error:', stderr);
    }

    const prediction = JSON.parse(stdout);

    // Store in database
    const result = await prisma.strugglePrediction.create({
      data: {
        userId,
        learningObjectiveId: objectiveId,
        predictedStruggleProbability: prediction.probability,
        predictionConfidence: prediction.confidence,
        featureVector: prediction.features,
        predictionStatus: 'PENDING',
      }
    });

    return Response.json(result);

  } catch (error) {
    console.error('Prediction failed:', error);
    return Response.json({ error: 'Prediction failed' }, { status: 500 });
  }
}
```

**Python CLI Script (`predict.py`):**

```python
#!/usr/bin/env python3
import sys
import json
import asyncio
from ml import StruggleFeatureExtractor, StrugglePredictionModel
from db import get_prisma_client  # Custom Prisma Python client wrapper

async def main():
    user_id = sys.argv[1]
    objective_id = sys.argv[2]

    # Initialize
    db = await get_prisma_client()
    extractor = StruggleFeatureExtractor(db)
    model = StrugglePredictionModel.load("models/current.pkl")

    # Extract and predict
    features = await extractor.extract_features_for_objective(user_id, objective_id)
    prediction = model.predict(features)

    # Output JSON
    print(json.dumps({
        'probability': prediction.probability,
        'confidence': prediction.confidence,
        'risk_level': prediction.risk_level,
        'reasoning': prediction.reasoning,
        'features': features.to_dict(),
    }))

if __name__ == '__main__':
    asyncio.run(main())
```

### Option 2: FastAPI Microservice (Recommended for Production)

Run Python ML as a separate FastAPI service.

**Pros:**
- Better performance (persistent Python process)
- RESTful API interface
- Independent scaling
- Type-safe OpenAPI spec

**Cons:**
- More complex deployment
- Additional service to manage

**Implementation:**

```python
# apps/ml-service/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ml import StruggleFeatureExtractor, StrugglePredictionModel
from db import get_prisma_client

app = FastAPI()

# Initialize on startup
@app.on_event("startup")
async def startup():
    global db, extractor, model
    db = await get_prisma_client()
    extractor = StruggleFeatureExtractor(db)
    model = StrugglePredictionModel.load("models/current.pkl")

class PredictionRequest(BaseModel):
    user_id: str
    objective_id: str

class PredictionResponse(BaseModel):
    probability: float
    confidence: float
    risk_level: str
    reasoning: str
    features: dict

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        features = await extractor.extract_features_for_objective(
            request.user_id,
            request.objective_id
        )
        prediction = model.predict(features)

        return PredictionResponse(
            probability=prediction.probability,
            confidence=prediction.confidence,
            risk_level=prediction.risk_level,
            reasoning=prediction.reasoning,
            features=features.to_dict(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "model_version": model.model_version}
```

**Next.js Integration:**

```typescript
// apps/web/src/lib/ml-client.ts

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export async function getPrediction(userId: string, objectiveId: string) {
  const response = await fetch(`${ML_SERVICE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      objective_id: objectiveId,
    }),
  });

  if (!response.ok) {
    throw new Error('ML prediction failed');
  }

  return response.json();
}
```

### Option 3: Python-JS Bridge (py-node)

Use `py-node` to call Python directly from Node.js.

**Pros:**
- In-process execution
- Direct function calls

**Cons:**
- Complex setup
- Potential stability issues
- Less battle-tested

**Not recommended for production at this scale.**

## Database Integration

### Prisma Python Client

Currently, Prisma doesn't have official Python support. Options:

#### 1. Use Prisma Client Py (Community)

```bash
pip install prisma
```

```python
from prisma import Prisma

async def get_prisma_client():
    db = Prisma()
    await db.connect()
    return db

# Usage
async def get_performance_metrics(user_id: str, objective_id: str):
    db = await get_prisma_client()
    metrics = await db.performancemetric.find_many(
        where={
            'userId': user_id,
            'learningObjectiveId': objective_id,
        },
        order_by={'date': 'desc'},
        take=30,
    )
    return metrics
```

#### 2. Direct PostgreSQL with SQLAlchemy

```python
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

engine = create_engine(os.getenv('DATABASE_URL'))

def get_retention_data(user_id: str, topic_area: str):
    with Session(engine) as session:
        result = session.execute(
            select(PerformanceMetric)
            .where(PerformanceMetric.userId == user_id)
            .order_by(PerformanceMetric.date.desc())
            .limit(30)
        )
        return result.scalars().all()
```

#### 3. REST API Bridge (TypeScript → Python)

Keep data access in TypeScript, pass data to Python:

```typescript
// Fetch data in TypeScript
const features = await extractFeaturesInTypeScript(userId, objectiveId);

// Pass to Python for prediction only
const prediction = await callPythonPredict(features);
```

## Deployment

### Development

```bash
# Install Python dependencies
cd apps/web/src/ml
pip install -r requirements.txt

# Run example
python example_usage.py

# Start FastAPI service (Option 2)
cd apps/ml-service
uvicorn main:app --reload --port 8000
```

### Production

#### Docker (Recommended)

```dockerfile
# Dockerfile.ml-service
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
services:
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - ML_SERVICE_URL=http://ml-service:8000

  ml-service:
    build:
      context: ./apps/ml-service
      dockerfile: Dockerfile.ml-service
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
```

#### Serverless (AWS Lambda / Vercel)

For serverless, use Option 1 (subprocess) with Python bundled:

```typescript
// vercel.json
{
  "functions": {
    "api/analytics/predictions/generate.ts": {
      "runtime": "python3.9"
    }
  }
}
```

## Model Training & Updates

### Initial Training

```bash
# Run training script
python scripts/train_initial_model.py

# Output: models/struggle_prediction_v1.0_2025-10-16.pkl
```

### Weekly Retraining

```bash
# Cron job: weekly_retrain.sh
#!/bin/bash
python scripts/retrain_model.py --since "7 days ago"
```

**Script:**

```python
# scripts/retrain_model.py

import asyncio
from datetime import datetime, timedelta
from ml import StrugglePredictionModel, TrainingExample
from db import get_prisma_client, get_feedback_data

async def main():
    # Fetch feedback from last week
    db = await get_prisma_client()
    feedback = await get_feedback_data(since=datetime.now() - timedelta(days=7))

    # Convert to training examples
    training_data = [
        TrainingExample(
            features=f.feature_vector,
            struggled=f.actualStruggle,
            user_id=f.userId,
            objective_id=f.learningObjectiveId,
            recorded_at=f.submittedAt,
        )
        for f in feedback
    ]

    # Load current model and update
    model = StrugglePredictionModel.load("models/current.pkl")
    metrics = model.update_model(training_data)

    # Save new version if improved
    if metrics.accuracy > model.get_model_performance()['previous_accuracy']:
        timestamp = datetime.now().strftime("%Y-%m-%d")
        model.save(f"models/struggle_prediction_v1.0_{timestamp}.pkl")
        print(f"✅ Model updated. Accuracy: {metrics.accuracy:.1%}")
    else:
        print("⚠️  Model not improved. Keeping previous version.")

if __name__ == '__main__':
    asyncio.run(main())
```

## Monitoring

### Model Performance Tracking

```typescript
// apps/web/src/lib/ml-monitoring.ts

export async function trackPredictionAccuracy() {
  // Get predictions from last week
  const predictions = await prisma.strugglePrediction.findMany({
    where: {
      predictionDate: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      actualOutcome: { not: null }
    }
  });

  // Calculate metrics
  let correct = 0;
  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;

  for (const pred of predictions) {
    const predicted = pred.predictedStruggleProbability >= 0.5;
    const actual = pred.actualOutcome;

    if (predicted === actual) correct++;

    if (predicted && actual) truePositives++;
    if (predicted && !actual) falsePositives++;
    if (!predicted && !actual) trueNegatives++;
    if (!predicted && actual) falseNegatives++;
  }

  const accuracy = correct / predictions.length;
  const precision = truePositives / (truePositives + falsePositives);
  const recall = truePositives / (truePositives + falseNegatives);

  console.log(`Model Performance:
    Accuracy: ${(accuracy * 100).toFixed(1)}%
    Precision: ${(precision * 100).toFixed(1)}%
    Recall: ${(recall * 100).toFixed(1)}%
  `);

  // Alert if below thresholds
  if (accuracy < 0.75 || recall < 0.70) {
    await sendAlert('Model performance degraded - retraining needed');
  }
}
```

## Testing

### Unit Tests (TypeScript)

```typescript
// __tests__/ml-integration.test.ts

import { getPrediction } from '@/lib/ml-client';

describe('ML Integration', () => {
  it('should return prediction from ML service', async () => {
    const prediction = await getPrediction('user_123', 'obj_456');

    expect(prediction.probability).toBeGreaterThanOrEqual(0);
    expect(prediction.probability).toBeLessThanOrEqual(1);
    expect(prediction.risk_level).toMatch(/LOW|MEDIUM|HIGH/);
  });
});
```

### Integration Tests (Python)

```python
# tests/test_integration.py

import pytest
from ml import StruggleFeatureExtractor, StrugglePredictionModel
from tests.fixtures import create_test_db

@pytest.mark.asyncio
async def test_end_to_end_prediction():
    db = await create_test_db()
    extractor = StruggleFeatureExtractor(db)
    model = StrugglePredictionModel()

    features = await extractor.extract_features_for_objective(
        'test_user',
        'test_objective'
    )

    prediction = model.predict(features)

    assert 0 <= prediction.probability <= 1
    assert prediction.risk_level in ['LOW', 'MEDIUM', 'HIGH']
```

## Troubleshooting

### Python subprocess fails

```typescript
// Add better error handling
try {
  const result = await execAsync(pythonCommand, { timeout: 5000 });
  return JSON.parse(result.stdout);
} catch (error) {
  if (error.killed) {
    throw new Error('Python process timeout');
  }
  if (error.stderr) {
    throw new Error(`Python error: ${error.stderr}`);
  }
  throw error;
}
```

### Model not found

```python
# Add model existence check
import os
if not os.path.exists("models/current.pkl"):
    # Fall back to rule-based model
    model = StrugglePredictionModel()  # No .load()
```

### Feature extraction fails

```python
# Graceful degradation
try:
    features = await extractor.extract_features_for_objective(user_id, obj_id)
except Exception as e:
    logger.warning(f"Feature extraction failed: {e}")
    # Return default features
    features = extractor._create_default_feature_vector()
```

## Next Steps

1. **Choose integration approach** (subprocess vs. microservice)
2. **Implement Prisma Python client** or direct PostgreSQL
3. **Create API endpoints** in Next.js
4. **Deploy ML service** (Docker or serverless)
5. **Set up monitoring** and alerting
6. **Schedule weekly retraining** with cron job

---

**Last Updated:** 2025-10-16
