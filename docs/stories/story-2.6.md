# Story 2.6: Mission Performance Analytics and Adaptation

Status: Draft

## Story

As a medical student,
I want to see how well I'm completing missions and how they're helping me learn,
So that I can trust the system and see my improvement over time.

## Acceptance Criteria

1. Mission completion statistics displayed in personal dashboard
2. Success metrics show correlation between mission completion and performance improvement
3. Mission difficulty automatically adapts based on completion patterns
4. User feedback system for mission relevance and effectiveness
5. Weekly/monthly reviews showing mission impact on learning outcomes
6. Comparative analysis of mission-guided vs. free-form study effectiveness
7. Recommendations for optimal mission complexity and duration
8. Historical mission data accessible for personal reflection

## Tasks / Subtasks

### Task 1: Design Mission Analytics Data Models (AC: #1, #2, #8)
- [ ] 1.1: Create `MissionAnalytics` aggregate model
  - Fields: `userId`, `date`, `missionsGenerated`, `missionsCompleted`, `missionsSkipped`, `avgCompletionRate`, `avgTimeAccuracy`, `avgDifficultyRating`
  - Calculated daily/weekly/monthly
  - Enables trend analysis over time
- [ ] 1.2: Extend `MissionFeedback` model (from Story 2.4)
  - Add `helpfulnessRating` (1-5): Did this mission help you learn?
  - Add `relevanceScore` (1-5): Were objectives relevant to your goals?
  - Add `paceRating` (too slow/just right/too fast)
  - Add `improvementSuggestions` (text field)
- [ ] 1.3: Create `MissionStreak` model
  - Tracks consecutive days with completed missions
  - Fields: `userId`, `currentStreak`, `longestStreak`, `lastCompletedDate`
  - Gamification element for motivation
- [ ] 1.4: Run Prisma migration for new models

### Task 2: Implement Mission Analytics Calculation Engine (AC: #2, #3)
- [ ] 2.1: Create `MissionAnalyticsEngine` class
  - Method: `calculateDailyAnalytics(userId, date): MissionAnalytics`
  - Method: `calculateCompletionRate(userId, period): Float`
  - Method: `detectPerformanceCorrelation(userId): CorrelationData`
  - Method: `recommendMissionAdjustments(userId): Adjustments`
- [ ] 2.2: Implement completion rate calculation
  - Formula: `completionRate = missionsCompleted / missionsGenerated`
  - Track over 7-day, 30-day, all-time periods
  - Target: 70-90% completion rate (optimal zone)
  - <70%: Missions too difficult or irrelevant
  - >90%: Missions too easy, increase challenge
- [ ] 2.3: Implement performance correlation analysis
  - Compare mastery levels before/after mission completion
  - Measure objective performance delta
  - Calculate: `improvementRate = (avgMasteryAfter - avgMasteryBefore) / avgMasteryBefore`
  - Correlation: Mission completion rate vs. performance improvement
  - Statistical significance: Pearson correlation coefficient
- [ ] 2.4: Implement adaptive difficulty algorithm
  - If completionRate < 70% for 7 days → Reduce mission complexity
  - If completionRate > 90% for 7 days → Increase mission complexity
  - Complexity adjustments: ±1 objective, ±10 minutes, easier/harder objectives
  - Per-user adaptation stored in preferences

### Task 3: Build Mission Analytics Dashboard (AC: #1, #5, #6)
- [ ] 3.1: Create `/analytics/missions` page
  - Header: Mission completion stats and current streak
  - Section 1: Completion trend chart (7/30/90 days)
  - Section 2: Performance correlation insights
  - Section 3: Mission effectiveness breakdown
  - Section 4: Weekly/monthly summary reports
- [ ] 3.2: Design `MissionCompletionChart` component
  - Line chart: Missions completed over time
  - Bar chart: Completion rate by day of week
  - Heatmap: Mission activity calendar (GitHub-style)
  - Filters: Time period, mission difficulty
- [ ] 3.3: Create `PerformanceCorrelationPanel` component
  - Visualization: Scatterplot of completion rate vs. mastery improvement
  - Insight cards: "85% mission completion correlates with 23% faster mastery"
  - Confidence level: Statistical significance indicator
- [ ] 3.4: Build `MissionEffectivenessTable` component
  - Table columns: Week, Missions completed, Avg difficulty, Objectives mastered, Study time, Improvement %
  - Sortable/filterable by any column
  - Export to CSV for external analysis
