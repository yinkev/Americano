# Story 4.2: Clinical Reasoning Scenario Assessment - Python Service Implementation

**Status**: ✅ Complete
**Date**: 2025-10-17
**Epic**: Epic 4 - Understanding Validation Engine

---

## Overview

This document describes the Python FastAPI service implementation for **Story 4.2: Clinical Reasoning Scenario Assessment**. The service provides AI-powered clinical scenario generation and competency-based evaluation for medical students.

### What Was Built

1. **Clinical Scenario Generator** (`scenario_generator.py`)
   - Generates USMLE/COMLEX-style clinical case scenarios
   - Uses `instructor` library with OpenAI for structured outputs
   - Supports 3 difficulty levels: BASIC, INTERMEDIATE, ADVANCED
   - Creates multi-stage cases with realistic patient presentations

2. **Clinical Reasoning Evaluator** (`scenario_evaluator.py`)
   - Evaluates student clinical decision-making
   - Scores across 4 competency domains
   - Detects cognitive biases (anchoring, premature closure, etc.)
   - Provides teaching points and resource suggestions

3. **FastAPI Endpoints** (`routes.py`)
   - `POST /validation/scenarios/generate` - Generate clinical scenarios
   - `POST /validation/scenarios/evaluate` - Evaluate clinical reasoning
   - `GET /validation/scenarios/{id}` - Retrieve scenario by ID
   - `GET /validation/scenarios/metrics` - Performance analytics

4. **Comprehensive Test Suite** (`test_clinical_scenarios.py`)
   - 16 test cases covering all endpoints
   - Mock integration to avoid OpenAI API calls
   - Error handling and edge case validation

---

## Architecture

### Hybrid TypeScript + Python Pattern

```
User → Next.js UI (TypeScript)
    ↓
Next.js API Route (TypeScript proxy)
    ↓
Python FastAPI Service (Port 8001)
    ↓
ChatMock/GPT-5 with instructor
    ↓
Pydantic-validated structured outputs
```

**Why Python for This?**
- `instructor` library provides superior structured outputs from LLMs
- Pydantic V2 offers robust type validation
- Easy to add scipy/scikit-learn for future statistical analysis
- Clean separation: Python handles AI/ML, TypeScript handles UI/DB

---

## API Endpoints

### 1. Generate Clinical Scenario

**Endpoint**: `POST /validation/scenarios/generate`

**Request**:
```json
{
  "objective_id": "obj_12345",
  "objective_text": "Understand the pathophysiology and management of acute myocardial infarction",
  "board_exam_tags": ["USMLE-Step2-Cardiology", "COMLEX-L2-Cardiovascular"],
  "difficulty": "INTERMEDIATE"
}
```

**Response**:
```json
{
  "scenario_id": "scenario_abc123def456",
  "objective_id": "obj_12345",
  "scenario_type": "DIAGNOSIS",
  "difficulty": "INTERMEDIATE",
  "case_text": {
    "chief_complaint": "72-year-old man with sudden chest pain",
    "demographics": {
      "age": 72,
      "sex": "M",
      "occupation": "retired"
    },
    "history": {
      "presenting": "Sudden onset substernal chest pain radiating to left arm...",
      "past": "Hypertension, hyperlipidemia, type 2 diabetes",
      "medications": ["Lisinopril", "Atorvastatin", "Metformin"],
      "allergies": "NKDA",
      "social": "Former smoker (30 pack-years), quit 10 years ago",
      "family": "Father had MI at age 60"
    },
    "physical_exam": {
      "vitals": {
        "BP": "160/95",
        "HR": "102",
        "RR": "22",
        "T": "37.1°C",
        "SpO2": "96% on RA"
      },
      "general": "Diaphoretic, anxious appearing",
      "cardiovascular": "S4 gallop, no murmurs, no JVD",
      "respiratory": "Clear bilaterally, no wheezes/rales"
    },
    "labs": {
      "available": false,
      "options": ["ECG", "Troponin", "CBC", "BMP", "CXR", "Cardiac enzymes"]
    },
    "questions": [
      {
        "stage": "initial",
        "prompt": "What is your next best step?",
        "options": [
          "Order ECG",
          "Give aspirin",
          "Order CT angiography",
          "Wait and observe"
        ],
        "correctAnswer": "Order ECG",
        "reasoning": "ECG is first-line for suspected ACS to evaluate for ST changes"
      }
    ]
  },
  "board_exam_topic": "Cardiovascular Medicine"
}
```

