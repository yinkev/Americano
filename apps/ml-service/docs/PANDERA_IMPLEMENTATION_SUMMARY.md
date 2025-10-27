# Pandera Schema Implementation Summary

**ADR-006: Research Analytics Infrastructure - Task 2.1**
**Date:** 2025-10-26
**Status:** ✅ Complete

## What Was Delivered

### 1. Documentation (3 files)

| Document | Purpose | Audience |
|----------|---------|----------|
| `PANDERA_SCHEMA_GUIDE.md` | Complete implementation guide with code examples | Developers (future team) |
| `PANDERA_QUICK_ANSWERS.md` | Direct answers to 6 implementation questions | You (immediate use) |
| `PANDERA_IMPLEMENTATION_SUMMARY.md` | This file - what was delivered | Reference |

### 2. Implementation Files (6 files)

```
apps/ml-service/
├── app/schemas/
│   ├── __init__.py              # ✅ Exports all schemas
│   ├── enums.py                 # ✅ Prisma enum definitions
│   └── behavioral_events.py     # ✅ BehavioralEvent schema
└── tests/schemas/
    ├── __init__.py              # ✅ Test package
    └── test_enums.py            # ✅ Enum synchronization tests
```

### 3. Tested & Verified

```bash
✅ Enums import successfully
   - EventType: 13 values
   - CompletionQuality: 3 values
   - EngagementLevel: 3 values

✅ Schema structure validated
✅ Python 3.13 compatibility confirmed
```

---

## Quick Start (Copy-Paste Ready)

### Test Imports

```bash
cd /Users/kyin/Projects/Americano/apps/ml-service

python -c "
from app.schemas import BehavioralEventSchema, EventType
print(f'✅ Schema imported: {BehavioralEventSchema.__name__}')
print(f'✅ Enums available: {len(EventType.values())} event types')
"
```

### Run Tests

```bash
pytest tests/schemas/test_enums.py -v
```

### Validate Real Data (Once You Have Parquet File)

```bash
# Export data first
python scripts/export_behavioral_events.py --days 30

# Validate export
python -c "
import pandas as pd
from app.schemas import validate_behavioral_events

df = pd.read_parquet('data/raw/behavioral_events_latest.parquet')
validated = validate_behavioral_events(df, strict=True)
print(f'✅ Validated {len(validated)} rows')
"
```

---

## Answers to Your 6 Questions

### Q1: Schema Organization?
**A:** One file per table (`behavioral_events.py`) + centralized enums (`enums.py`)

### Q2: Validation Rules Priority?
**A:**
- **P0:** Required fields (id, userId, eventType, timestamp) with CUID regex
- **P1:** Range checks (dayOfWeek 0-6, timeOfDay 0-23, sessionPerformanceScore 0-100)
- **P2:** Optional enum fields (completionQuality, engagementLevel)

### Q3: Enum Synchronization?
**A:** Manual copy for MVP (update `enums.py` when Prisma schema changes)

### Q4: Cross-Column Validation?
**A:** Yes, add 2 rules:
1. `experimentPhase` → requires `contextMetadataId`
2. `completionQuality` → only for completion events

### Q5: Error Handling?
**A:** 3 modes available:
- **Strict** (production): Fail entire DataFrame on any error
- **Permissive** (dev): Drop invalid rows, log warnings
- **Lazy** (debug): Collect all errors, then decide

### Q6: JSON Field Validation?
**A:** Type check only (dict or JSON string), skip content validation for MVP

---

## Key Design Decisions

### 1. Enum Order Fixed for Python 3.13

**Issue:** Python 3.13 requires specific enum inheritance order
**Solution:** `class EventType(PrismaEnum, str, Enum)` (mixin first)

### 2. Validation Strictness

**Default:** Strict mode (fail-fast)
**Rationale:** Catch data quality issues before they corrupt research results

### 3. JSON Field Handling

**Approach:** Structural validation only (type check)
**Rationale:** Balance validation rigor with schema flexibility

---

## File Structure