- [ ] 3.5: Implement mission vs. free-study comparison
  - Track study sessions with vs. without missions
  - Compare performance outcomes
  - Display: "Mission-guided study: 31% more effective"
  - Methodology note: Controlled for study time

### Task 4: Create Mission Feedback Collection UI (AC: #4)
- [ ] 4.1: Design post-mission feedback dialog
  - Triggered after mission completion (in session summary)
  - Quick feedback: 3 questions, <30 seconds to complete
  - Questions:
    1. How helpful was this mission? (1-5 stars)
    2. How relevant were the objectives? (1-5 stars)
    3. Was the pace right? (Too slow / Just right / Too fast)
  - Optional: Improvement suggestions (text field)
- [ ] 4.2: Create `/missions/:id/feedback` feedback page
  - Detailed feedback form for in-depth reviews
  - Additional questions:
    - Which objectives were most valuable?
    - Which objectives felt misplaced?
    - Time accuracy rating
    - Difficulty rating
  - Submit calls POST `/api/missions/:id/feedback`
- [ ] 4.3: Implement feedback aggregation
  - Calculate average ratings per mission component
  - Identify patterns: Consistently low-rated objective types
  - Tag outlier missions for manual review
- [ ] 4.4: Display feedback summary to user
  - "Your feedback improved mission quality by 15%"
  - "Based on your input, we reduced mission duration by 10 minutes"
  - Builds trust in feedback loop

### Task 5: Build Mission Adaptation Logic (AC: #3, #7)
- [ ] 5.1: Create `MissionAdaptationEngine` class
  - Method: `analyzeUserPatterns(userId): Patterns`
  - Method: `generateAdaptationRecommendations(patterns): Recommendations`
  - Method: `applyAdaptations(userId, recommendations): void`
- [ ] 5.2: Implement completion pattern detection
  - Analyze past 14 missions
  - Detect patterns:
    - Consistently skipping certain objective types → Remove from future missions
    - Consistently rating difficulty too high → Reduce complexity
    - Consistently completing faster than estimated → Increase objectives
  - Pattern confidence: Requires 3+ occurrences to trigger adaptation
- [ ] 5.3: Implement automatic mission adjustments
  - Difficulty: Auto-adjust based on 7-day completion rate
  - Duration: Auto-adjust based on average time accuracy
  - Complexity: Auto-adjust based on self-assessment scores
  - Objective types: Auto-filter based on feedback ratings
  - Adjustments logged for transparency
- [ ] 5.4: Create manual adaptation controls
  - Settings page: "Mission Adaptation" section
  - Toggle: Auto-adapt mission difficulty (default ON)
  - Sliders: Manual overrides for duration, complexity, difficulty
  - Button: "Reset to recommended settings"
  - History: Show past adaptations and their impact

### Task 6: Implement Mission Recommendations System (AC: #7)
- [ ] 6.1: Create GET `/api/missions/recommendations` endpoint
  - Analyzes user's mission history
  - Returns personalized recommendations
  - Response: `{ recommendations[], rationale }`
- [ ] 6.2: Build recommendation generation logic
  - Optimal mission duration: Based on completion patterns
    - Example: "Your optimal mission length is 55 minutes (not 60)"
  - Optimal complexity: Based on difficulty ratings
    - Example: "Try 3 objectives instead of 4 for better completion rate"
  - Optimal study time: Based on performance data
    - Example: "You perform best during morning sessions (7-9 AM)"
  - Objective type balance: Based on mastery data
    - Example: "Increase exam prep by 20%, reduce review by 10%"
- [ ] 6.3: Create `RecommendationsPanel` component
  - Displays top 3-5 recommendations
  - Action buttons: "Apply this recommendation"
  - Dismiss: "Not helpful" → Feeds back into algorithm
  - Success tracking: Did user apply? Did it help?
- [ ] 6.4: Implement recommendation success tracking
  - Track when user applies recommendations
  - Measure before/after performance
  - Calculate recommendation effectiveness
  - Use to refine future recommendations

### Task 7: Build Weekly/Monthly Review System (AC: #5)
- [ ] 7.1: Create automated review generation
  - Triggered every Sunday night (weekly)
  - Triggered every month-end (monthly)
  - Generates summary report
  - Stores in `MissionReview` model
- [ ] 7.2: Design `MissionReview` model
  - Fields: `userId`, `period` (week/month), `startDate`, `endDate`, `summary`, `highlights`, `insights`, `recommendations`
  - Summary: Quantitative stats (missions completed, time, performance)
  - Highlights: Top achievements (longest streak, best performance)
  - Insights: Key learnings (patterns, correlations, improvements)
  - Recommendations: Actionable next steps