**Difficulty Guidelines**:
- **BASIC**: Classic presentation, 1-2 decision points, common conditions
- **INTERMEDIATE**: Atypical features, 3-4 decision points, requires differential
- **ADVANCED**: Multiple comorbidities, 5+ decision points, cognitive bias traps

---

### 2. Evaluate Clinical Reasoning

**Endpoint**: `POST /validation/scenarios/evaluate`

**Request**:
```json
{
  "scenario_id": "scenario_abc123",
  "user_choices": {
    "initial": "Order ECG",
    "ecg_results": "Start aspirin and nitroglycerin",
    "treatment": "Activate cath lab"
  },
  "user_reasoning": "Patient presents with classic ACS symptoms including chest pain, diaphoresis, and S4 gallop. ECG is the first diagnostic step to evaluate for STEMI. Given high clinical suspicion, immediate anti-ischemic therapy with aspirin and nitroglycerin is warranted while preparing for possible PCI.",
  "time_spent": 480,
  "case_summary": "65M with chest pain, diaphoretic, S4 gallop. Suspected acute MI."
}
```

**Response**:
```json
{
  "overall_score": 85,
  "competency_scores": {
    "data_gathering": 90,
    "diagnosis": 85,
    "management": 80,
    "clinical_reasoning": 85
  },
  "strengths": [
    "Recognized classic ACS presentation quickly with appropriate red flag identification",
    "Followed evidence-based diagnostic pathway (ECG first, then biomarkers)",
    "Initiated appropriate anti-ischemic therapy without delay"
  ],
  "weaknesses": [
    "Could have asked more specific chest pain characteristics (OPQRST mnemonic)",
    "Did not explicitly mention contraindications for nitroglycerin (hypotension, RV infarct)"
  ],
  "missed_findings": [
    "Did not note the significance of S4 gallop in acute MI (suggests LV dysfunction)"
  ],
  "cognitive_biases": [],
  "optimal_pathway": "Immediate ECG interpretation for STEMI, simultaneous administration of aspirin 325mg and nitroglycerin SL (if BP allows), activate cath lab if STEMI confirmed, monitor vitals closely for complications.",
  "teaching_points": [
    "Review MONA therapy (Morphine, Oxygen, Nitroglycerin, Aspirin) and contraindications - UpToDate ACS guidelines",
    "Practice door-to-balloon time targets (<90 min) - AHA/ACC STEMI protocols",
    "Study ECG interpretation for STEMI patterns and equivalents - USMLE-Rx Cardiology"
  ]
}
```

**Competency Scoring Rubric**:
- **Data Gathering (20% weight)**: History/exam collection, red flag recognition
- **Diagnosis (30% weight)**: Differential diagnosis, diagnostic test ordering
- **Management (30% weight)**: Treatment planning, safety, evidence-based care
- **Clinical Reasoning (20% weight)**: Systematic thinking, avoiding cognitive biases

**Overall Score Calculation**:
```
overall_score = (data_gathering × 0.20) + (diagnosis × 0.30) +
                (management × 0.30) + (clinical_reasoning × 0.20)
```

---

### 3. Get Scenario by ID

**Endpoint**: `GET /validation/scenarios/{scenario_id}`

**Response**: Returns full `ScenarioGenerationResponse` structure

---

### 4. Get Clinical Metrics

**Endpoint**: `GET /validation/scenarios/metrics?dateRange=30days&scenarioType=DIAGNOSIS`

**Response**:
```json
{
  "period": "30days",
  "total_scenarios": 15,
  "competency_averages": {
    "data_gathering": 78,
    "diagnosis": 72,
    "management": 75,
    "clinical_reasoning": 80
  },
  "overall_average": 76,
  "weak_competencies": [
    {
      "competency": "diagnosis",
      "average_score": 72,
      "scenarios_count": 15,
      "recommendation": "Focus on differential diagnosis generation and diagnostic test selection"
    }
  ],
  "scenario_type_distribution": {
    "DIAGNOSIS": 8,
    "MANAGEMENT": 4,
    "DIFFERENTIAL": 2,
    "COMPLICATIONS": 1
  },
  "board_exam_coverage": [
    {"topic": "Cardiology", "count": 5, "average_score": 79},
    {"topic": "Pulmonology", "count": 3, "average_score": 74}
  ]
}
```

