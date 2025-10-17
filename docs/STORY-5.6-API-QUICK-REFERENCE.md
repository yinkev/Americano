# Story 5.6 API Quick Reference

## Recommendations & Goals APIs

### 1. GET Recommendations
```bash
# Get top 5 recommendations
curl "http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=kevy@americano.dev"

# Get top 3 recommendations, include applied
curl "http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=kevy@americano.dev&limit=3&includeApplied=true"
```

### 2. Apply Recommendation
```bash
# Apply recommendation with AUTO mode
curl -X POST "http://localhost:3000/api/analytics/behavioral-insights/recommendations/{id}/apply" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationType": "AUTO"
  }'

# Apply with MANUAL mode and custom settings
curl -X POST "http://localhost:3000/api/analytics/behavioral-insights/recommendations/{id}/apply" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationType": "MANUAL",
    "settings": {
      "customKey": "value"
    }
  }'
```

### 3. Create Goal
```bash
# Create study time consistency goal
curl -X POST "http://localhost:3000/api/analytics/behavioral-insights/goals" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "kevy@americano.dev",
    "goalType": "STUDY_TIME_CONSISTENCY",
    "targetMetric": "peakHourSessionsPerWeek",
    "targetValue": 5,
    "deadline": "2025-12-01T00:00:00Z"
  }'

# Create custom goal
curl -X POST "http://localhost:3000/api/analytics/behavioral-insights/goals" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "kevy@americano.dev",
    "goalType": "CUSTOM",
    "title": "My Custom Goal",
    "description": "My custom behavioral goal",
    "targetMetric": "custom",
    "targetValue": 100,
    "deadline": "2025-11-15T00:00:00Z"
  }'
```

### 4. Update Goal Progress
```bash
# Manual progress update
curl -X PATCH "http://localhost:3000/api/analytics/behavioral-insights/goals/{id}/progress" \
  -H "Content-Type: application/json" \
  -d '{
    "currentValue": 3,
    "note": "Made good progress this week"
  }'

# Automated daily update (via cron job)
curl -X PATCH "http://localhost:3000/api/analytics/behavioral-insights/goals/{id}/progress" \
  -H "Content-Type: application/json" \
  -d '{
    "currentValue": 4,
    "note": "Automated daily update"
  }'
```

### 5. Get Goal Details
```bash
# Get goal with progress history and projected completion
curl "http://localhost:3000/api/analytics/behavioral-insights/goals/{id}"
```

## Response Examples

### GET Recommendations Response
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "rec-1",
        "userId": "kevy@americano.dev",
        "recommendationType": "STUDY_TIME_OPTIMIZATION",
        "title": "Study during your peak hours (14:00-15:00)",
        "description": "Your analysis shows 25% better performance during 14:00-15:00 based on 15 sessions.",
        "actionableText": "Schedule high-priority missions during 14:00-15:00 for optimal retention and performance.",
        "confidence": 0.85,
        "estimatedImpact": 0.72,
        "easeOfImplementation": 0.7,
        "userReadiness": 0.8,
        "priorityScore": 0.75,
        "appliedAt": null,
        "createdAt": "2025-10-16T10:00:00Z"
      }
    ],
    "count": 5,
    "total": 8
  }
}
```

### Apply Recommendation Response
```json
{
  "success": true,
  "data": {
    "appliedRecommendation": {
      "id": "applied-1",
      "applicationType": "AUTO",
      "appliedAt": "2025-10-16T12:00:00Z"
    },
    "updatedSettings": {
      "preferredStudyTimes": [
        { "startHour": 14, "endHour": 15, "dayOfWeek": null }
      ]
    },
    "trackingId": "applied-1"
  }
}
```

### Create Goal Response
```json
{
  "success": true,
  "data": {
    "goal": {
      "id": "goal-1",
      "userId": "kevy@americano.dev",
      "goalType": "STUDY_TIME_CONSISTENCY",
      "title": "Study during peak hours consistently",
      "description": "Build a habit of studying during optimal time windows",
      "targetMetric": "peakHourSessionsPerWeek",
      "currentValue": 2,
      "targetValue": 5,
      "deadline": "2025-12-01T00:00:00Z",
      "status": "ACTIVE",
      "progressHistory": [
        {
          "date": "2025-10-16T12:00:00Z",
          "value": 2,
          "note": "Goal created"
        }
      ],
      "createdAt": "2025-10-16T12:00:00Z"
    }
  }
}
```

### Update Progress Response
```json
{
  "success": true,
  "data": {
    "goal": {
      "id": "goal-1",
      "currentValue": 3,
      "status": "ACTIVE",
      "progressHistory": [
        {
          "date": "2025-10-16T12:00:00Z",
          "value": 2,
          "note": "Goal created"
        },
        {
          "date": "2025-10-17T12:00:00Z",
          "value": 3,
          "note": "Made good progress this week"
        }
      ]
    },
    "completed": false
  }
}
```

### Get Goal Details Response
```json
{
  "success": true,
  "data": {
    "goal": {
      "id": "goal-1",
      "userId": "kevy@americano.dev",
      "goalType": "STUDY_TIME_CONSISTENCY",
      "currentValue": 3,
      "targetValue": 5,
      "status": "ACTIVE"
    },
    "progressHistory": [
      {
        "date": "2025-10-16T12:00:00Z",
        "value": 2,
        "note": "Goal created"
      },
      {
        "date": "2025-10-17T12:00:00Z",
        "value": 3,
        "note": "Made good progress"
      }
    ],
    "recentActivity": [
      {
        "id": "session-1",
        "startedAt": "2025-10-17T14:00:00Z",
        "endedAt": "2025-10-17T14:45:00Z",
        "contentType": "FLASHCARDS",
        "mission": {
          "title": "Cardiovascular System Review"
        }
      }
    ],
    "projectedCompletion": "2025-10-20T00:00:00Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Deadline cannot exceed 90 days from now",
    "code": "DEADLINE_TOO_FAR"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Goal not found",
    "code": "NOT_FOUND"
  }
}
```

## Testing Checklist

### Recommendations
- [ ] Get top 5 recommendations (default limit)
- [ ] Get with custom limit (3, 10, 20)
- [ ] Filter applied recommendations (includeApplied=false)
- [ ] Include applied recommendations (includeApplied=true)
- [ ] Apply with AUTO mode (verify settings updated)
- [ ] Apply with MANUAL mode
- [ ] Apply already-applied recommendation (should fail)

### Goals
- [ ] Create STUDY_TIME_CONSISTENCY goal
- [ ] Create SESSION_DURATION goal
- [ ] Create CONTENT_DIVERSIFICATION goal
- [ ] Create RETENTION_IMPROVEMENT goal
- [ ] Create CUSTOM goal with custom title/description
- [ ] Create goal with deadline > 90 days (should fail)
- [ ] Create goal with deadline in past (should fail)
- [ ] Update goal progress manually
- [ ] Verify milestone notifications (25%, 50%, 75%)
- [ ] Complete goal (currentValue >= targetValue)
- [ ] Verify completion notification and badge
- [ ] Get goal details with projected completion

## Integration with Subsystems

### RecommendationsEngine
- `generateRecommendations(userId)` - Called by GET /recommendations
- `trackRecommendationEffectiveness(userId, recommendationId, applicationType)` - Called by POST /apply

### GoalManager
- `createGoal(userId, input)` - Called by POST /goals
- `updateGoalProgress(goalId, currentValue, note?)` - Called by PATCH /progress
- `runDailyProgressTracking(userId?)` - Called by daily cron job
