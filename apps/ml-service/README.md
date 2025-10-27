# Americano ML Service

**FastAPI microservice providing ML prediction capabilities for predictive analytics in medical education.**

Story: **5.2 - Predictive Analytics for Learning Struggles**

## Architecture

- **Framework:** FastAPI (async-first, high-performance)
- **Database:** PostgreSQL via Prisma Python Client
- **Validation:** Pydantic V2
- **ML:** scikit-learn (logistic regression) + rule-based system
- **Deployment:** uvicorn ASGI server

## Features

- ✅ Async/await throughout for high concurrency
- ✅ Automatic OpenAPI documentation (`/docs`)
- ✅ Pydantic V2 request/response validation
- ✅ Structured JSON logging
- ✅ CORS middleware for Next.js integration
- ✅ Health check endpoint (`/health`)
- ✅ Research-grade ML models
- ✅ Prisma ORM with type safety
- ✅ **Data Pipeline:** Prisma → Parquet → DuckDB (ADR-006)
- ✅ **Pandera Validation:** Fail-fast data quality checks
- ✅ **DVC Integration:** Version-controlled datasets

## Endpoints

### Predictions
- `POST /predictions/generate` - Trigger prediction analysis
- `GET /predictions` - Query predictions
- `POST /predictions/{id}/feedback` - Record feedback

### Interventions
- `GET /interventions` - Get active interventions
- `POST /interventions/{id}/apply` - Apply intervention to mission

### Analytics
- `GET /analytics/model-performance` - Model metrics
- `GET /analytics/struggle-reduction` - Success metrics

### Data Export (ADR-006)
- `python scripts/export_behavioral_events.py` - Export to Parquet
- `python scripts/export_behavioral_events.py --sync-duckdb` - Export + DuckDB sync
- See [Data Pipeline Documentation](./docs/DATA_PIPELINE_IMPLEMENTATION.md) for details

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 14+ (with same database as Next.js app)
- Poetry or pip

### Installation

```bash
# Navigate to ml-service directory
cd apps/ml-service

# Install dependencies (Poetry recommended)
poetry install

# Or with pip
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Generate Prisma client
prisma generate

# Run database migrations (if needed)
prisma migrate deploy
```

### Development

