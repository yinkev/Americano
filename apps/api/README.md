# Americano Python API - Understanding Validation Engine

Python FastAPI microservice for AI-powered comprehension evaluation in the Americano medical education platform.

**Epic 4: Understanding Validation Engine** - Serves ALL Epic 4 AI evaluation needs (Stories 4.1-4.6)

## Features

- **Prompt Generation**: AI-powered "Explain to a patient" prompts with 3 template types
- **Comprehension Evaluation**: 4-dimensional scoring rubric (terminology, relationships, application, clarity)
- **Structured Outputs**: Uses `instructor` library for Pydantic-validated LLM responses
- **Confidence Calibration**: Detects overconfidence/underconfidence patterns
- **Type Safety**: Full Pydantic v2 validation across all endpoints
- **CORS Support**: Configured for Next.js integration (localhost:3000)

## Architecture

```
User → Next.js UI (TypeScript) → Next.js API Route (TypeScript proxy) → Python FastAPI Service → ChatMock/GPT-4
                                                                              ↓
                                                                         Pydantic Models
                                                                              ↓
                                                                    TypeScript Interfaces (Zod)
```

## Technology Stack

- **FastAPI 0.115.0**: Modern async Python web framework
- **Pydantic v2**: Type-safe data validation and serialization
- **instructor 1.8.0**: Structured LLM outputs with OpenAI integration
- **OpenAI SDK 1.58.0**: ChatMock/GPT-4 API client
- **uvicorn**: ASGI server for production deployment
- **pytest**: Comprehensive unit testing

## Project Structure

```
apps/api/
├── main.py                     # FastAPI app entry point
├── requirements.txt            # Python dependencies
├── .env.example               # Environment configuration template
├── .gitignore                 # Git ignore rules
├── src/
│   ├── __init__.py
│   ├── config.py              # Settings (pydantic-settings)
│   └── validation/
│       ├── __init__.py
│       ├── models.py          # Pydantic request/response models
│       ├── evaluator.py       # AI evaluation engine
│       └── routes.py          # FastAPI endpoints
└── tests/
    ├── __init__.py
    └── test_validation.py     # Unit tests
```

## Quick Start

### 1. Prerequisites

- Python 3.11+ (recommended: Python 3.12)
- OpenAI API key (for ChatMock/GPT-4 access)

### 2. Installation

```bash
# Navigate to API directory
cd apps/api

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your OpenAI API key
# OPENAI_API_KEY=your_key_here
```

### 4. Run the Service

```bash
# Development mode (with auto-reload)
uvicorn main:app --reload --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Health Check

**GET** `/health`

Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "americano-validation-api",
  "version": "1.0.0"
}
```

### Generate Comprehension Prompt

**POST** `/validation/generate-prompt`

Generate a varied "Explain to a patient" prompt for a learning objective.

**Request Body:**
```json
{
  "objective_id": "obj_123",
  "objective_text": "Explain the cardiac conduction system and its role in generating electrical impulses."
}
```

**Response:**
```json
{
  "prompt_text": "A patient asks you to explain how their heart beats. How would you describe the cardiac conduction system?",
  "prompt_type": "Clinical Scenario",
  "expected_criteria": [
    "SA node as pacemaker",
    "Electrical signal pathway",
    "Atrial and ventricular contraction",
    "Coordinated pumping action"
  ]
}
```

**Template Types:**
- `Direct Question`: "Explain [concept] to a patient in simple terms..."
- `Clinical Scenario`: "A patient asks you about [concept]. How would you explain...?"
- `Teaching Simulation`: "Imagine you're educating a patient about [concept]. What would you say?"

### Evaluate Comprehension

**POST** `/validation/evaluate`

Evaluate user's explanation using AI with 4-dimensional scoring.

**Request Body:**
```json
{
  "prompt_id": "prompt_123",
  "user_answer": "The cardiac conduction system starts with the SA node...",
  "confidence_level": 4,
  "objective_text": "Explain the cardiac conduction system..."
}
```

**Response:**
```json
{
  "overall_score": 85,
  "terminology_score": 90,
  "relationships_score": 85,
  "application_score": 80,
  "clarity_score": 85,
  "strengths": [
    "Accurate use of medical terminology (SA node, AV node)",
    "Clear explanation of signal pathway"
  ],
  "gaps": [
    "Could elaborate on bundle of His function",
    "Missing explanation of refractory period"
  ],
  "calibration_delta": 15.0,
  "calibration_note": "You felt more confident than your explanation showed - beware overconfidence!"
}
```

**Scoring Rubric:**
- **Terminology (20%)**: Correct medical terms in context
- **Relationships (30%)**: Demonstrates connections between concepts
- **Application (30%)**: Applies to clinical scenarios
- **Clarity (20%)**: Patient-friendly language without losing accuracy