- [ ] 7.3: Create `/analytics/reviews` page
  - Lists all weekly/monthly reviews
  - Filter by period
  - Search by keyword
  - Cards: Each review as expandable card
- [ ] 7.4: Build `ReviewCard` component
  - Header: Period, completion rate, streak
  - Summary stats: Visual cards
  - Highlights: Badge/trophy display
  - Insights: Key findings in bullet points
  - Action: "Apply recommendations" button
- [ ] 7.5: Add review notifications
  - Email/in-app notification when review ready
  - Format: "Your weekly mission review is ready! See how you did →"
  - Link to review page

### Task 8: Create Mission History and Reflection Tools (AC: #8)
- [ ] 8.1: Build `/missions/history` page
  - Timeline view of all past missions
  - Filters: Completed/skipped, date range, difficulty
  - Search by objective name
  - Sort by date, completion rate, performance impact
- [ ] 8.2: Design `MissionTimeline` component
  - Visual timeline: Missions plotted on calendar
  - Color-coded: Green (completed), gray (skipped), yellow (partial)
  - Hover: Preview mission details
  - Click: Open mission detail page
- [ ] 8.3: Add reflection prompts
  - After completing 10 missions → Reflection prompt
  - Questions:
    - "What study strategies are working best?"
    - "Which objectives were most challenging?"
    - "How has your confidence changed?"
  - Saved as journal entries
- [ ] 8.4: Create mission comparison tool
  - Select 2+ missions to compare
  - Side-by-side view: Objectives, time, performance, feedback
  - Insights: "Your completion time improved 18% between these missions"

### Task 9: Implement Mission Success Scoring (AC: #2)
- [ ] 9.1: Define mission success score formula
  - `successScore = (completionRate * 0.30) + (performanceImprovement * 0.25) + (timeAccuracy * 0.20) + (feedbackRating * 0.15) + (streakBonus * 0.10)`
  - Range: 0.0 (failure) to 1.0 (perfect success)
  - Normalized across all users for comparison
- [ ] 9.2: Calculate mission success scores
  - Calculated after mission completion
  - Stored in `Mission.successScore` field
  - Used for analytics and leaderboards
- [ ] 9.3: Display success scores in UI
  - Mission detail page: Success score badge
  - Mission history: Sort by success score
  - Dashboard: Average success score trend
- [ ] 9.4: Create success benchmarks
  - Personal best: Highest success score achieved
  - Recent average: Last 7 missions
  - Goal setting: Target success score
  - Celebration: New personal best animations

### Task 10: Build Mission Analytics API Endpoints (AC: All)
- [ ] 10.1: Create GET `/api/analytics/missions/summary` endpoint
  - Query params: `period` (7d, 30d, 90d, all)
  - Returns: Completion stats, streak, success rate, avg performance
  - Response: `{ completionRate, streak, successScore, missions[], insights }`
- [ ] 10.2: Create GET `/api/analytics/missions/trends` endpoint
  - Returns time-series data for charts
  - Metrics: Completion rate, avg duration, success score
  - Granularity: Daily, weekly, monthly
- [ ] 10.3: Create GET `/api/analytics/missions/correlation` endpoint
  - Returns performance correlation data
  - Analysis: Mission completion vs. mastery improvement
  - Statistical data: Correlation coefficient, p-value
- [ ] 10.4: Create GET `/api/analytics/missions/recommendations` endpoint
  - Returns personalized mission recommendations
  - Based on completion patterns and feedback
- [ ] 10.5: Implement Zod validation for all endpoints
  - Validate period enums (7d, 30d, etc.)
  - Validate date ranges
  - Validate filter parameters

### Task 11: Create Mission Insights Engine (AC: #2, #5)
- [ ] 11.1: Build `MissionInsightsEngine` class
  - Method: `generateWeeklyInsights(userId): Insights[]`
  - Method: `detectAnomalies(userId): Anomalies[]`
  - Method: `identifyStrengths(userId): Strengths[]`
  - Method: `identifyImprovementAreas(userId): Improvements[]`
- [ ] 11.2: Implement insight generation algorithms
  - Insight types:
    - Performance trends: "Mastery improved 15% this week"
    - Completion patterns: "You complete 92% of morning missions vs. 68% evening"
    - Time optimization: "Optimal mission duration is 52 minutes for you"
    - Objective preferences: "You excel at anatomy objectives (avg 4.3/5)"
  - Min data: Requires 7+ missions for reliable insights