```
apps/ml-service/
├── app/schemas/
│   ├── __init__.py                 # Central exports
│   ├── enums.py                    # Prisma enum definitions
│   │   ├── EventType (13 values)
│   │   ├── CompletionQuality (3)
│   │   └── EngagementLevel (3)
│   └── behavioral_events.py        # BehavioralEvent schema
│       ├── BehavioralEventSchema   # Main schema class
│       ├── validate_behavioral_events()
│       └── validate_with_report()
├── tests/schemas/
│   ├── __init__.py
│   └── test_enums.py               # Enum synchronization tests
└── docs/
    ├── PANDERA_SCHEMA_GUIDE.md     # Complete guide (20+ pages)
    ├── PANDERA_QUICK_ANSWERS.md    # Quick reference (5 pages)
    └── PANDERA_IMPLEMENTATION_SUMMARY.md  # This file
```

---

## Schema Highlights

### Required Fields (P0)

```python
id: Series[str] = pa.Field(str_matches=r"^c[a-z0-9]{24}$")  # CUID
userId: Series[str] = pa.Field(str_matches=r"^c[a-z0-9]{24}$")
eventType: Series[str] = pa.Field(isin=EventType.values())
timestamp: Series[pd.Timestamp] = pa.Field(nullable=False)
```

### Optional Fields with Validation (P1)

```python
dayOfWeek: Optional[Series[int]] = pa.Field(ge=0, le=6)
timeOfDay: Optional[Series[int]] = pa.Field(ge=0, le=23)
sessionPerformanceScore: Optional[Series[int]] = pa.Field(ge=0, le=100)
```

### Custom Checks

```python
@pa.check("timestamp")
def timestamp_not_in_future(cls, timestamp):
    return timestamp <= pd.Timestamp.now()

@pa.dataframe_check
def experiment_phase_validation(cls, df):
    """If experimentPhase set, contextMetadataId must be set."""
    has_phase = df["experimentPhase"].notna()
    has_metadata = df["contextMetadataId"].notna()
    return ~has_phase | has_metadata
```

---

## Next Steps (Your Action Items)

### Immediate (Today)

1. ✅ Review `PANDERA_QUICK_ANSWERS.md` (your 6 questions answered)
2. ✅ Test imports: `python -c "from app.schemas import BehavioralEventSchema"`
3. ✅ Run enum tests: `pytest tests/schemas/test_enums.py -v`

### Short-Term (This Week)

4. ⏳ Export real data: `python scripts/export_behavioral_events.py --days 30`
5. ⏳ Validate export: Use `validate_behavioral_events()` function
6. ⏳ Write 5-10 more tests in `tests/schemas/test_behavioral_events.py`
   - Use examples from `PANDERA_SCHEMA_GUIDE.md` Section 7

### Medium-Term (Next Sprint)

7. ⏳ Add validation to export script:
   ```python
   # In export_behavioral_events.py, before writing Parquet
   from app.schemas import validate_behavioral_events
   validated_df = validate_behavioral_events(df, strict=True)
   validated_df.to_parquet(output_path, ...)
   ```

8. ⏳ Integrate with DVC pipeline (see guide Section 7, Example 2)

9. ⏳ Create validation script for daily use:
   ```bash
   python scripts/validate_export.py data/raw/behavioral_events_latest.parquet
   ```

---

## Code Examples

### Basic Validation

```python
import pandas as pd
from app.schemas import validate_behavioral_events

# Load Parquet file
df = pd.read_parquet("data/raw/behavioral_events_latest.parquet")

# Strict validation (production)
validated = validate_behavioral_events(df, strict=True)
print(f"✅ {len(validated)} valid rows")
```

### Permissive Validation (Development)

```python
from app.schemas.behavioral_events import validate_with_report

df = pd.read_parquet("data/raw/behavioral_events_latest.parquet")

validated, report = validate_with_report(df)

print(f"Total: {report['total_rows']}")
print(f"Valid: {report['valid_rows']}")
print(f"Invalid: {report['invalid_rows']}")

if report['errors']:
    print("\n❌ Errors found:")
    for error in report['errors'][:5]:  # First 5 errors
        print(f"  - {error['column']}: {error['message']}")
```

### Enum Usage

```python
from app.schemas.enums import EventType, CompletionQuality

# Get all event types for validation
event_types = EventType.values()  # Returns list of strings

# Use in Python code
if event_type == EventType.MISSION_COMPLETED.value:
    print("Mission completed!")

# Check enum membership
if "CARD_REVIEWED" in EventType.values():
    print("Valid event type")
```

