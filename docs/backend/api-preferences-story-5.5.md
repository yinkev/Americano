# Story 5.5: Personalization Preference Management APIs

Quick reference guide for the 4 preference management API routes.

## API Routes

### 1. GET `/api/personalization/config`
**Returns active personalization configuration**

```bash
curl http://localhost:3000/api/personalization/config
```

**Response:**
- `config.missionPersonalization` - Mission timing and duration settings
- `config.contentPersonalization` - Learning style and content preferences
- `config.assessmentPersonalization` - Assessment frequency and difficulty
- `config.sessionPersonalization` - Session structure and break timing
- `dataQualityScore` - Confidence score (0.0-1.0)

---

### 2. PATCH `/api/personalization/preferences`
**Update personalization preferences**

```bash
curl -X PATCH http://localhost:3000/api/personalization/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "personalizationLevel": "MEDIUM",
    "missionPersonalizationEnabled": true,
    "contentPersonalizationEnabled": true,
    "assessmentPersonalizationEnabled": true,
    "sessionPersonalizationEnabled": true
  }'
```

**Personalization Levels:**
- `NONE` - All personalization disabled (threshold: 1.0)
- `LOW` - Conservative, high-confidence only (threshold: 0.85)
- `MEDIUM` - Balanced (threshold: 0.7) **[Default]**
- `HIGH` - Aggressive, lower confidence accepted (threshold: 0.6)

**Auto-adjusted Features by Level:**
- `NONE`: All features OFF
- `LOW`: Mission timing + Session structure only
- `MEDIUM`: All features enabled
- `HIGH`: All features enabled with aggressive thresholds

---

### 3. GET `/api/personalization/effectiveness`
**Track personalization effectiveness with statistics**

```bash
# All metrics for last 14 days (default)
curl http://localhost:3000/api/personalization/effectiveness

# Specific metric and date range
curl "http://localhost:3000/api/personalization/effectiveness?metric=retention&startDate=2025-10-01&endDate=2025-10-16"
```

**Query Parameters:**
- `startDate` (optional) - ISO date, default: 14 days ago
- `endDate` (optional) - ISO date, default: now
- `metric` (optional) - `retention` | `performance` | `completion` | `all` (default: all)

**Response Metrics:**
- `retentionImprovement` - % improvement in retention
- `performanceImprovement` - % improvement in performance
- `completionRateChange` - % change in completion rate
- `engagementChange` - % change in engagement

**Statistical Validation:**
- `sampleSize` - Number of data points
- `correlation` - Pearson correlation coefficient
- `pValue` - Statistical significance (p < 0.05 = significant)
- `isStatisticallySignificant` - Boolean

---

### 4. POST `/api/personalization/apply`
**Apply personalization for specific context**

```bash
# Mission personalization
curl -X POST http://localhost:3000/api/personalization/apply \
  -H "Content-Type: application/json" \
  -d '{
    "context": "MISSION",
    "params": {
      "missionDate": "2025-10-17"
    }
  }'

# Content personalization
curl -X POST http://localhost:3000/api/personalization/apply \
  -H "Content-Type: application/json" \
  -d '{
    "context": "CONTENT",
    "params": {
      "topicId": "anatomy-123"
    }
  }'

# Assessment personalization
curl -X POST http://localhost:3000/api/personalization/apply \
  -H "Content-Type: application/json" \
  -d '{
    "context": "ASSESSMENT",
    "params": {
      "currentDifficulty": 0.7
    }
  }'

# Session personalization
curl -X POST http://localhost:3000/api/personalization/apply \
  -H "Content-Type: application/json" \
  -d '{
    "context": "SESSION",
    "params": {
      "sessionDuration": 50
    }
  }'
```

**Contexts:**
- `MISSION` - Daily mission generation
- `CONTENT` - Content recommendations
- `ASSESSMENT` - Assessment strategy
- `SESSION` - Study session orchestration