- [ ] 11.3: Create `InsightsPanel` component on dashboard
  - Card-based layout
  - Each insight: Icon, headline, detail, action
  - Refresh daily
  - Expandable for full context
- [ ] 11.4: Add insight notifications
  - Major insights trigger notifications
  - Example: "You've completed 10 missions in a row! 🎉"
  - Example: "Completion rate dropped 20% this week. Adjust difficulty?"

### Task 12: Testing and Validation (AC: All)
- [ ] 12.1: Test analytics calculations
  - Verify completion rate accuracy
  - Verify performance correlation correctness
  - Verify adaptation logic triggers appropriately
  - Test edge case: No missions completed (should handle gracefully)
- [ ] 12.2: Test adaptation engine
  - Simulate low completion rate → Verify difficulty reduced
  - Simulate high completion rate → Verify complexity increased
  - Verify adaptation logs created
  - Test manual override preserves user preferences
- [ ] 12.3: Test UI components with real data
  - Load 30 days of mission history
  - Verify charts render correctly
  - Verify insights display accurately
  - Test filters and sorting
- [ ] 12.4: Test feedback loop
  - Submit feedback → Verify stored correctly
  - Submit multiple feedbacks → Verify aggregation
  - Provide low ratings → Verify adaptation triggered
- [ ] 12.5: Performance testing
  - Analytics queries <1 second for 90 days of data
  - Chart rendering <500ms
  - Recommendation generation <300ms
- [ ] 12.6: TypeScript compilation verification
  - Run `pnpm tsc` to verify 0 errors
  - Fix any type errors in analytics code

## Dev Notes

### Architecture References

- **Solution Architecture:** `/Users/Kyin/Projects/Americano/docs/solution-architecture.md`
  - Subsystem 5: Behavioral Analytics (lines 605-627)
  - API Architecture: `/api/analytics/*` endpoints (lines 1377-1413)

- **PRD:** `/Users/Kyin/Projects/Americano/docs/PRD-Americano-2025-10-14.md`
  - FR10: Progress Analytics and Performance Insights (lines 127-131)
  - Epic 2 Success Criteria (line 407-411)

- **Epic Breakdown:** `/Users/Kyin/Projects/Americano/docs/epics-Americano-2025-10-14.md`
  - Story 2.6 Details: Lines 335-355

### Mission Success Score Formula (Detailed)

```typescript
successScore =
  (completionRate * 0.30) +         // Did user complete the mission?
  (performanceImprovement * 0.25) + // Did mastery levels improve?
  (timeAccuracy * 0.20) +           // Was time estimate accurate?
  (feedbackRating * 0.15) +         // Did user rate mission highly?
  (streakBonus * 0.10)              // Is user maintaining consistency?

// Component calculations:
completionRate = objectivesCompleted / totalObjectives // 0.0-1.0

performanceImprovement =
  (avgMasteryAfter - avgMasteryBefore) / 4.0 // Normalized to 0.0-1.0
  // Mastery scale: NOT_STARTED (0), BEGINNER (1), INTERMEDIATE (2), ADVANCED (3), MASTERED (4)

timeAccuracy =
  1.0 - abs(actualTime - estimatedTime) / estimatedTime
  // Perfect: 1.0, 50% off: 0.5, 100%+ off: 0.0

feedbackRating = avgUserRating / 5.0 // Normalized 1-5 stars to 0.0-1.0

streakBonus =
  min(0.2, currentStreak * 0.02) // +2% per day, capped at 20%
  // 5-day streak: 0.10, 10+ day streak: 0.20 (max)

// Example calculation:
// Mission: 3/4 objectives (75%), mastery +0.5, time 48 min vs 50 min estimate, rating 4.3/5, streak 7 days
successScore = (0.75 * 0.30) + (0.125 * 0.25) + (0.96 * 0.20) + (0.86 * 0.15) + (0.14 * 0.10)
             = 0.225 + 0.031 + 0.192 + 0.129 + 0.014
             = 0.591 (59.1% success - "GOOD" rating)
```

### Analytics Dashboard UI Example

