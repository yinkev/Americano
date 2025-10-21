# Story 4.1: Setup and Usage Guide

**Python FastAPI Service for Understanding Validation Engine**

This guide walks you through setting up and running the Python FastAPI service for Story 4.1 (Natural Language Comprehension Prompts).

---

## Prerequisites

### System Requirements
- Python 3.11+
- pip (Python package manager)
- Virtual environment support (`venv` or `virtualenv`)

### Check Python Version
```bash
python --version  # Should be 3.11 or higher
```

---

## Installation

### Step 1: Navigate to API Directory

```bash
cd /Users/kyin/Projects/Americano-epic4/apps/api
```

### Step 2: Create Virtual Environment (if not exists)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows
```

**Verify activation:**
```bash
which python
# Should show: /Users/kyin/Projects/Americano-epic4/apps/api/venv/bin/python
```

### Step 3: Install Dependencies

```bash
# Install all dependencies from requirements.txt
pip install -r requirements.txt

# Verify installation
pip list | grep -E "fastapi|pydantic|instructor|openai"
```

**Expected output:**
```
fastapi         0.115.0
instructor      1.8.0
openai          1.58.0
pydantic        2.10.0
pydantic-settings 2.6.1
```

### Step 4: Configure Environment Variables

The `.env` file is already configured for Epic 4:

```bash
cat .env
```

**Expected contents:**
```bash
# OpenAI Configuration (ChatMock for testing)
OPENAI_API_KEY=sk-chatmock-test-key
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=2000

# Application Configuration
ENVIRONMENT=development
LOG_LEVEL=info
API_HOST=0.0.0.0
API_PORT=8001  # Epic 4 port allocation

# CORS Configuration (Epic 4 Next.js runs on port 3001)
CORS_ORIGINS=["http://localhost:3001", "http://127.0.0.1:3001"]
```

**For production OpenAI API:**
Replace `OPENAI_API_KEY=sk-chatmock-test-key` with your actual OpenAI API key.

---

## Running the Service

### Development Mode (Auto-reload)

```bash
# Activate venv if not already activated
source venv/bin/activate

# Start server on Epic 4 port (8001)
uvicorn main:app --reload --port 8001
```

**Expected output:**
```
🚀 Americano Validation API starting...
📝 Environment: development
🤖 OpenAI Model: gpt-4
🌐 CORS Origins: ['http://localhost:3001', 'http://127.0.0.1:3001']
✅ API ready at http://0.0.0.0:8001
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Production Mode

```bash
# Using Gunicorn with Uvicorn workers
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8001 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

---

## Verification

### 1. Health Check

```bash
curl http://localhost:8001/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "americano-validation-api",
  "version": "1.0.0"
}
```

### 2. Interactive API Docs

Open in your browser:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### 3. Run Test Suite

```bash
# Run comprehensive endpoint tests
python test_story_4_1_endpoints.py
```

**Expected output:**
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    STORY 4.1 ENDPOINT TESTS                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

================================================================================
TEST 1: Health Check
================================================================================
✅ Health check passed: {'status': 'healthy', 'service': 'americano-validation-api', 'version': '1.0.0'}

================================================================================
TEST 2: Prompt Generation
================================================================================
📤 Request:
   Objective ID: obj_test_123
   Objective: Explain the cardiac conduction system...

📥 Response:
   Prompt Type: Clinical Scenario
   Prompt Text: A patient asks you about their heart's electrical system...
   Expected Criteria: 5 items
      - SA node (sinoatrial node) - heart's natural pacemaker

✅ Prompt generation successful!

... (tests continue) ...

╔══════════════════════════════════════════════════════════════════════════════╗
║                              TEST SUMMARY                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

   Tests Passed: 5/5
   Status: ✅ ALL TESTS PASSED
```

---

## Usage Examples

### Generate Comprehension Prompt

```bash
curl -X POST http://localhost:8001/validation/generate-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "objective_id": "obj_cardiac_123",
    "objective_text": "Explain the cardiac conduction system and how it coordinates the heartbeat"
  }'
```

**Response:**
```json
{
  "prompt_text": "Explain the cardiac conduction system as if you're talking to a patient who has no medical background.",
  "prompt_type": "Direct Question",
  "expected_criteria": [
    "SA node (sinoatrial node) - heart's natural pacemaker",
    "AV node (atrioventricular node) - relay station",
    "Bundle of His and Purkinje fibers",
    "Coordinated atria-ventricle contraction",
    "Normal heart rate regulation (60-100 bpm)"
  ]
}
```

### Evaluate User Answer

```bash
curl -X POST http://localhost:8001/validation/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_id": "prompt_456",
    "user_answer": "The cardiac conduction system is like an electrical wiring system in your heart. It starts with the SA node, which acts like the heart'\''s natural pacemaker...",
    "confidence_level": 4,
    "objective_text": "Explain the cardiac conduction system and how it coordinates the heartbeat"
  }'
```

