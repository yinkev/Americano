# Pandera Schema Quick Answers

**ADR-006: Research Analytics Infrastructure - Task 2.1**
**Date:** 2025-10-26

## Your 6 Questions Answered

### 1. Schema Structure: How should I organize Pandera schemas?

**Answer: One file per table with centralized enums**

```
apps/ml-service/app/schemas/
├── __init__.py                  # Exports
├── enums.py                     # Shared Prisma enums
├── behavioral_events.py         # BehavioralEvent schema
└── struggle_predictions.py      # StrugglePrediction schema (future)
```

**Rationale:**
- One schema per table keeps code focused and maintainable
- Separate `enums.py` avoids duplication across schemas
- Easy imports: `from app.schemas import BehavioralEventSchema`

---

### 2. Column Validation: What rules should I prioritize for BehavioralEvent?

**Answer: Start with required fields + range checks**

| Priority | Field | Validation Rule |
|----------|-------|-----------------|
| **P0** | `id`, `userId` | CUID regex `^c[a-z0-9]{24}$` |
| **P0** | `eventType` | Must be in EventType enum |
| **P0** | `timestamp` | Not in future, within 5 years |
| **P1** | `dayOfWeek` | Range 0-6 if present |
| **P1** | `timeOfDay` | Range 0-23 if present |
| **P1** | `sessionPerformanceScore` | Range 0-100 if present |
| **P2** | `completionQuality` | Must be in enum if present |
| **P2** | `engagementLevel` | Must be in enum if present |

**Code Example:**

```python
class BehavioralEventSchema(pa.DataFrameModel):
    # P0: Required fields with strict validation
    id: Series[str] = pa.Field(
        str_matches=r"^c[a-z0-9]{24}$",
        nullable=False
    )

    userId: Series[str] = pa.Field(
        str_matches=r"^c[a-z0-9]{24}$",
        nullable=False
    )

    eventType: Series[str] = pa.Field(
        isin=EventType.values(),
        nullable=False
    )

    # P1: Range checks
    dayOfWeek: Optional[Series[int]] = pa.Field(
        ge=0, le=6, nullable=True
    )

    timeOfDay: Optional[Series[int]] = pa.Field(
        ge=0, le=23, nullable=True
    )
```

---

### 3. Enum Synchronization: How to keep Pandera enums synced with Prisma?

**Answer: Manual copy for MVP, automated generation later**

**Current Recommendation (MVP):**

```python
# app/schemas/enums.py

class EventType(str, Enum):
    MISSION_STARTED = "MISSION_STARTED"
    MISSION_COMPLETED = "MISSION_COMPLETED"
    # ... (copy from Prisma schema)

    @classmethod
    def values(cls) -> List[str]:
        """For Pandera validation."""
        return [member.value for member in cls]
```

**Update Process:**
1. Edit `prisma/schema.prisma` enum
2. Copy to `app/schemas/enums.py`
3. Run tests: `pytest tests/schemas/`

**Future Enhancement (Automated):**
```bash
# Generate enums from Prisma schema
python scripts/sync_prisma_enums.py
```

**Why Manual First:**
- Simple, no tooling dependencies
- Enums change infrequently
- Easy to verify correctness
- Can automate later if pain point

---

### 4. Cross-Column Validation: Should I add cross-column rules?

**Answer: Yes, but only for critical business rules**

**Add These 2 Rules:**

```python
@pa.dataframe_check(name="experiment_phase_requires_metadata")
def experiment_phase_validation(cls, df: pd.DataFrame) -> Series[bool]:
    """If experimentPhase set, contextMetadataId must be set."""
    has_phase = df["experimentPhase"].notna()
    has_metadata = df["contextMetadataId"].notna()
    return ~has_phase | has_metadata  # Phase implies metadata


@pa.dataframe_check(name="completion_quality_for_completion_events")
def completion_quality_validation(cls, df: pd.DataFrame) -> Series[bool]:
    """completionQuality only for completion events."""
    completion_events = ["MISSION_COMPLETED", "SESSION_ENDED"]
    has_quality = df["completionQuality"].notna()
    is_completion = df["eventType"].isin(completion_events)
    return ~has_quality | is_completion
```

**Decision Matrix:**

| Rule | Add? | Reason |
|------|------|--------|
| `experimentPhase` → `contextMetadataId` | ✅ Yes | Critical for research integrity |
| `completionQuality` → completion events | ✅ Yes | Catches instrumentation bugs |
| `eventData` structure validation | ❌ No | Too complex, handle separately |
| Timestamp sequence checks | ❌ No | Better in time-series analysis |

**Guideline:** Add cross-column checks if:
- Prevents research data corruption
- Catches instrumentation errors
- Simple boolean logic
- Performance impact < 10%

---

### 5. Error Handling: What level of strictness?

**Answer: Use strict mode for production, permissive for exploration**

**3 Modes Available:**

