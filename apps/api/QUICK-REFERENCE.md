# Story 4.1: Quick Reference Card

**Python FastAPI Service - Epic 4 Understanding Validation**

---

## 🚀 Quick Start

```bash
# Start Python service (port 8001)
cd /Users/kyin/Projects/Americano-epic4/apps/api
source venv/bin/activate
uvicorn main:app --reload --port 8001

# Start Next.js (port 3001)
cd /Users/kyin/Projects/Americano-epic4/apps/web
PORT=3001 npm run dev
```

---

## 🔗 API Endpoints

**Base URL:** `http://localhost:8001`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/validation/generate-prompt` | POST | Generate prompt |
| `/validation/evaluate` | POST | Evaluate answer |
| `/docs` | GET | Swagger UI |

---

## 📝 Example Requests

### Generate Prompt

```bash
curl -X POST http://localhost:8001/validation/generate-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "objective_id": "obj_123",
    "objective_text": "Explain the cardiac conduction system"
  }'
```

**Response:**
```json
{
  "prompt_text": "Explain the cardiac conduction system as if...",
  "prompt_type": "Direct Question",
  "expected_criteria": ["SA node", "AV node", ...]
}
```

### Evaluate Answer

```bash
curl -X POST http://localhost:8001/validation/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_id": "prompt_456",
    "user_answer": "The cardiac conduction system...",
    "confidence_level": 4,
    "objective_text": "Explain the cardiac conduction system"
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
  "strengths": ["...", "..."],
  "gaps": ["...", "..."],
  "calibration_delta": -10.0,
  "calibration_note": "Your understanding is stronger than you think!"
}
```

---

## 🧪 Testing

```bash
# Run integration tests
python test_story_4_1_endpoints.py

# Run unit tests
pytest tests/test_validation.py -v
```

---

## 📊 Scoring Rubric

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Terminology | 20% | Medical terms used correctly |
| Relationships | 30% | Concept connections |
| Application | 30% | Clinical scenarios |
| Clarity | 20% | Patient-friendly language |

**Formula:** `(T*0.20) + (R*0.30) + (A*0.30) + (C*0.20)`

---

## 📈 Calibration

```
confidence_normalized = (confidence_level - 1) * 25
calibration_delta = confidence_normalized - score

- delta > 15: Overconfident
- delta < -15: Underconfident
- else: Calibrated
```

---

## 🎯 Prompt Templates

1. **Direct Question** (33%)
   - "Explain [concept] as if teaching a patient..."

2. **Clinical Scenario** (33%)
   - "A patient asks you about [concept]..."

3. **Teaching Simulation** (33%)
   - "You are teaching nursing students about [concept]..."

---

## 🔧 Configuration

**Port:** 8001 (Epic 4)
**CORS:** http://localhost:3001
**Model:** gpt-4 (ChatMock)
**Temperature:** 0.3

---

## 📚 Documentation

- **API Reference:** `STORY-4.1-API-REFERENCE.md`
- **Setup Guide:** `STORY-4.1-SETUP-GUIDE.md`
- **Completion:** `STORY-4.1-PYTHON-COMPLETION.md`
- **Swagger UI:** http://localhost:8001/docs

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | `kill -9 $(lsof -ti:8001)` |
| Module not found | `pip install -r requirements.txt` |
| CORS error | Check `.env` has port 3001 |
| API key error | Use `sk-chatmock-test-key` for testing |

---

## ✅ Status

**Python Backend:** ✅ Complete (6/6 tasks)
**TypeScript UI:** 🔄 Next agent
**Database:** 🔄 Next agent

---

**Last Updated:** 2025-10-17
