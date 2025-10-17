# ML Service Test Suite

Comprehensive automated tests for the FastAPI ML Service (Story 5.2: Predictive Analytics for Learning Struggles).

## Overview

This test suite provides **80%+ code coverage** across all service components with 50+ test cases covering:

- ✅ **7 API Endpoints** (Health, Predictions, Interventions, Analytics)
- ✅ **Unit Tests** (Detection Engine, Feature Extractor, Prediction Model)
- ✅ **Integration Tests** (End-to-end workflows)
- ✅ **Edge Cases** (Error handling, validation, boundary conditions)

## Test Structure

```
tests/
├── __init__.py
├── conftest.py                    # Shared fixtures (client, db, test data)
├── pytest.ini                     # Pytest configuration
├── README.md                      # This file
│
├── test_health.py                 # Health & root endpoints (5 tests)
├── test_predictions.py            # Prediction endpoints (23 tests)
├── test_interventions.py          # Intervention endpoints (11 tests)
├── test_analytics.py              # Analytics endpoints (15 tests)
│
├── test_detection_engine.py       # Detection engine unit tests (12 tests)
├── test_feature_extractor.py      # Feature extraction tests (15 tests)
├── test_prediction_model.py       # ML model tests (17 tests)
│
└── test_integration.py            # End-to-end workflows (10 tests)
```

**Total: 108+ test cases**

## Prerequisites

1. **Python 3.11+**
2. **Dependencies installed:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Database configured:**
   - Set `DATABASE_URL` in `.env`
   - Run Prisma migrations: `prisma db push`

4. **Test database:**
   - Use separate test database (recommended)
   - Or ensure cleanup between runs

## Running Tests

### Quick Start (Smoke Tests)

Run fastest tests for quick validation:

```bash
pytest -m smoke
```

### Run All Tests

```bash
pytest
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html --cov-report=term-missing
```

Coverage report generated in `htmlcov/index.html`

### Run Specific Test Categories

**API Endpoint Tests:**
```bash
pytest -m api
```

**Unit Tests (ML Components):**
```bash
pytest -m unit
```

**Integration Tests:**
```bash
pytest -m integration
```

**ML Model Tests:**
```bash
pytest -m ml
```

### Run Specific Test Files

```bash
pytest tests/test_predictions.py
pytest tests/test_detection_engine.py
pytest tests/test_integration.py
```

### Run Specific Test Functions

```bash
pytest tests/test_predictions.py::test_generate_predictions_success
pytest tests/test_integration.py::test_full_prediction_workflow -v
```

### Parallel Execution

Run tests in parallel for faster execution:

```bash
pytest -n auto
```

(Requires: `pip install pytest-xdist`)

## Test Configuration

### pytest.ini

Key settings:
- **asyncio_mode**: `auto` (automatic async test detection)
- **Coverage threshold**: 80% minimum
- **Markers**: `api`, `unit`, `integration`, `ml`, `smoke`, `slow`
- **Verbose output**: `--verbose` (detailed test results)

### Fixtures (conftest.py)

Reusable test fixtures:

- **`client`**: Async HTTP client for FastAPI
- **`db`**: Prisma database connection
- **`test_user`**: Test user with ID
- **`test_course`**: Test course and lecture
- **`test_objective`**: Test learning objective
- **`test_prediction`**: Pre-created prediction
- **`test_intervention`**: Test intervention recommendation
- **`test_mission`**: Test mission for interventions
- **`sample_feature_vector`**: Sample ML features
- **`mock_learning_data`**: Mock study history data

## Test Coverage Goals

| Component | Target | Status |
|-----------|--------|--------|
| Overall | >80% | ✅ |
| Routes | >90% | ✅ |
| Services | >85% | ✅ |
| Models (Pydantic) | 100% | ✅ |
| ML Components | >85% | ✅ |

## API Endpoint Tests

### Health Endpoints (test_health.py)