**Response:**
```json
{
  "overall_score": 85,
  "terminology_score": 90,
  "relationships_score": 85,
  "application_score": 80,
  "clarity_score": 88,
  "strengths": [
    "Excellent use of the pacemaker analogy to explain the SA node's role",
    "Clear explanation of the signal pathway"
  ],
  "gaps": [
    "Could mention the timing delay at the AV node"
  ],
  "calibration_delta": -10.0,
  "calibration_note": "Your understanding is stronger than you think - trust yourself!"
}
```

---

## Troubleshooting

### Issue: Port 8001 already in use

**Solution:**
```bash
# Find process using port 8001
lsof -ti:8001

# Kill process
kill -9 $(lsof -ti:8001)

# Or use different port
uvicorn main:app --reload --port 8002
```

### Issue: ModuleNotFoundError

**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: OpenAI API key error

**Error message:**
```
Evaluation failed: OpenAI API key invalid
```

**Solution:**
1. Check `.env` file has valid `OPENAI_API_KEY`
2. For ChatMock testing, use: `sk-chatmock-test-key`
3. For production, get real API key from: https://platform.openai.com/

### Issue: CORS error from Next.js

**Error message:**
```
Access to fetch at 'http://localhost:8001/validation/evaluate' from origin 'http://localhost:3001' has been blocked by CORS policy
```

**Solution:**
Verify `.env` has correct CORS configuration:
```bash
CORS_ORIGINS=["http://localhost:3001", "http://127.0.0.1:3001"]
```

---

## Development Workflow

### 1. Make Code Changes

Edit files in `src/validation/`:
- `routes.py` - API endpoints
- `models.py` - Pydantic models
- `evaluator.py` - AI evaluation logic
- `calibrator.py` - Confidence calibration

### 2. Test Changes

```bash
# Auto-reload is enabled in dev mode (--reload flag)
# Server automatically restarts on file changes

# Run tests
python test_story_4_1_endpoints.py

# Run unit tests
pytest tests/test_validation.py -v
```

### 3. Code Quality

```bash
# Format code
ruff format src/

# Lint code
ruff check src/

# Type checking
mypy src/
```

---

## Integration with Next.js

### TypeScript Proxy Setup

The Next.js app (running on port 3001) communicates with the Python service (port 8001) via proxy routes.

**Example Next.js API route:**

**File:** `apps/web/app/api/validation/evaluate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Proxy to Python FastAPI service (port 8001)
  const response = await fetch('http://localhost:8001/validation/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt_id: body.promptId,
      user_answer: body.userAnswer,
      confidence_level: body.confidenceLevel,
      objective_text: body.objectiveText,
    }),
  });

  if (!response.ok) {
    throw new Error('Python service evaluation failed');
  }

  const result = await response.json();
  return NextResponse.json(result);
}
```

### Running Both Services

**Terminal 1 - Python API:**
```bash
cd /Users/kyin/Projects/Americano-epic4/apps/api
source venv/bin/activate
uvicorn main:app --reload --port 8001
```

**Terminal 2 - Next.js:**
```bash
cd /Users/kyin/Projects/Americano-epic4/apps/web
PORT=3001 npm run dev
```

**Terminal 3 - Prisma Studio (optional):**
```bash
cd /Users/kyin/Projects/Americano-epic4/apps/web
npx prisma studio --port 5556
```

---

## Testing Strategy

### Unit Tests (pytest)

```bash
# Run all validation tests
pytest tests/test_validation.py -v

# Run specific test
pytest tests/test_validation.py::test_generate_prompt -v

# Run with coverage
pytest tests/test_validation.py --cov=src/validation --cov-report=html

# Open coverage report
open htmlcov/index.html
```

### Integration Tests (test script)

```bash
# Run comprehensive endpoint tests
python test_story_4_1_endpoints.py

# Tests included:
# 1. Health check
# 2. Prompt generation (3 template types)
# 3. Strong explanation evaluation (score 80-100)
# 4. Weak explanation evaluation (score 0-59)
# 5. Overconfidence calibration detection
# 6. Template variation (10 generations)
```

### Manual Testing (Swagger UI)

1. Open http://localhost:8001/docs
2. Click on endpoint (e.g., `/validation/evaluate`)
3. Click "Try it out"
4. Fill in request body
5. Click "Execute"
6. View response

---

## Project Structure

