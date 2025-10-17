# Story 4.2: Clinical Reasoning Scenarios - Quick Start Guide

**Python FastAPI Service** | **Status**: ✅ Ready for Integration

---

## 🚀 Quick Start (30 seconds)

```bash
# 1. Navigate to Python service
cd apps/api

# 2. Activate virtual environment
source venv/bin/activate

# 3. Start the service (Epic 4 uses port 8001)
uvicorn main:app --reload --port 8001 --host 0.0.0.0
```

**Server running at**: http://localhost:8001

**Interactive docs**: http://localhost:8001/docs

---

## 📋 What's Implemented

Story 4.2 adds **4 new endpoints** for clinical reasoning scenarios:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/validation/scenarios/generate` | POST | Generate clinical case from objective |
| `/validation/scenarios/evaluate` | POST | Evaluate clinical reasoning |
| `/validation/scenarios/{id}` | GET | Retrieve scenario by ID |
| `/validation/scenarios/metrics` | GET | Performance analytics |

---

## 🧪 Test the Service

### 1. Health Check

```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "americano-validation-api",
  "version": "1.0.0"
}
```

### 2. Run Test Suite

```bash
pytest tests/test_clinical_scenarios.py -v
```

Expected: **16/16 tests passing**

### 3. Run Demo Script

```bash
python test_story_4.2_demo.py
```

Shows end-to-end scenario generation + evaluation.

---

## 📝 Example API Calls

### Generate Clinical Scenario

```bash
curl -X POST http://localhost:8001/validation/scenarios/generate \
  -H "Content-Type: application/json" \
  -d '{
    "objective_id": "obj_123",
    "objective_text": "Understand acute myocardial infarction management",
    "board_exam_tags": ["USMLE-Step2-Cardiology"],
    "difficulty": "INTERMEDIATE"
  }'
```

### Evaluate Clinical Reasoning

```bash
curl -X POST http://localhost:8001/validation/scenarios/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_id": "scenario_abc123",
    "user_choices": {"initial": "Order ECG"},
    "user_reasoning": "Patient has classic ACS symptoms...",
    "time_spent": 300,
    "case_summary": "65M with chest pain"
  }'
```

---

## 🎯 Key Features

### Scenario Generation
- **USMLE/COMLEX format** clinical cases
- **3 difficulty levels**: BASIC, INTERMEDIATE, ADVANCED
- **Multi-stage**: Chief Complaint → History → Exam → Labs → Questions
- **Board exam aligned**: Maps to USMLE/COMLEX topics

### Clinical Evaluation
- **4-competency scoring**: Data (20%), Diagnosis (30%), Management (30%), Reasoning (20%)
- **Cognitive bias detection**: Anchoring, premature closure, confirmation bias, etc.
- **Personalized feedback**: Strengths, weaknesses, teaching points
- **Weighted scoring**: overall_score = Σ(competency × weight)

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `STORY-4.2-IMPLEMENTATION.md` | Original implementation guide (22KB) |
| `STORY-4.2-PYTHON-SERVICE-VERIFICATION.md` | Comprehensive verification (25KB) |
| `STORY-4.2-PYTHON-COMPLETION-SUMMARY.md` | Handoff summary for TypeScript team |
| `test_story_4.2_demo.py` | Interactive demo script |

---

## 🔗 TypeScript Integration

### Next.js API Route (Proxy Pattern)

```typescript
// apps/web/src/app/api/validation/scenarios/generate/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Call Python FastAPI service
  const response = await fetch('http://localhost:8001/validation/scenarios/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      objective_id: body.objectiveId,
      objective_text: body.objectiveText,
      board_exam_tags: body.boardExamTags,
      difficulty: body.difficulty,
    }),
  });

  const result = await response.json();
  return NextResponse.json(result);
}
```

### TypeScript Types

```typescript
// apps/web/src/types/clinical-scenarios.ts
export interface ScenarioGenerationResponse {
  scenario_id: string;
  objective_id: string;
  scenario_type: 'DIAGNOSIS' | 'MANAGEMENT' | 'DIFFERENTIAL' | 'COMPLICATIONS';
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  case_text: CaseStructure;
  board_exam_topic: string;
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

## 🧩 File Structure

```
apps/api/
├── src/validation/
│   ├── scenario_generator.py     ✅ Generates clinical cases
│   ├── scenario_evaluator.py     ✅ Evaluates reasoning
│   ├── models.py                  ✅ Pydantic models
│   └── routes.py                  ✅ FastAPI endpoints
├── tests/
│   └── test_clinical_scenarios.py ✅ 16 tests (all passing)
├── test_story_4.2_demo.py         ✅ Demo script
└── main.py                        ✅ FastAPI app entry point
```

---

## ✅ Verification Checklist

- [x] FastAPI app starts without errors
- [x] 4 Story 4.2 endpoints registered
- [x] 16 tests passing (100%)
- [x] Health check endpoint working
- [x] CORS configured for Next.js
- [x] Interactive docs available
- [x] Demo script functional
- [x] Documentation complete

---

## 🤝 Handoff to TypeScript Team

**Status**: ✅ Ready for integration

**Next Steps**:
1. Create Next.js API routes (proxy to Python service)
2. Build UI components (ClinicalCaseDialog, FeedbackPanel)
3. Integrate with Prisma (save scenarios, responses, metrics)
4. Add session orchestration (trigger at INTERMEDIATE mastery)

**Python Service**: Operational on port 8001

**All questions?** See comprehensive docs in `STORY-4.2-PYTHON-SERVICE-VERIFICATION.md`

---

**Generated by**: FastAPI Pro Agent
**Date**: 2025-10-17