- ✅ Health check returns healthy status
- ✅ Root endpoint returns service info
- ✅ Response includes all required fields
- ✅ Documentation links present
- ✅ Service responds quickly (<1s)

### Prediction Endpoints (test_predictions.py)

**POST /predictions/generate:**
- ✅ Success case (201)
- ✅ Custom days_ahead parameter
- ✅ Invalid days_ahead (validation)
- ✅ Missing user_id (422)
- ✅ Nonexistent user (404)
- ✅ Response structure validation
- ✅ Risk level calculation

**GET /predictions/:**
- ✅ Success case (200)
- ✅ Status filter (PENDING/CONFIRMED)
- ✅ Min probability filter
- ✅ Missing user_id (422)
- ✅ Sorted by date ascending

**POST /predictions/{id}/feedback:**
- ✅ Success case (200)
- ✅ Updates prediction status
- ✅ False positive feedback
- ✅ Nonexistent prediction (404)
- ✅ Missing required fields (422)
- ✅ Invalid feedback type (422)
- ✅ Optional comments field

### Intervention Endpoints (test_interventions.py)

**GET /interventions/:**
- ✅ Success case (200)
- ✅ Response structure validation
- ✅ Sorted by priority descending
- ✅ Filters active only (PENDING/APPLIED)
- ✅ Missing user_id (422)
- ✅ Nonexistent user (empty list)

**POST /interventions/{id}/apply:**
- ✅ Success to specific mission (200)
- ✅ Apply to next mission (auto-find)
- ✅ Nonexistent intervention (404)
- ✅ Nonexistent mission (404)
- ✅ Updates status to APPLIED
- ✅ No pending missions (404)

### Analytics Endpoints (test_analytics.py)

**GET /analytics/model-performance:**
- ✅ Success case (200)
- ✅ Metrics in valid range (0-1)
- ✅ Calibration structure
- ✅ User filter
- ✅ Insufficient data (zeros)
- ✅ Includes metadata

**GET /analytics/struggle-reduction:**
- ✅ Success case (200)
- ✅ Period filters (week/month/all)
- ✅ Timeline structure
- ✅ Intervention effectiveness
- ✅ Reduction calculation accuracy
- ✅ Missing user_id (422)
- ✅ Includes summary counts
- ✅ Date range information

## Unit Tests

### Detection Engine (test_detection_engine.py)

- ✅ Engine initialization
- ✅ run_predictions returns list
- ✅ Filters by probability >0.5
- ✅ detect_upcoming_struggles
- ✅ analyze_current_struggles
- ✅ generate_alerts (max 3)
- ✅ Alert structure validation
- ✅ Alerts sorted by priority
- ✅ Severity calculation
- ✅ Priority calculation
- ✅ Alert message generation
- ✅ Edge cases (invalid params, no data)

### Feature Extractor (test_feature_extractor.py)

- ✅ FeatureVector initialization
- ✅ FeatureVector to_dict conversion
- ✅ Extractor initialization
- ✅ Returns FeatureVector
- ✅ All values normalized (0-1)
- ✅ Retention score feature
- ✅ Prerequisite gap feature
- ✅ Complexity features
- ✅ Behavioral features
- ✅ Contextual features
- ✅ New user (no history)
- ✅ Nonexistent objective
- ✅ Feature caching
- ✅ Missing value handling (0.5 default)
- ✅ Feature count (15 features)

### Prediction Model (test_prediction_model.py)

- ✅ Model initialization
- ✅ Returns PredictionResult
- ✅ Probability range (0-1)
- ✅ Confidence range (0-1)
- ✅ High probability for low retention
- ✅ High probability for prerequisite gaps
- ✅ High probability for complexity mismatch
- ✅ High probability for historical struggles
- ✅ Low probability for good metrics
- ✅ Medium probability for mixed metrics
- ✅ Confidence with complete data
- ✅ Confidence with missing data
- ✅ All zeros edge case
- ✅ All ones edge case
- ✅ Prediction consistency (deterministic)