---

## Pydantic Models

### Request Models

```python
class ScenarioGenerationRequest(BaseModel):
    objective_id: str
    objective_text: str
    board_exam_tags: list[str]  # Must start with USMLE-/COMLEX-/NBME-
    difficulty: Literal["BASIC", "INTERMEDIATE", "ADVANCED"] = "INTERMEDIATE"

class ClinicalEvaluationRequest(BaseModel):
    scenario_id: str
    user_choices: dict  # JSON of selections at each decision point
    user_reasoning: str  # Free text explanation (min 10 chars)
    time_spent: int  # Seconds (0-3600)
    case_summary: str  # Brief case description for context
```

### Response Models (instructor-validated)

```python
class CaseStructure(BaseModel):
    chief_complaint: str
    demographics: dict
    history: dict  # HPI, PMH, meds, allergies, social, family
    physical_exam: dict  # Vitals, general, system-specific exams
    labs: dict  # Available labs, imaging results, options
    questions: list[dict]  # Decision-point questions

class ScenarioGenerationResponse(BaseModel):
    scenario_id: str
    objective_id: str
    scenario_type: Literal["DIAGNOSIS", "MANAGEMENT", "DIFFERENTIAL", "COMPLICATIONS"]
    difficulty: str
    case_text: CaseStructure
    board_exam_topic: str

class CompetencyScores(BaseModel):
    data_gathering: int  # 0-100
    diagnosis: int  # 0-100
    management: int  # 0-100
    clinical_reasoning: int  # 0-100

class ClinicalEvaluationResult(BaseModel):
    overall_score: int  # 0-100, weighted
    competency_scores: CompetencyScores
    strengths: list[str]  # 2-3 bullet points
    weaknesses: list[str]  # 2-3 bullet points
    missed_findings: list[str]  # Critical findings overlooked
    cognitive_biases: list[str]  # Detected biases
    optimal_pathway: str  # Ideal approach description
    teaching_points: list[str]  # 2-4 learning resources
```

---

## Implementation Details

### Scenario Generation (`scenario_generator.py`)

```python
class ClinicalScenarioGenerator:
    def __init__(self):
        self.client = instructor.from_openai(
            OpenAI(api_key=settings.openai_api_key)
        )

    async def generate_scenario(
        self,
        objective_id: str,
        objective_text: str,
        board_exam_tags: list[str],
        difficulty: str = "INTERMEDIATE"
    ) -> ScenarioGenerationResponse:
        """
        Generate clinical scenario using instructor for structured output.

        Temperature: 0.4 (creative but consistent)
        Max tokens: 4000 (complex scenarios)
        """
        # Construct system prompt with difficulty-specific guidelines
        system_prompt = self._build_system_prompt(difficulty, board_exam_tags)

        # Use instructor for Pydantic-validated response
        response = self.client.chat.completions.create(
            model=settings.openai_model,
            response_model=ScenarioGenerationResponse,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Learning Objective: {objective_text}"}
            ],
            temperature=0.4,
            max_tokens=4000,
        )

        return response
```

### Clinical Reasoning Evaluation (`scenario_evaluator.py`)

```python
class ClinicalReasoningEvaluator:
    def __init__(self):
        self.client = instructor.from_openai(
            OpenAI(api_key=settings.openai_api_key)
        )

    async def evaluate_reasoning(
        self,
        scenario_id: str,
        user_choices: dict,
        user_reasoning: str,
        case_summary: str
    ) -> ClinicalEvaluationResult:
        """
        Evaluate clinical reasoning with competency-based scoring.

        Temperature: 0.3 (consistent scoring)
        Max tokens: 2000
        """
        # System prompt includes 4-competency rubric and bias detection
        system_prompt = self._build_evaluation_rubric()

        # Format user data for evaluation
        user_prompt = self._format_evaluation_input(
            user_choices, user_reasoning, case_summary
        )

        # Use instructor for structured evaluation
        evaluation = self.client.chat.completions.create(
            model=settings.openai_model,
            response_model=ClinicalEvaluationResult,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=2000,
        )

        return evaluation
```