```
┌─────────────────────────────────────────────────┐
│ Mission Analytics Dashboard                     │
│                                                 │
│ ┌─ This Week ───────────────────────────────┐  │
│ │ 🎯 6/7 Missions Completed (86%)          │  │
│ │ 🔥 7-day streak!                         │  │
│ │ ⭐ Avg Success Score: 0.72 (GOOD)        │  │
│ │ 📈 Mastery improved 18% vs. last week    │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ ┌─ Performance Correlation ─────────────────┐  │
│ │                                           │  │
│ │ Mission completion rate: 86%             │  │
│ │ Mastery improvement rate: +23%           │  │
│ │                                           │  │
│ │ 💡 Insight: Mission-guided study is 31%  │  │
│ │    more effective than free-form study   │  │
│ │                                           │  │
│ │ [View Statistical Analysis]              │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ ┌─ Recommendations ─────────────────────────┐  │
│ │                                           │  │
│ │ 1. ⏱️  Reduce mission duration to 52 min  │  │
│ │    (You complete 95% at 52 min vs. 75%  │  │
│ │     at 60 min)                           │  │
│ │    [Apply] [Dismiss]                     │  │
│ │                                           │  │
│ │ 2. 📚 Increase exam prep by 15%          │  │
│ │    (Exam in 12 days, current prep: 35%)│  │
│ │    [Apply] [Dismiss]                     │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ [View Full History] [Weekly Reviews]           │
└─────────────────────────────────────────────────┘
```

### Integration Points

**With Story 2.1 (Learning Objectives):**
- Analytics track mastery progression per objective
- Objective performance feeds into success scores

**With Story 2.2 (Performance Tracking):**
- Mission completion updates performance metrics
- Correlation analysis links missions to mastery improvement

**With Story 2.3 (Prioritization):**
- Feedback influences prioritization weights
- Low-rated objective types deprioritized

**With Story 2.4 (Mission Generation):**
- Analytics drive adaptive mission generation
- Recommendations directly influence mission composer

**With Story 2.5 (Session Orchestration):**
- Session data feeds into mission analytics
- Self-assessments contribute to success scoring

### Technical Constraints

1. **Data Retention:** Mission analytics retained indefinitely. Raw mission data deleted after 1 year (keep aggregates).
2. **Calculation Frequency:** Analytics calculated nightly for efficiency. Real-time updates only for critical metrics (streak).
3. **Statistical Significance:** Correlations require 7+ data points. Display confidence intervals.
4. **Adaptation Throttling:** Max 1 auto-adaptation per week to prevent oscillation.
5. **Privacy:** All analytics are personal. No cross-user comparisons (unless anonymized leaderboards in v2).

### Testing Strategy

**Analytics Calculation Tests:**
- Test completion rate: 6/7 missions = 85.7%
- Test performance correlation with known data
- Test success score formula accuracy
- Test adaptation triggers at correct thresholds

**Adaptation Engine Tests:**
- Simulate 7 days low completion → Verify difficulty reduced
- Simulate user feedback patterns → Verify adaptations applied
- Test adaptation rollback if user overrides

**UI Tests:**
- Load 90 days of data → Verify charts render
- Test filters and date ranges
- Verify insights display correctly
- Test recommendation apply/dismiss

### Performance Optimizations

1. **Aggregate Tables:** Pre-calculate daily/weekly/monthly aggregates. Avoid real-time calculations.
2. **Caching:** Cache analytics queries for 1 hour. Invalidate on new mission completion.
3. **Database Indexes:** Critical for time-series queries. Index on (userId, date).
4. **Chart Data Sampling:** For >90 days, sample data points to reduce payload.

### User Experience Considerations

**Transparency:**
- Always explain why adaptations happen
- Show before/after comparisons
- Allow manual overrides

**Motivation:**
- Celebrate streaks and achievements
- Positive framing: "18% improvement" not "82% to go"
- Visual progress indicators

**Trust Building:**
- Statistical rigor: Show confidence levels
- Correlation != causation disclaimers
- User can see raw data backing insights

### References

- **Source:** Epic 2, Story 2.6 (epics-Americano-2025-10-14.md:335-355)
- **Source:** Solution Architecture, Behavioral Analytics (solution-architecture.md:605-627)
- **Source:** PRD FR10 Progress Analytics (PRD-Americano-2025-10-14.md:127-131)
- **Source:** Story 2.4 for MissionFeedback model
- **Source:** Story 2.2 for Performance correlation

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

(To be filled by DEV agent)

### Debug Log References

(To be filled by DEV agent during implementation)

### Completion Notes List

(To be filled by DEV agent after story completion)

### File List

(To be filled by DEV agent with all modified/created files)