---

## Testing Strategy

### 1. Enum Tests (`test_enums.py`)

- ✅ Enum values match Prisma schema
- ✅ `.values()` returns list
- ✅ All values are strings

### 2. Schema Tests (TODO: `test_behavioral_events.py`)

```python
# Test cases to add (see PANDERA_SCHEMA_GUIDE.md Section 7)
- test_valid_event_passes_validation()
- test_invalid_cuid_fails()
- test_invalid_enum_fails()
- test_day_of_week_range()
- test_time_of_day_range()
- test_future_timestamp_fails()
- test_optional_fields_can_be_null()
- test_permissive_mode_drops_invalid_rows()
```

### 3. Integration Tests (TODO)

```python
# Test with real exported data
def test_validate_real_export():
    df = pd.read_parquet("data/raw/behavioral_events_latest.parquet")
    validated = validate_behavioral_events(df, strict=False)
    assert len(validated) > 0
```

---

## Known Limitations & Future Work

### Current Limitations

1. **JSON Field Validation:** Only type check (dict/string), not content
2. **Enum Sync:** Manual copy from Prisma schema (not automated)
3. **Cross-Column Rules:** Only 2 rules (can add more as needed)

### Future Enhancements

1. **Automated Enum Generation:**
   ```bash
   python scripts/sync_prisma_enums.py  # Generate from schema
   ```

2. **Full Test Suite:**
   - 50+ test cases covering all validation rules
   - Property-based testing with Hypothesis

3. **DVC Integration:**
   ```yaml
   # dvc.yaml
   stages:
     validate:
       cmd: python scripts/validate_export.py
       deps: [data/raw/behavioral_events_latest.parquet]
   ```

4. **Additional Schemas:**
   - `struggle_predictions.py`
   - `performance_metrics.py`
   - `user_learning_profiles.py`

---

## Troubleshooting

### Import Errors

```bash
# If you see "ModuleNotFoundError: No module named 'app.schemas'"
# Make sure you're in ml-service directory:
cd /Users/kyin/Projects/Americano/apps/ml-service

# Test imports
python -c "from app.schemas import BehavioralEventSchema"
```

### Validation Failures

```python
# Use permissive mode to debug
from app.schemas.behavioral_events import validate_with_report

validated, report = validate_with_report(df)

# Inspect errors
for error in report['errors']:
    print(f"Column: {error['column']}")
    print(f"Check: {error['check']}")
    print(f"Failed at index: {error['index']}")
    print(f"Value: {error['failure_case']}\n")
```

### Enum Sync Issues

```python
# Test if enum values match Prisma
pytest tests/schemas/test_enums.py -v

# If test fails, manually update app/schemas/enums.py
# Compare with prisma/schema.prisma
```

---

## Documentation Reference

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **PANDERA_QUICK_ANSWERS.md** | 6 questions answered directly | First (5 min read) |
| **PANDERA_SCHEMA_GUIDE.md** | Complete implementation guide | When implementing (30 min) |
| **PANDERA_IMPLEMENTATION_SUMMARY.md** | What was delivered + quick start | Reference (10 min) |

---

## Success Criteria

✅ **Complete:**
- Enums defined and tested
- BehavioralEvent schema implemented
- Validation functions created
- Documentation written
- Imports verified

⏳ **TODO (Your Next Steps):**
- Export real data and validate
- Add 5-10 more tests
- Integrate with export script

---

## Contact & Support

**Questions?**
- Read `PANDERA_QUICK_ANSWERS.md` first (answers your 6 questions)
- Check `PANDERA_SCHEMA_GUIDE.md` Section 7 for usage examples
- Review this file for troubleshooting

**Code Location:**
- Schemas: `/Users/kyin/Projects/Americano/apps/ml-service/app/schemas/`
- Tests: `/Users/kyin/Projects/Americano/apps/ml-service/tests/schemas/`
- Docs: `/Users/kyin/Projects/Americano/apps/ml-service/docs/`

---

**Status:** Ready for use
**Next Action:** Read `PANDERA_QUICK_ANSWERS.md` and test with real data