---

## Testing

### Test Coverage

**16 test cases** across 6 test classes:

1. **TestClinicalScenarioGeneration**
   - Success case with valid request
   - All 3 difficulty levels (BASIC, INTERMEDIATE, ADVANCED)
   - Invalid request validation
   - Invalid difficulty validation

2. **TestClinicalReasoningEvaluation**
   - Success case with correct reasoning
   - Bias detection (anchoring, premature closure)
   - Invalid request validation

3. **TestScenarioRetrieval**
   - Successful retrieval by ID
   - Not found error handling
   - Empty ID validation

4. **TestClinicalMetrics**
   - Default parameters
   - Query parameter filtering
   - Different date ranges (7/30/90 days)

5. **TestErrorHandling**
   - Service unavailable (scenario generation)
   - Service unavailable (evaluation)

6. **TestHealthEndpoint**
   - Health check validation

### Running Tests

```bash
cd apps/api

# Run all clinical scenario tests
pytest tests/test_clinical_scenarios.py -v

# Run specific test class
pytest tests/test_clinical_scenarios.py::TestClinicalScenarioGeneration -v

# Run with coverage
pytest tests/test_clinical_scenarios.py --cov=src/validation --cov-report=html
```

**Current Status**: ✅ All 16 tests passing

---

## TypeScript Integration Guide

### Next.js API Route (Proxy Pattern)

Create TypeScript API routes that proxy to the Python service:

```typescript
// apps/web/src/app/api/validation/scenarios/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ScenarioGenerationSchema = z.object({
  objectiveId: z.string(),
  objectiveText: z.string().min(10),
  boardExamTags: z.array(z.string()),
  difficulty: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).default('INTERMEDIATE'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ScenarioGenerationSchema.parse(body);

    // Call Python FastAPI service
    const response = await fetch('http://localhost:8001/validation/scenarios/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objective_id: validated.objectiveId,
        objective_text: validated.objectiveText,
        board_exam_tags: validated.boardExamTags,
        difficulty: validated.difficulty,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Scenario generation failed');
    }

    const result = await response.json();

    // Optional: Save to database via Prisma
    // await prisma.clinicalScenario.create({ data: ... })

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scenario generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate scenario', details: error.message },
      { status: 500 }
    );
  }
}
```

### Type Safety Across Boundary

**Python → TypeScript type generation:**

```typescript
// apps/web/src/types/clinical-scenarios.ts
// Generated from Pydantic models (manual sync for MVP)

export interface CaseStructure {
  chief_complaint: string;
  demographics: {
    age: number;
    sex: string;
    occupation?: string;
  };
  history: {
    presenting: string;
    past: string;
    medications: string[];
    allergies: string;
    social: string;
    family: string;
  };
  physical_exam: {
    vitals: Record<string, string>;
    general: string;
    cardiovascular: string;
    respiratory: string;
    [key: string]: string | Record<string, string>;
  };
  labs: {
    available: boolean;
    options: string[];
  };
  questions: Array<{
    stage: string;
    prompt: string;
    options: string[];
    correctAnswer: string;
    reasoning: string;
  }>;
}

export interface ScenarioGenerationResponse {
  scenario_id: string;
  objective_id: string;
  scenario_type: 'DIAGNOSIS' | 'MANAGEMENT' | 'DIFFERENTIAL' | 'COMPLICATIONS';
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  case_text: CaseStructure;
  board_exam_topic: string;
}

export interface CompetencyScores {
  data_gathering: number;
  diagnosis: number;
  management: number;
  clinical_reasoning: number;
}

export interface ClinicalEvaluationResult {
  overall_score: number;
  competency_scores: CompetencyScores;
  strengths: string[];
  weaknesses: string[];
  missed_findings: string[];
  cognitive_biases: string[];
  optimal_pathway: string;
  teaching_points: string[];
}
```

---

## Running the Python Service

### Development Mode

```bash
cd apps/api

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Run on port 8001 (Epic 4 worktree)
uvicorn main:app --reload --port 8001 --host 0.0.0.0

# Or use the main.py directly
python main.py
```

### Environment Variables

Create `.env` file in `apps/api/`:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4  # or gpt-5 when available