**Score Thresholds:**
- `0-59`: Needs Review
- `60-79`: Developing
- `80-100`: Proficient

**Calibration:**
- `delta > 15`: Overconfident
- `delta < -15`: Underconfident
- `abs(delta) <= 15`: Well calibrated

## Testing

### Run All Tests

```bash
# Run pytest
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_validation.py

# Run with verbose output
pytest -v
```

### Test Coverage

Current test coverage includes:
- ✅ Pydantic model validation
- ✅ Prompt generation (3 template types)
- ✅ Evaluation logic (strong/weak answers)
- ✅ Calibration calculation (overconfident/underconfident/calibrated)
- ✅ Weighted scoring formula
- ✅ Error handling

**Coverage Target**: 80%+ (ML/analytics code standard)

## Integration with Next.js

The TypeScript side will create API routes that proxy to this Python service:

```typescript
// apps/web/app/api/validation/evaluate/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Call Python FastAPI service
  const response = await fetch('http://localhost:8000/validation/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  // Save to database via Prisma
  await prisma.validationResponse.create({
    data: {
      promptId: body.promptId,
      userAnswer: body.userAnswer,
      aiEvaluation: result,
      score: result.overall_score,
    },
  });

  return NextResponse.json(result);
}
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | - | ✅ |
| `OPENAI_MODEL` | Model name | `gpt-4` | ❌ |
| `OPENAI_TEMPERATURE` | Temperature (0-1) | `0.3` | ❌ |
| `OPENAI_MAX_TOKENS` | Max response tokens | `2000` | ❌ |
| `ENVIRONMENT` | Environment | `development` | ❌ |
| `LOG_LEVEL` | Log level | `info` | ❌ |
| `API_HOST` | Host binding | `0.0.0.0` | ❌ |
| `API_PORT` | Port number | `8000` | ❌ |
| `CORS_ORIGINS` | Allowed origins | `http://localhost:3000` | ❌ |

## Development Workflow

### 1. Local Development

```bash
# Terminal 1: Python service
cd apps/api
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: Next.js (handled by TypeScript agent)
cd apps/web
npm run dev

# Terminal 3: Testing
cd apps/api
pytest --watch
```

### 2. Code Quality

```bash
# Format code with ruff
ruff format src tests

# Lint code
ruff check src tests

# Type checking
mypy src
```

### 3. Debugging

FastAPI provides excellent debugging via interactive docs:
- Visit http://localhost:8000/docs
- Try endpoints directly in the browser
- View request/response schemas

## Deployment

### Docker (Recommended)

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build image
docker build -t americano-api .

# Run container
docker run -p 8000:8000 --env-file .env americano-api
```

### Cloud Run / AWS Lambda

The FastAPI app is compatible with serverless deployment:
- **Google Cloud Run**: Use `uvicorn` as the entry point
- **AWS Lambda**: Use `mangum` adapter for ASGI
- **Azure Functions**: Use `azure-functions` integration

## Performance

**Targets:**
- Prompt generation: < 2 seconds
- AI evaluation: < 5 seconds
- Health check: < 100ms

**Optimizations:**
- Async/await for I/O-bound operations
- Connection pooling for OpenAI API
- Response caching (7-day TTL for prompts)
- Efficient Pydantic validation

## Troubleshooting

### "OpenAI API key not found"
- Verify `.env` file exists in `apps/api/`
- Check `OPENAI_API_KEY` is set correctly
- Restart the uvicorn server

### "CORS error from Next.js"
- Verify `CORS_ORIGINS` includes `http://localhost:3000`
- Check Next.js is running on port 3000
- Verify CORS middleware is enabled in `main.py`

### "Import errors"
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`
- Check Python version is 3.11+

## Contributing

### Code Standards

- **Type hints**: Required for all function signatures
- **Docstrings**: Google-style for all public functions
- **Naming**: `snake_case` for variables/functions, `PascalCase` for classes
- **Async**: Use `asyncio` for I/O-bound operations

### Adding New Endpoints

1. Define Pydantic models in `src/validation/models.py`
2. Add logic to `src/validation/evaluator.py`
3. Create route in `src/validation/routes.py`
4. Write tests in `tests/test_validation.py`
5. Update this README

## Future Extensions (Stories 4.2-4.6)

This service is designed to support ALL Epic 4 stories:
- **Story 4.2**: Clinical reasoning evaluation
- **Story 4.3**: Failure pattern detection
- **Story 4.4**: scipy-based performance correlation
- **Story 4.5**: IRT algorithms + adaptive difficulty
- **Story 4.6**: ML-based predictive analytics

Simply add new routes to `src/validation/routes.py` as needed.

## License

Proprietary - Americano Medical Education Platform

## Support

For issues or questions, contact the development team or open an issue in the project repository.

---

**Built with ❤️ using FastAPI, Pydantic, and instructor**