| Mode | Behavior | Use Case | Code |
|------|----------|----------|------|
| **Strict** | Reject entire DataFrame on any error | Production ETL, model training | `validate_strict(df)` |
| **Permissive** | Drop invalid rows, log warnings | Development, exploration | `validate_permissive(df)` |
| **Lazy** | Collect all errors, then decide | Data profiling, debugging | `validate_with_report(df)` |

**Implementation:**

```python
# Strict mode (production)
def validate_strict(df: pd.DataFrame) -> pd.DataFrame:
    """Fail-fast on any validation error."""
    return BehavioralEventSchema.validate(df, lazy=False)


# Permissive mode (development)
def validate_permissive(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Drop invalid rows, return cleaned data + report."""
    try:
        validated = BehavioralEventSchema.validate(df, lazy=True)
        return validated, {"valid_rows": len(validated), "errors": []}
    except pa.errors.SchemaErrors as e:
        invalid_indices = e.failure_cases["index"].unique()
        cleaned = df.drop(invalid_indices)
        return cleaned, {"valid_rows": len(cleaned), "errors": e.failure_cases}
```

**Recommendation:**
- **Start:** Strict mode (catch problems early)
- **If blocked:** Switch to permissive, inspect errors
- **Production:** Always strict mode

---

### 6. JSON Fields: How to validate `eventData`?

**Answer: Type check only (dict/JSON string), skip content validation**

**Validation Levels:**

| Level | Check | Pro | Con | Use? |
|-------|-------|-----|-----|------|
| None | Nothing | Fast | Risky | ❌ No |
| Type | Is dict/JSON? | Simple, fast | Misses bad data | ✅ **START HERE** |
| Structure | Has required keys? | Catches bugs | Schema drift | ⚠️ Selective |
| Full schema | Complete validation | Comprehensive | Too brittle | ❌ No |

**Implementation:**

```python
@pa.check("eventData", name="eventData_is_dict_or_json")
def event_data_is_valid_json(cls, event_data: Series[object]) -> Series[bool]:
    """Validate eventData is dict or valid JSON string."""
    import json

    def is_valid(value):
        if pd.isna(value):
            return False  # eventData is required

        if isinstance(value, dict):
            return True

        if isinstance(value, str):
            try:
                json.loads(value)
                return True
            except json.JSONDecodeError:
                return False

        return False

    return event_data.apply(is_valid)
```

**Optional: Key Checks for Critical Events**

```python
# Only add if you need to validate specific event types
@pa.check("eventData", name="mission_completed_has_duration")
def validate_mission_data(cls, df: pd.DataFrame) -> Series[bool]:
    """MISSION_COMPLETED events must have duration."""
    def check_row(row):
        if row["eventType"] != "MISSION_COMPLETED":
            return True  # Skip other event types

        event_data = row["eventData"]
        return isinstance(event_data, dict) and "duration" in event_data

    return df.apply(check_row, axis=1)
```

**Recommendation:**
- **Phase 1 (Now):** Type check only
- **Phase 2 (Later):** Add key checks for 2-3 critical event types
- **Never:** Full JSON schema validation (too brittle)

---

## Quick Start Commands

```bash
# 1. Create schema files
mkdir -p apps/ml-service/app/schemas
touch apps/ml-service/app/schemas/{__init__.py,enums.py,behavioral_events.py}

# 2. Copy code from PANDERA_SCHEMA_GUIDE.md sections:
#    - Section 3 → enums.py
#    - Section 2 → behavioral_events.py

# 3. Export data
python scripts/export_behavioral_events.py --days 30

# 4. Validate export
python -c "
import pandas as pd
from app.schemas import validate_behavioral_events

df = pd.read_parquet('data/raw/behavioral_events_latest.parquet')
validated = validate_behavioral_events(df, strict=True)
print(f'✅ Validated {len(validated)} rows')
"
```

---

## Decision Summary

| Question | Answer | Rationale |
|----------|--------|-----------|
| **Organization** | One file per table + enums.py | Maintainability |
| **Validation Priority** | Required fields + ranges first | Risk-based approach |
| **Enum Sync** | Manual copy (MVP) | Simple, reliable |
| **Cross-Column** | 2 rules (experiment + completion) | Critical business logic only |
| **Error Handling** | Strict for production | Fail-fast prevents bad data |
| **JSON Fields** | Type check only (MVP) | Balance validation vs flexibility |

---

## Next Steps

1. ✅ Read full guide: `docs/PANDERA_SCHEMA_GUIDE.md`
2. ✅ Create schema files (see Quick Start above)
3. ✅ Write 5-10 basic tests (`tests/schemas/test_behavioral_events.py`)
4. ✅ Integrate with export script
5. ✅ Run validation on real data
6. 🔄 Iterate based on real validation failures

See `PANDERA_SCHEMA_GUIDE.md` for complete code examples and patterns.