# API Configuration
API_HOST=0.0.0.0
API_PORT=8001
ENVIRONMENT=development
LOG_LEVEL=info

# CORS Configuration (for Next.js integration)
CORS_ORIGINS=["http://localhost:3001"]
```

### Health Check

```bash
curl http://localhost:8001/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "americano-validation-api",
#   "version": "1.0.0"
# }
```

### Interactive API Docs

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

---

## Cognitive Biases Detected

The evaluator can detect these cognitive biases:

1. **Anchoring**: Fixating on initial impression despite contradictory data
2. **Premature Closure**: Stopping diagnostic workup before confirming diagnosis
3. **Availability Bias**: Diagnosing based on recent cases, not clinical evidence
4. **Confirmation Bias**: Seeking data that confirms hypothesis, ignoring alternatives
5. **Zebra Hunting**: Overdiagnosing rare conditions when common ones fit better
6. **Sutton's Law Violation**: Not going for most likely diagnosis first

---

## Performance Considerations

### Response Times (Target)

- **Scenario Generation**: < 5 seconds (4000 max tokens, complex prompt)
- **Clinical Evaluation**: < 3 seconds (2000 max tokens, structured rubric)
- **Metrics Retrieval**: < 200ms (database query, TypeScript handles this)

### Caching Strategy

- **Scenario Generation**: Cache generated scenarios for 30 days (avoid regenerating same objective)
- **Evaluation**: No caching (each evaluation is unique)

### Error Handling

- **OpenAI API errors**: Retry once with exponential backoff
- **Validation errors**: Return 400 with detailed error messages
- **Server errors**: Return 500 with generic message (detailed in logs for dev mode)

---

## Future Enhancements

### Story 4.3+
- Add scipy for statistical pattern detection
- Implement failure pattern clustering (scikit-learn)
- Add IRT (Item Response Theory) analysis for difficulty calibration

### Production Readiness
- Add Redis caching for frequently requested scenarios
- Implement rate limiting per user
- Add database persistence (currently in-memory mock)
- Set up monitoring with Prometheus/Grafana
- Add structured logging with correlation IDs

---

## File Structure

```
apps/api/
├── main.py                           # FastAPI application entry point
├── requirements.txt                  # Python dependencies
├── pytest.ini                        # Pytest configuration
├── .env                              # Environment variables
├── src/
│   ├── __init__.py
│   ├── config.py                     # Settings (Pydantic BaseSettings)
│   └── validation/
│       ├── __init__.py
│       ├── models.py                 # Pydantic request/response models
│       ├── routes.py                 # FastAPI endpoints
│       ├── evaluator.py              # Story 4.1: Comprehension evaluator
│       ├── scenario_generator.py     # Story 4.2: Scenario generator
│       └── scenario_evaluator.py     # Story 4.2: Reasoning evaluator
└── tests/
    ├── __init__.py
    ├── test_validation.py            # Story 4.1 tests
    └── test_clinical_scenarios.py    # Story 4.2 tests (16 tests)
```

---

## Key Dependencies

```
fastapi==0.115.0              # Web framework
uvicorn[standard]==0.32.0     # ASGI server
pydantic==2.10.0              # Data validation
instructor==1.8.0             # Structured LLM outputs
openai==1.58.0                # OpenAI SDK
pytest==8.3.4                 # Testing
pytest-asyncio==0.24.0        # Async test support
httpx==0.28.1                 # HTTP client for tests
```

---

## Summary

✅ **All Story 4.2 Python components are fully implemented and tested:**

1. **Scenario Generator**: Generates USMLE/COMLEX clinical cases with instructor + Pydantic
2. **Reasoning Evaluator**: Evaluates clinical decision-making across 4 competencies
3. **FastAPI Endpoints**: 4 endpoints for scenario lifecycle (generate, evaluate, retrieve, metrics)
4. **Comprehensive Tests**: 16 tests covering all functionality with 100% pass rate
5. **Documentation**: Complete API documentation with examples and integration guide

**Next Steps**: TypeScript team can now implement UI components that call these Python endpoints via Next.js API route proxies (as shown in TypeScript Integration Guide section).

---

**Generated by**: Python FastAPI Pro Agent
**Date**: 2025-10-17
**Story**: 4.2 - Clinical Reasoning Scenario Assessment