```bash
# Run development server with auto-reload
uvicorn app.main:app --reload --port 8000

# Or use the convenience script
python -m app.main

# API documentation available at:
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

### Production

```bash
# Run with uvicorn (production config)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Or with gunicorn + uvicorn workers
gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:8000
```

## Project Structure

```
apps/ml-service/
├── app/
│   ├── main.py                 # FastAPI app initialization
│   ├── models/                 # Pydantic request/response models
│   │   ├── predictions.py
│   │   ├── interventions.py
│   │   ├── feedback.py
│   │   └── analytics.py
│   ├── routes/                 # API endpoints
│   │   ├── predictions.py      # 3 prediction endpoints
│   │   ├── interventions.py    # 2 intervention endpoints
│   │   └── analytics.py        # 2 analytics endpoints
│   ├── services/               # Business logic
│   │   ├── database.py         # Prisma singleton
│   │   └── detection_engine.py # ML prediction orchestrator
│   └── utils/
│       ├── config.py           # Pydantic settings
│       └── logging.py          # Structured logging
├── prisma/
│   └── schema.prisma           # Database schema
├── requirements.txt
├── pyproject.toml
├── .env.example
└── README.md
```

## Integration with Next.js

The ML service integrates with the Next.js app via HTTP API calls:

```typescript
// Next.js API route example
import { fetch } from 'undici';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  const { userId, daysAhead } = await request.json();

  const response = await fetch(`${ML_SERVICE_URL}/predictions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, days_ahead: daysAhead })
  });

  const predictions = await response.json();
  return Response.json(predictions);
}
```

## ML Models

### Rule-Based Model (MVP)
- Uses threshold-based decision rules
- Feature importance: retention score, prerequisite gaps, complexity mismatch
- Target: >75% accuracy, >70% recall

### Logistic Regression (Post-MVP)
- Trained on historical struggle data
- scikit-learn implementation with L2 regularization
- Automatic calibration for probability estimates
- Incremental learning support

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Type checking
mypy app/
```

## Monitoring

- Health check: `GET /health`
- Structured logging (JSON in production)
- Request timing middleware
- Database connection status

## Environment Variables

See `.env.example` for full configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 8000)
- `ENVIRONMENT`: development, staging, or production
- `CORS_ORIGINS`: Allowed origins for CORS
- `MODEL_TYPE`: rule_based or logistic_regression

## Performance

- **Target latency:** <200ms (prediction query), <2s (generation)
- **Concurrency:** Async/await + connection pooling
- **Caching:** 3-tier strategy (profiles, patterns, metrics)
- **Batch processing:** Daily predictions (11 PM)

## Research Analytics: Day 4

This service ships with MLflow tracking and DuckDB analytics helpers for research workflows.

### MLflow Tracking Server

- Compose file: `docker-compose.yml` (in this folder)
- UI: http://localhost:5000

Setup:
- Copy env: `cp .env.example .env` and set the `MLFLOW_DB_*` vars to point at your existing PostgreSQL instance. On macOS use `host.docker.internal` for the host.

Run:
```bash
docker compose up -d mlflow
# Verify UI at http://localhost:5000
```

Python client configuration:
```bash
export MLFLOW_TRACKING_URI=${MLFLOW_TRACKING_URI:-http://localhost:5000}
export MLFLOW_EXPERIMENT_NAME="Americano/Research"
```

Example run:
```bash
python scripts/example_mlflow_analysis.py \
  --run-name day4-research-demo \
  --analysis-run-id ARN_12345   # optional: link to Prisma AnalysisRun.id
```

What it does:
- Logs params, metrics (with steps), and artifacts
- Tags the run with `git.commit`, `dvc.lock.sha256`, and `analysis_run_id`
- Attempts to link the MLflow run back to your PostgreSQL `AnalysisRun` row

Notes:
- Artifacts are stored on the server’s local volume at `./data/mlflow/artifacts` (mounted into the container).
- The MLflow metadata backend is PostgreSQL (not SQLite).

### DuckDB Analytics

Create/update the analytics database from Parquet exports (default) or directly from PostgreSQL using the `postgres_scanner` extension.

Setup:
```bash
cp .env.example .env
# Set DUCKDB_DB_PATH, and the Parquet paths if different
```

Build the analytics DB:
```bash
python scripts/setup_duckdb_analytics.py
```

Run example queries:
```bash
python scripts/example_duckdb_queries.py

# Optional timing vs PostgreSQL on a comparable aggregation
COMPARE_WITH_POSTGRES=true PG_EVENTS_TABLE='"BehavioralEvent"' \
  python scripts/example_duckdb_queries.py
```

Implementation details:
- Tables are created under the `analytics` schema inside the DuckDB file at `DUCKDB_DB_PATH`.
- Parquet loads try to physically order by a timestamp column if one is present to improve compression and zone map pruning.
- Helpful indexes are created when the expected columns exist (ART indexes in DuckDB).

Recommended sync patterns:
- Development: Parquet exports -> DuckDB (simple and fast)
- Production/research: Direct `postgres_scanner` + periodic materialization into tables for query speed


## Quality Standards

Per CLAUDE.MD:
- ✅ Research-grade quality
- ✅ World-class excellence
- ✅ Python stack best practices
- ✅ Type safety throughout
- ✅ Comprehensive error handling

## Documentation

- OpenAPI spec: `/docs` (development only)
- ReDoc: `/redoc` (development only)
- Type hints: Full coverage
- Docstrings: Google style

## License

MIT

## Authors

Americano Development Team
Story 5.2: Predictive Analytics for Learning Struggles