```
apps/api/
├── main.py                           # FastAPI application entry
├── requirements.txt                  # Python dependencies
├── .env                              # Environment variables (Epic 4)
├── .env.example                      # Example environment config
├── pytest.ini                        # Pytest configuration
├── README.md                         # General API documentation
├── STORY-4.1-API-REFERENCE.md        # API endpoint reference
├── STORY-4.1-SETUP-GUIDE.md          # This file
├── test_story_4_1_endpoints.py       # Integration test script
│
├── src/
│   ├── __init__.py
│   ├── config.py                     # Settings (Pydantic BaseSettings)
│   ├── database.py                   # Database connection (Story 4.6)
│   │
│   └── validation/                   # Story 4.1 validation module
│       ├── __init__.py
│       ├── routes.py                 # FastAPI router (endpoints)
│       ├── models.py                 # Pydantic request/response models
│       ├── evaluator.py              # AI evaluation engine (instructor)
│       └── calibrator.py             # Confidence calibration logic
│
├── tests/
│   ├── __init__.py
│   ├── test_validation.py            # Pytest unit tests
│   ├── test_calibrator.py
│   └── conftest.py                   # Pytest fixtures
│
└── venv/                             # Virtual environment (not in git)
```

---

## Environment Configuration Reference

**File:** `.env`

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OPENAI_API_KEY` | string | required | OpenAI API key (or `sk-chatmock-test-key` for testing) |
| `OPENAI_MODEL` | string | `gpt-4` | Model name (will use GPT-5 when available) |
| `OPENAI_TEMPERATURE` | float | `0.3` | LLM temperature (0.0-1.0) - lower = more consistent |
| `OPENAI_MAX_TOKENS` | int | `2000` | Max tokens for LLM response |
| `ENVIRONMENT` | string | `development` | Environment name (development/staging/production) |
| `LOG_LEVEL` | string | `info` | Logging level (debug/info/warning/error) |
| `API_HOST` | string | `0.0.0.0` | Host to bind server |
| `API_PORT` | int | `8001` | Port to run server (Epic 4 allocation) |
| `CORS_ORIGINS` | JSON array | `["http://localhost:3001"]` | Allowed CORS origins (Next.js port 3001) |
| `DATABASE_URL` | string | `postgresql://...` | PostgreSQL connection string (Story 4.6) |

---

## Performance Tips

### 1. Connection Pooling

For production, enable connection pooling:

```python
# src/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

engine = create_async_engine(
    settings.database_url,
    pool_size=20,         # Max connections
    max_overflow=10,      # Overflow connections
    pool_pre_ping=True,   # Verify connections
)
```

### 2. Caching

Cache prompt generations to avoid redundant LLM calls:

```python
from functools import lru_cache

@lru_cache(maxsize=100)
async def get_cached_prompt(objective_id: str, objective_text: str):
    return await evaluator.generate_prompt(objective_id, objective_text)
```

### 3. Async Optimization

Use `asyncio.gather()` for parallel LLM calls:

```python
# Generate multiple prompts in parallel
prompts = await asyncio.gather(
    evaluator.generate_prompt(obj1_id, obj1_text),
    evaluator.generate_prompt(obj2_id, obj2_text),
    evaluator.generate_prompt(obj3_id, obj3_text),
)
```

---

## Next Steps

### Story 4.1 Completion Checklist

- [x] Python FastAPI service set up
- [x] `/validation/generate-prompt` endpoint implemented
- [x] `/validation/evaluate` endpoint implemented
- [x] Confidence calibration logic implemented
- [x] Template variation (3 types) implemented
- [x] instructor library integration verified
- [x] Port configuration updated (8001 for Epic 4)
- [x] CORS configured for Next.js (port 3001)
- [x] Test script created
- [x] API reference documentation written
- [x] Setup guide created
- [ ] TypeScript UI integration (parallel agent)
- [ ] Prisma database schema extended
- [ ] Session integration (Story 2.5)
- [ ] Analytics page (ComprehensionMetric tracking)

### Integration Tasks (TypeScript Agent)

1. Create Next.js API proxy routes:
   - `POST /api/validation/generate-prompt`
   - `POST /api/validation/evaluate`

2. Implement UI components:
   - `ComprehensionPromptDialog.tsx`
   - `ConfidenceSlider.tsx`
   - `EvaluationFeedback.tsx`

3. Extend Prisma schema:
   - `ValidationPrompt` model
   - `ValidationResponse` model
   - `ComprehensionMetric` model

4. Integrate with study session flow:
   - Trigger prompt after objective content review
   - Display evaluation feedback
   - Track metrics over time

---

## Support

### Documentation
- **API Reference**: `STORY-4.1-API-REFERENCE.md`
- **CLAUDE.md**: `/Users/kyin/Projects/Americano-epic4/CLAUDE.md`
- **Story Context**: `/Users/kyin/Projects/Americano-epic4/docs/stories/story-context-4.1.xml`

### External Resources
- **FastAPI**: https://fastapi.tiangolo.com/
- **instructor**: https://github.com/jxnl/instructor
- **Pydantic**: https://docs.pydantic.dev/latest/

### Logs
```bash
# View server logs
tail -f logs/api.log

# Enable debug logging
LOG_LEVEL=debug uvicorn main:app --reload --port 8001
```

---

**Last Updated:** 2025-10-17
**Author:** FastAPI Pro Agent (Story 4.1)
**Status:** ✅ Complete and ready for TypeScript integration