**Response:**
- `personalizationApplied` - Boolean (true if applied)
- `context` - Context requested
- `config` - Context-specific configuration
- `confidence` - Data quality score
- `message` - Human-readable status

---

## Integration Examples

### Mission Generator Integration
```typescript
// Before generating mission
const response = await fetch('/api/personalization/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    context: 'MISSION',
    params: { missionDate: new Date().toISOString() }
  })
});

const { personalizationApplied, config } = await response.json();

if (personalizationApplied) {
  // Use config.parameters.optimalStudyTimes
  // Use config.parameters.recommendedDuration
  // Apply to mission generation
}
```

### Settings UI Integration
```typescript
// Update personalization level
const updatePreferences = async (level: string) => {
  const response = await fetch('/api/personalization/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personalizationLevel: level })
  });

  return response.json();
};

// Usage
await updatePreferences('HIGH'); // Enable aggressive personalization
```

### Analytics Dashboard Integration
```typescript
// Fetch effectiveness metrics
const response = await fetch(
  '/api/personalization/effectiveness?startDate=2025-10-01&endDate=2025-10-16&metric=all'
);

const { effectiveness } = await response.json();

// Display metrics
console.log(`Retention improved by ${effectiveness.metrics.retentionImprovement}%`);
console.log(`Statistical significance: ${effectiveness.statistical.isStatisticallySignificant ? 'Yes' : 'No'}`);
```

---

## Error Handling

All routes return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid personalizationLevel. Must be one of: NONE, LOW, MEDIUM, HIGH"
  }
}
```

**Error Codes:**
- `400 BAD_REQUEST` - Invalid parameters
- `404 NOT_FOUND` - User not found
- `500 INTERNAL_SERVER_ERROR` - Unexpected error

---

## Data Flow

```
1. User Updates Preferences
   └─> PATCH /api/personalization/preferences
       └─> PersonalizationPreferences record updated
           └─> If NONE: Deactivate all configs

2. System Applies Personalization
   └─> POST /api/personalization/apply
       └─> Check preferences + data quality
           └─> If enabled + sufficient data:
               └─> Create/update PersonalizationConfig
           └─> Else: Return default config

3. Mission/Session Uses Config
   └─> GET /api/personalization/config
       └─> Retrieve active config
           └─> Apply to mission/content/assessment/session

4. Track Effectiveness
   └─> Background job calculates metrics
       └─> PersonalizationEffectiveness records created
           └─> GET /api/personalization/effectiveness
               └─> Aggregate and analyze metrics
```

---

## Graceful Degradation

All APIs gracefully degrade when:

1. **No Learning Profile** (New User)
   - Returns default configs
   - Message: "Insufficient data for personalization"

2. **Low Data Quality** (< threshold)
   - Returns default configs
   - Message: "Data quality below threshold for [level]"

3. **Feature Disabled**
   - Returns disabled config
   - Message: "Personalization disabled for [context]"

4. **No Effectiveness Data**
   - Returns baseline metrics
   - Message: "No active personalization"

---

## Testing Checklist

- [ ] Test GET /config with no learning profile → Default config
- [ ] Test GET /config with sufficient data → Personalized config
- [ ] Test PATCH /preferences NONE → All features disabled
- [ ] Test PATCH /preferences HIGH → All features enabled
- [ ] Test GET /effectiveness with no data → Baseline response
- [ ] Test GET /effectiveness with data → Metrics + statistics
- [ ] Test POST /apply with disabled feature → Default config
- [ ] Test POST /apply with enabled feature → Personalized config

---

## File Locations

```
/Users/kyin/Projects/Americano-epic5/apps/web/src/app/api/personalization/
├── config/route.ts          (144 lines)
├── preferences/route.ts     (199 lines)
├── effectiveness/route.ts   (207 lines)
└── apply/route.ts           (257 lines)
```

**Total:** 807 lines across 4 API routes