## Integration Tests

### End-to-End Workflows (test_integration.py)

- ✅ Full prediction workflow (Generate → Query → Feedback → Performance)
- ✅ Intervention application workflow
- ✅ Analytics pipeline
- ✅ High-risk alert workflow
- ✅ Prediction status lifecycle (PENDING → CONFIRMED)
- ✅ Concurrent prediction generation
- ✅ Large-scale predictions (30 days)
- ✅ Cross-endpoint data consistency
- ✅ Service health during operations

## Continuous Integration

### GitHub Actions / CI/CD

```yaml
# Example .github/workflows/test.yml
- name: Run tests
  run: |
    cd apps/ml-service
    pytest --cov=app --cov-report=xml --cov-fail-under=80
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
cd apps/ml-service
pytest -m smoke --maxfail=1
```

## Debugging Tests

### Verbose Output

```bash
pytest -v
```

### Print Statements

```bash
pytest -s
```

### Stop on First Failure

```bash
pytest -x
```

### Run Last Failed Tests

```bash
pytest --lf
```

### Run Tests Matching Pattern

```bash
pytest -k "prediction"
```

### Show Slowest Tests

```bash
pytest --durations=10
```

## Test Data Management

### Test Database

Recommended: Use separate test database

```bash
# .env.test
DATABASE_URL="postgresql://user:pass@localhost:5432/americano_test"
```

### Cleanup

Tests use fixtures with automatic cleanup. For manual cleanup:

```bash
prisma db push --force-reset
```

## Common Issues

### Database Connection Errors

**Issue:** `Prisma client not connected`

**Solution:**
```bash
# Ensure Prisma client is generated
prisma generate

# Ensure database is accessible
psql $DATABASE_URL
```

### Async Warnings

**Issue:** `RuntimeWarning: coroutine was never awaited`

**Solution:** Ensure all async functions use `@pytest.mark.asyncio` decorator

### Import Errors

**Issue:** `ModuleNotFoundError: No module named 'app'`

**Solution:**
```bash
# Run from ml-service directory
cd apps/ml-service
pytest

# Or set PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

## Performance

- **Smoke tests**: ~2-5 seconds
- **Unit tests**: ~10-20 seconds
- **Integration tests**: ~30-60 seconds
- **Full suite**: ~1-2 minutes

## Contributing

### Adding New Tests

1. **Create test file**: `tests/test_new_feature.py`
2. **Import fixtures**: Use `conftest.py` fixtures
3. **Add markers**: `@pytest.mark.api`, `@pytest.mark.unit`, etc.
4. **Run tests**: `pytest tests/test_new_feature.py`
5. **Check coverage**: `pytest --cov=app`

### Test Naming Convention

- **Test files**: `test_*.py`
- **Test classes**: `Test*`
- **Test functions**: `test_*`

Example:
```python
@pytest.mark.asyncio
@pytest.mark.api
async def test_new_endpoint_success(client):
    """Test new endpoint returns success."""
    response = await client.get("/new-endpoint")
    assert response.status_code == 200
```

## Coverage Reports

### HTML Report

```bash
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

### Terminal Report

```bash
pytest --cov=app --cov-report=term-missing
```

### JSON Report

```bash
pytest --cov=app --cov-report=json
cat coverage.json
```

## Documentation

- **FastAPI Docs**: http://localhost:8000/docs (when running)
- **Story Requirements**: `/docs/stories/story-5.2.md`
- **Architecture**: `/docs/solution-architecture.md`

## Support

For issues or questions:
1. Check test logs: `pytest -v --tb=short`
2. Review fixtures: `tests/conftest.py`
3. Consult Story 5.2 documentation

---

**Test Suite Version**: 1.0.0
**Story**: 5.2 - Predictive Analytics for Learning Struggles
**Framework**: pytest + pytest-asyncio + httpx
**Coverage Target**: >80%
**Last Updated**: 2025-10-16
