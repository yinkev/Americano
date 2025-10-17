# Story 3.5: Context-Aware Content Recommendations

Status: Ready for Development

## Story

As a medical student,
I want relevant content suggested while I'm studying specific topics,
So that I can discover related material without manual searching.

## Acceptance Criteria

1. Related content recommendations based on current study session
2. Recommendations consider user's knowledge level and previous performance
3. Suggestions include content from different sources (lectures, First Aid, external)
4. Recommendation explanations provided showing relationship reasoning
5. User can dismiss or rate recommendations to improve future suggestions
6. Recommendations adapt based on user interaction patterns
7. Integration with daily missions to suggest complementary content
8. Personalization improves over time through machine learning

## Tasks / Subtasks

### Task 1: Design Recommendation Engine Architecture (AC: All)
- [ ] 1.1: Define recommendation data models
  - `ContentRecommendation` model: recommendedContentId, sourceContentId, userId, score, reasoning, status (pending/viewed/dismissed/rated)
  - `RecommendationFeedback` model: recommendationId, userId, rating (1-5), feedback text, timestamp
  - `RecommendationContext` JSON field: sessionId, currentObjectiveId, userMasteryLevel, studyPhase
  - Relations: FK to ContentChunk, LearningObjective, StudySession
- [ ] 1.2: Design recommendation scoring algorithm
  - Collaborative filtering: User behavior patterns from similar study sessions
  - Content-based filtering: Semantic similarity using embeddings
  - Hybrid approach: Weighted combination (70% content-based, 30% collaborative for MVP)
  - Scoring factors: Semantic similarity (40%), prerequisite relationships (20%), user mastery level (20%), recency (10%), user feedback (10%)
- [ ] 1.3: Create recommendation service architecture
  - `RecommendationEngine` service with pluggable strategies
  - `SemanticRecommendationStrategy` using pgvector similarity
  - `CollaborativeRecommendationStrategy` using user behavior patterns
  - `HybridRecommendationStrategy` combining multiple approaches
  - Caching layer for frequently accessed recommendations
- [ ] 1.4: Run Prisma migration for new models

### Task 2: Implement Semantic Content-Based Recommendations (AC: #1, #3, #4)
- [ ] 2.1: Build semantic similarity recommendation logic
  - Query pgvector for similar content chunks based on current content embeddings
  - Filter by content type (lectures, learning objectives, concepts)
  - Rank by cosine similarity score
  - Limit to top 5-10 most relevant results
- [ ] 2.2: Implement knowledge graph traversal for related concepts
  - Query ConceptRelationship table for prerequisite/related concepts
  - Traverse 2-3 hops from current concept
  - Weight by relationship strength and type (PREREQUISITE > RELATED > INTEGRATED)
  - Return content associated with related concepts
- [ ] 2.3: Create reasoning explanation generator
  - Generate human-readable explanations for recommendations
  - Templates: "Related to [current concept] via [relationship type]"
  - Examples: "Prerequisite for understanding cardiac conduction", "Similar topic from Physiology lecture 5"
  - Include similarity score and confidence level
- [ ] 2.4: Build recommendation API endpoint
  - GET `/api/recommendations?contextType=session&contextId=:id&limit=10`
  - Query params: contextType (session/objective/concept), contextId, limit, sourceTypes[]
  - Response: `{ recommendations: [{ content, score, reasoning, source }], total }`
  - Filter by content types if sourceTypes specified (lectures, first-aid, external)

### Task 3: Implement User Performance-Aware Recommendations (AC: #2)
- [ ] 3.1: Query user performance metrics from Story 2.2
  - Fetch PerformanceMetric for current user and related objectives
  - Identify weak areas (masteryLevel < 0.5) and strong areas (masteryLevel > 0.8)
  - Calculate complexity appropriateness: user's avg mastery level vs. content complexity
- [ ] 3.2: Adjust recommendation scores based on mastery level
  - Boost content for weak areas by 20-30%
  - Reduce content for mastered areas by 10-20%
  - Prioritize intermediate difficulty content (slightly above current mastery)
  - Zone of proximal development targeting: masteryLevel + 0.1 to masteryLevel + 0.3
- [ ] 3.3: Consider user's previous study history
  - Exclude recently studied content (within 24 hours) unless high-priority
  - Boost content related to objectives with low confidence ratings
  - Deprioritize content with poor user feedback ratings
- [ ] 3.4: Integrate with behavioral patterns from Epic 5 (future)
  - Placeholder for behavioral pattern integration
  - Design API contract for behavioral pattern service
  - Document integration points for Story 5.1 (Learning Pattern Recognition)

### Task 4: Build Collaborative Filtering for User Behavior Patterns (AC: #2, #6)
- [ ] 4.1: Track user interaction events with recommendations
  - BehavioralEvent entries: RECOMMENDATION_VIEWED, RECOMMENDATION_CLICKED, RECOMMENDATION_DISMISSED, RECOMMENDATION_RATED
  - eventData JSON: `{ recommendationId, contentId, score, timeOnContent, outcome }`
  - Track time spent on recommended content (indicates value)
- [ ] 4.2: Calculate user-item interaction matrix
  - Matrix: users × content items, values = interaction score (view=0.2, click=0.5, rate=1.0)
  - Use sparse matrix representation for efficiency
  - Update matrix incrementally as new interactions recorded
- [ ] 4.3: Implement simple collaborative filtering (MVP)
  - For single-user MVP: Prioritize content similar to positively-rated items
  - Store user preference vector based on rated content embeddings
  - Calculate weighted average of embeddings for liked content
  - Use preference vector for similarity search against candidate content
- [ ] 4.4: Design multi-user collaborative filtering (future)
  - Placeholder for user similarity calculation (cosine similarity between interaction vectors)
  - Document algorithm: Find similar users → Recommend content they engaged with
  - Design privacy-preserving approach (aggregated patterns, no individual data exposed)

### Task 5: Integrate Recommendations with Study Session Context (AC: #1, #7)
- [ ] 5.1: Create in-session recommendation widget
  - `RecommendationPanel` component for study page
  - Displays 3-5 recommendations based on current objective
  - Card UI: Title, source badge, similarity score, brief reasoning
  - Actions: View, Dismiss, Rate (thumbs up/down)
- [ ] 5.2: Implement contextual recommendation loading
  - Trigger recommendation fetch when objective changes
  - Include sessionId and objectiveId in recommendation context
  - Cache recommendations for current session (reduce API calls)
  - Preload recommendations for next objective in background
- [ ] 5.3: Add recommendation interactions to study flow
  - Click recommendation → Open content in new tab or modal viewer
  - Dismiss recommendation → Record dismissal, remove from view
  - Rate recommendation → Update feedback, trigger re-ranking
  - Track time spent viewing recommended content
- [ ] 5.4: Integrate with mission objectives from Story 2.4
  - Query current mission objectives for context
  - Recommend complementary content for upcoming objectives
  - Show "Prepare for next objective" recommendations
  - Filter recommendations to align with mission scope

### Task 6: Build Multi-Source Content Recommendations (AC: #3)
- [ ] 6.1: Define content source types
  - Enum: LECTURE, FIRST_AID, EXTERNAL_ARTICLE, CONCEPT_NOTE, USER_NOTE
  - Add `sourceType` field to ContentRecommendation model
  - Maintain source metadata (title, author, credibility score)
- [ ] 6.2: Implement First Aid cross-referencing from Story 3.3
  - Query First Aid content with similar embeddings
  - Map lecture concepts to First Aid sections
  - Prioritize high-yield First Aid content for board-relevant topics
  - Display First Aid recommendations with page numbers
- [ ] 6.3: Add external resource recommendations (future)
  - Placeholder for external resource integration
  - Define API contract for external content providers
  - Design credibility/authority scoring for external sources
  - Document integration points for Story 3.3 (First Aid) and Story 3.4 (Conflict Detection)
- [ ] 6.4: Create source-specific recommendation cards
  - First Aid card: Section, page, topic, high-yield badge
  - Lecture card: Course, lecture number, page, complexity
  - Concept card: Related concepts, prerequisite chain
  - External card: Source name, credibility score, relevance

### Task 7: Implement Recommendation Feedback and Improvement (AC: #5, #8)
- [ ] 7.1: Create recommendation rating UI
  - Thumbs up/down buttons on recommendation cards
  - Optional feedback dialog: "Why was this helpful/unhelpful?"
  - Quick dismiss action with "Not relevant" option
  - Batch dismiss: "Hide similar recommendations"
- [ ] 7.2: Build POST `/api/recommendations/:id/feedback` endpoint
  - Body: `{ rating: 1-5, feedback?: string, action: viewed/dismissed/rated }`
  - Update RecommendationFeedback table
  - Recalculate recommendation scores based on feedback
  - Response: `{ success: true, updatedScore }`
- [ ] 7.3: Implement feedback-driven re-ranking
  - Adjust scoring weights based on user feedback patterns
  - Positive feedback: Boost similar content by 15-20%
  - Negative feedback: Reduce similar content by 20-30%
  - Learn per-user content type preferences (lectures vs. First Aid vs. external)
- [ ] 7.4: Create recommendation effectiveness metrics
  - Track CTR (click-through rate) for recommendations
  - Measure time spent on recommended content (engagement)
  - Calculate conversion rate: recommendations → performance improvement
  - Dashboard showing recommendation quality over time

### Task 8: Build Adaptive Recommendation Personalization (AC: #6, #8)
- [ ] 8.1: Implement user preference learning
  - Track content type preferences (lectures, First Aid, videos, diagrams)
  - Identify optimal recommendation timing (early in session vs. mid-session)
  - Learn preferred recommendation count (3, 5, or 10 per page)
  - Store preferences in User or UserPreferences table
- [ ] 8.2: Create adaptive scoring algorithm
  - Adjust scoring weights based on user interaction history
  - Increase weight for preferred content types (e.g., First Aid if user clicks those more)
  - Adjust complexity targeting based on mastery progression
  - Time-decay factor: Recent feedback weighted higher (exponential decay, half-life = 7 days)
- [ ] 8.3: Implement A/B testing framework (future)
  - Design experiment framework for recommendation strategies
  - Track experiment assignments per user
  - Measure effectiveness: CTR, engagement, performance improvement
  - Document integration with analytics platform
- [ ] 8.4: Build machine learning model pipeline (future)
  - Placeholder for ML model training pipeline
  - Feature engineering: User demographics, interaction patterns, performance metrics
  - Model candidates: Gradient boosting, neural collaborative filtering
  - Evaluation metrics: Precision@K, Recall@K, NDCG
  - Document training/serving architecture

### Task 9: Design Recommendation Dashboard UI (AC: #1, #4, #5)
- [ ] 9.1: Create RecommendationPanel component
  - Collapsible sidebar or modal for recommendations
  - Header: "Related Content (5)" with expand/collapse toggle
  - Recommendation cards with hover states
  - Empty state: "No recommendations available yet"
- [ ] 9.2: Build recommendation card UI
  - Layout: Source badge, title, brief description, score badge
  - Reasoning: "Related via prerequisite relationship (85% similar)"
  - Actions: View, Dismiss (X icon), Rate (thumbs up/down)
  - Visual indicators: Color-coded by source type, complexity badge
- [ ] 9.3: Implement recommendation interactions
  - Click card → Open content in modal or new tab
  - Hover → Show full reasoning and content preview
  - Dismiss → Fade out animation, record dismissal
  - Rate → Update UI immediately, show "Thanks for feedback" toast
- [ ] 9.4: Add recommendation preferences UI
  - Settings page section: "Content Recommendations"
  - Toggles: Auto-show recommendations, Preferred sources, Recommendation count
  - Sliders: Complexity level (easier → harder), Recency bias (older → newer)
  - Save preferences → Update UserPreferences, apply immediately

### Task 10: Integrate with Daily Missions (AC: #7)
- [ ] 10.1: Add mission-aware recommendation context
  - Include current mission objectives in recommendation request
  - Filter recommendations to align with mission scope
  - Prioritize content for upcoming mission objectives
  - Show "Mission related" badge on relevant recommendations
- [ ] 10.2: Build pre-mission recommendation preview
  - GET `/api/recommendations/mission-preview?missionId=:id`
  - Returns recommendations for all mission objectives
  - Display in mission briefing page
  - "Prepare for today's mission" section with 5-10 recommendations
- [ ] 10.3: Create post-objective recommendations
  - After completing objective → Show "What's next?" recommendations
  - Recommend content for next mission objective
  - Suggest related concepts for deeper understanding
  - Option to "Explore now" or "Save for later"
- [ ] 10.4: Track mission-recommendation correlation
  - Measure: Do users who engage with recommendations complete missions faster?
  - Analyze: Correlation between recommendation engagement and mission success rate
  - Store analytics in MissionAnalytics from Story 2.6
  - Display insights in mission performance dashboard

### Task 11: Implement Recommendation Caching and Performance (AC: #1)
- [ ] 11.1: Design recommendation cache strategy
  - Cache recommendations per session-objective pair
  - TTL: 15 minutes (balance freshness vs. performance)
  - Invalidate cache on user feedback (re-rank needed)
  - Use Redis or in-memory cache for MVP
- [ ] 11.2: Optimize recommendation queries
  - Index embeddings for fast pgvector similarity search
  - Batch recommendation generation (all objectives in session)
  - Precompute recommendations for common objectives
  - Materialized view for frequently accessed knowledge graph paths
- [ ] 11.3: Implement lazy loading for recommendations
  - Initial page load: Show 3 recommendations
  - Scroll trigger: Load next 5 recommendations
  - Infinite scroll or "Load more" button
  - Skeleton UI during loading
- [ ] 11.4: Add performance monitoring
  - Track recommendation query latency (target <500ms)
  - Monitor cache hit rate (target >70%)
  - Alert on slow queries (>1s)
  - Dashboard showing recommendation API performance

### Task 12: Build Recommendation Analytics Backend (AC: #8)
- [ ] 12.1: Create recommendation analytics models
  - `RecommendationAnalytics` table: userId, date, totalRecommendations, clickedCount, dismissedCount, avgRating
  - Aggregate daily/weekly/monthly statistics
  - Track per-content-type performance (lectures vs. First Aid CTR)
- [ ] 12.2: Implement analytics calculation service
  - Daily job: Calculate recommendation metrics for previous day
  - Aggregate: CTR, engagement time, rating distribution, improvement correlation
  - Store in RecommendationAnalytics table
  - Trigger model retraining if performance degrades (future)
- [ ] 12.3: Create analytics API endpoints
  - GET `/api/analytics/recommendations?period=7d`
  - Response: `{ ctr, avgRating, engagementTime, topSources, improvementCorrelation }`
  - Used for recommendation dashboard in settings
- [ ] 12.4: Build recommendation effectiveness dashboard
  - Chart: CTR over time (line chart)
  - Chart: Content type preferences (pie chart)
  - Chart: Recommendation engagement vs. performance improvement (scatter plot)
  - Table: Top recommended content by engagement

### Task 13: Testing and Validation (AC: All)
- [ ] 13.1: Test semantic recommendation accuracy
  - Manually verify recommendations for sample objectives
  - Check semantic similarity scores (should be >0.7 for top recommendations)
  - Validate reasoning explanations are clear and accurate
  - Test edge cases: No related content, single content item, new user
- [ ] 13.2: Test user performance-aware adjustments
  - Verify weak area content is boosted correctly
  - Test mastery level filtering (appropriate difficulty)
  - Check exclusion of recently studied content
  - Validate zone of proximal development targeting
- [ ] 13.3: Test collaborative filtering logic (single-user MVP)
  - Verify positive feedback boosts similar content
  - Check negative feedback reduces similar content
  - Test preference vector calculation
  - Validate interaction matrix updates
- [ ] 13.4: Test recommendation UI interactions
  - Click recommendation → Content opens correctly
  - Dismiss → Removed from view, recorded in database
  - Rate → Feedback saved, scores updated
  - Test on mobile (touch targets, responsive layout)
- [ ] 13.5: Test mission integration
  - Verify mission context influences recommendations
  - Check pre-mission preview recommendations
  - Test post-objective recommendations
  - Validate mission-recommendation correlation tracking
- [ ] 13.6: Performance testing
  - Recommendation query latency <500ms for typical requests
  - Cache hit rate >70% after warm-up
  - UI renders recommendations <100ms after fetch
  - No memory leaks from recommendation caching
- [ ] 13.7: Test multi-source recommendations
  - Verify lectures, First Aid, concepts appear correctly
  - Check source badges and metadata display
  - Test filtering by source type
  - Validate credibility scoring (when implemented)
- [ ] 13.8: TypeScript compilation verification
  - Run `pnpm tsc` to verify 0 errors
  - Fix any type errors in recommendation logic

## Dev Notes

### Architecture References

- **Solution Architecture:** `/Users/kyin/Projects/Americano-epic3/docs/solution-architecture.md`
  - Subsystem 3: Knowledge Graph & Semantic Search - RecommendationEngine (lines 549-575)
  - Database Schema: Concept, ConceptRelationship models (lines 972-1012)
  - API Architecture: `/api/graph/*` endpoints (lines 1330-1368)
  - Behavioral Analytics: User behavior tracking (lines 1074-1134)

- **PRD:** `/Users/kyin/Projects/Americano-epic3/docs/PRD-Americano-2025-10-14.md`
  - FR15: Search & Discovery Engine - Recommendation engine (lines 169-175)

- **Epic Breakdown:** `/Users/kyin/Projects/Americano-epic3/docs/epics-Americano-2025-10-14.md`
  - Story 3.5 Details: Lines 470-491

### Recommendation Engine Architecture

**Hybrid Recommendation Approach:**
```typescript
// Recommendation Engine combines multiple strategies

1. Content-Based Filtering (70% weight for MVP):
   - Semantic similarity using pgvector embeddings
   - Knowledge graph traversal for related concepts
   - Prerequisite relationship weighting
   - Content complexity matching

2. Collaborative Filtering (30% weight for MVP):
   - User interaction patterns (viewed, clicked, rated)
   - Preference vector based on liked content
   - Time spent on content (engagement signal)
   - Single-user approach (multi-user future enhancement)

3. Performance-Aware Adjustments:
   - Weak area boosting (+20-30%)
   - Mastery level filtering
   - Zone of proximal development targeting
   - Recent content exclusion

4. Feedback Loop:
   - Real-time score adjustments based on user ratings
   - Preference learning from interaction patterns
   - Adaptive weighting of scoring factors
   - Continuous improvement through analytics
```

### Scoring Algorithm (MVP)

```typescript
interface RecommendationScore {
  semanticSimilarity: number;    // 40% weight (cosine similarity 0-1)
  prerequisiteRelation: number;  // 20% weight (0=none, 1=direct prereq)
  masteryAlignment: number;      // 20% weight (1 - |userMastery - contentComplexity|)
  recency: number;               // 10% weight (1 / days since last viewed, max 30 days)
  userFeedback: number;          // 10% weight (avg rating 0-1, or 0.5 if no feedback)
}

function calculateFinalScore(scores: RecommendationScore): number {
  return (
    scores.semanticSimilarity * 0.4 +
    scores.prerequisiteRelation * 0.2 +
    scores.masteryAlignment * 0.2 +
    scores.recency * 0.1 +
    scores.userFeedback * 0.1
  );
}

// Minimum threshold: 0.6 (filter out low-quality recommendations)
// Top-K: Return top 10 recommendations per request
```

### Recommendation Flow

**1. User Studying Objective (e.g., "Cardiac Conduction System"):**
```typescript
// Triggered when user enters study session for objective
const currentObjective = await getObjective(objectiveId);
const currentEmbedding = await getEmbedding(currentObjective.content);
const userMastery = await getUserMasteryLevel(userId, currentObjective);

// Generate recommendations
const recommendations = await recommendationEngine.generate({
  userId,
  contextType: 'objective',
  contextId: objectiveId,
  sessionId,
  currentEmbedding,
  userMastery,
  limit: 10
});
```

**2. Semantic Search Phase:**
```sql
-- pgvector similarity search
SELECT
  c.id, c.content, c.lectureId, c.pageNumber,
  1 - (c.embedding <=> :currentEmbedding) AS similarity
FROM content_chunks c
WHERE 1 - (c.embedding <=> :currentEmbedding) > 0.7
  AND c.id NOT IN (
    -- Exclude recently viewed content (24 hours)
    SELECT contentId FROM user_content_views
    WHERE userId = :userId AND viewedAt > NOW() - INTERVAL '24 hours'
  )
ORDER BY similarity DESC
LIMIT 20;
```

**3. Knowledge Graph Traversal:**
```typescript
// Find related concepts via knowledge graph
const relatedConcepts = await prisma.conceptRelationship.findMany({
  where: {
    OR: [
      { fromConceptId: currentConcept.id },
      { toConceptId: currentConcept.id }
    ],
    relationship: { in: ['PREREQUISITE', 'RELATED', 'INTEGRATED'] }
  },
  include: {
    fromConcept: { include: { contentChunks: true } },
    toConcept: { include: { contentChunks: true } }
  }
});

// Score relationships: PREREQUISITE (1.0) > RELATED (0.7) > INTEGRATED (0.5)
```

**4. Performance-Aware Filtering:**
```typescript
// Filter by mastery alignment
const userMastery = 0.6; // Current mastery level
const targetComplexity = userMastery + 0.2; // Zone of proximal development

const filteredRecommendations = candidateRecommendations
  .filter(rec => {
    const complexityDiff = Math.abs(rec.complexity - targetComplexity);
    return complexityDiff < 0.3; // Only show content within complexity range
  })
  .map(rec => {
    // Boost weak area content
    if (rec.objectiveId && userWeakAreas.includes(rec.objectiveId)) {
      rec.score *= 1.25; // 25% boost
    }
    return rec;
  });
```

**5. Re-Ranking with Feedback:**
```typescript
// Adjust scores based on user feedback
for (const rec of recommendations) {
  const userFeedback = await getUserFeedbackForSimilarContent(userId, rec.contentId);

  if (userFeedback.avgRating >= 4) {
    rec.score *= 1.15; // 15% boost for highly rated similar content
  } else if (userFeedback.avgRating <= 2) {
    rec.score *= 0.7; // 30% penalty for poorly rated similar content
  }
}

// Sort by final score
recommendations.sort((a, b) => b.score - a.score);
```

**6. Response Format:**
```typescript
interface RecommendationResponse {
  recommendations: Array<{
    id: string;
    content: {
      id: string;
      title: string;
      type: 'lecture' | 'first-aid' | 'concept' | 'external';
      pageNumber?: number;
      lectureTitle?: string;
    };
    score: number; // 0-1
    reasoning: string;
    source: string;
    actions: {
      view: string; // URL or action
      dismiss: boolean;
      rate: boolean;
    };
  }>;
  total: number;
  context: {
    sessionId: string;
    objectiveId: string;
    userMastery: number;
  };
}
```

### Integration with Study Session Context (Story 2.5)

**Study Page Integration:**
```
┌─────────────────────────────────────────────────┐
│ Current Objective: Cardiac Conduction System    │
│ [Content Viewer]                                │
│                                                 │
│ ┌─ Recommended Content ──────────────────┐     │
│ │ 📚 Related Topics (5)                  │     │
│ │ [Collapse ▼]                            │     │
│ │                                         │     │
│ │ ┌─ Lecture: Cardiac Physiology ─────┐  │     │
│ │ │ 🔵 Lecture • Page 23 • 87% similar │  │     │
│ │ │ "Prerequisite for understanding    │  │     │
│ │ │  cardiac conduction"               │  │     │
│ │ │ [View] [👍👎] [✕ Dismiss]          │  │     │
│ │ └────────────────────────────────────┘  │     │
│ │                                         │     │
│ │ ┌─ First Aid: Cardiovascular ────────┐  │     │
│ │ │ 📘 First Aid • p.312 • High-Yield  │  │     │
│ │ │ "Board-relevant summary of         │  │     │
│ │ │  conduction pathways"              │  │     │
│ │ │ [View] [👍👎] [✕ Dismiss]          │  │     │
│ │ └────────────────────────────────────┘  │     │
│ │                                         │     │
│ │ ┌─ Concept: SA Node ─────────────────┐  │     │
│ │ │ 🔗 Related Concept • 82% similar   │  │     │
│ │ │ "Directly related via INTEGRATED   │  │     │
│ │ │  relationship"                     │  │     │
│ │ │ [View] [👍👎] [✕ Dismiss]          │  │     │
│ │ └────────────────────────────────────┘  │     │
│ │                                         │     │
│ │ [Load More (5 remaining)]              │     │
│ └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

### Machine Learning Pipeline (Future Enhancement)

**Phase 1 (Story 3.5 MVP): Rule-Based + Simple Collaborative**
- Semantic similarity using embeddings
- Knowledge graph traversal
- Performance-aware filtering
- Single-user preference learning

**Phase 2 (Epic 5 Integration): Behavioral Pattern Integration**
- Learning pattern analysis from Story 5.1
- Optimal timing recommendations
- Cognitive load-aware suggestions
- Personalized complexity targeting

**Phase 3 (Post-MVP): Advanced ML Models**
- Neural collaborative filtering (NCF)
- Gradient boosting for score prediction
- Multi-armed bandit for exploration-exploitation
- Online learning for real-time adaptation

**Model Training Pipeline (Future):**
```typescript
// Offline training (weekly batch)
1. Feature Engineering:
   - User demographics (school, year, courses)
   - Interaction history (views, clicks, ratings, time spent)
   - Performance metrics (mastery levels, assessment scores)
   - Content features (embeddings, complexity, type, source)

2. Model Training:
   - Train/test split: 80/20 (temporal split)
   - Models: LightGBM, XGBoost, Neural Network
   - Loss function: Ranking loss (pairwise or listwise)
   - Evaluation: Precision@K, Recall@K, NDCG, MRR

3. Model Serving:
   - Deploy to inference service (FastAPI microservice)
   - Fallback to rule-based if model unavailable
   - A/B testing framework for gradual rollout
   - Monitor model performance and drift

4. Feedback Loop:
   - Collect user interactions (implicit + explicit feedback)
   - Retrain model weekly with new data
   - Evaluate improvement in recommendation quality
   - Adapt scoring weights based on performance
```

### Data Models

```typescript
// New Prisma models for recommendations

model ContentRecommendation {
  id                  String   @id @default(cuid())
  userId              String
  recommendedContentId String
  sourceContentId     String?  // Content that triggered recommendation
  score               Float    // 0.0 to 1.0
  reasoning           String   // Human-readable explanation
  status              RecommendationStatus @default(PENDING)
  contextType         String   // 'session', 'objective', 'mission'
  contextId           String   // sessionId, objectiveId, missionId
  createdAt           DateTime @default(now())
  viewedAt            DateTime?
  dismissedAt         DateTime?

  // Relations
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  recommendedContent  ContentChunk @relation("RecommendedContent", fields: [recommendedContentId], references: [id], onDelete: Cascade)
  sourceContent       ContentChunk? @relation("SourceContent", fields: [sourceContentId], references: [id], onDelete: SetNull)
  feedback            RecommendationFeedback[]

  @@index([userId])
  @@index([status])
  @@index([contextType, contextId])
  @@index([createdAt])
  @@map("content_recommendations")
}

enum RecommendationStatus {
  PENDING
  VIEWED
  DISMISSED
  RATED
}

model RecommendationFeedback {
  id                String   @id @default(cuid())
  recommendationId  String
  userId            String
  rating            Int      // 1-5 stars
  feedbackText      String?  @db.Text
  helpful           Boolean? // Was this recommendation helpful?
  createdAt         DateTime @default(now())

  // Relations
  recommendation    ContentRecommendation @relation(fields: [recommendationId], references: [id], onDelete: Cascade)
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([recommendationId])
  @@index([userId])
  @@index([createdAt])
  @@map("recommendation_feedback")
}

model RecommendationAnalytics {
  id                    String   @id @default(cuid())
  userId                String
  date                  DateTime @default(now())
  totalRecommendations  Int
  viewedCount           Int
  clickedCount          Int
  dismissedCount        Int
  avgRating             Float?
  avgEngagementTimeMs   Int?
  topSourceTypes        Json     // Array of {type, count}

  @@unique([userId, date])
  @@index([userId])
  @@index([date])
  @@map("recommendation_analytics")
}

// Extend existing models

model User {
  // ... existing fields
  recommendations       ContentRecommendation[] @relation("UserRecommendations")
  recommendationFeedback RecommendationFeedback[]
}

model ContentChunk {
  // ... existing fields
  recommendationsFrom   ContentRecommendation[] @relation("SourceContent")
  recommendationsTo     ContentRecommendation[] @relation("RecommendedContent")
}
```

### API Endpoints

```typescript
// Recommendation API routes

GET /api/recommendations
Query params:
  - contextType: 'session' | 'objective' | 'mission'
  - contextId: string
  - limit: number (default 10, max 50)
  - sourceTypes: string[] (filter by content type)
  - excludeRecent: boolean (default true, exclude content viewed in 24h)
Response: { recommendations: RecommendationResponse[], total: number }

POST /api/recommendations/:id/feedback
Body: { rating: 1-5, feedbackText?: string, helpful?: boolean }
Response: { success: true, updatedScore: number }

POST /api/recommendations/:id/dismiss
Response: { success: true }

POST /api/recommendations/:id/view
Response: { success: true }

GET /api/recommendations/mission-preview
Query params: missionId: string
Response: { objectives: Array<{ objectiveId, recommendations: [] }> }

GET /api/analytics/recommendations
Query params: period: '7d' | '30d' | '90d'
Response: {
  ctr: number,
  avgRating: number,
  avgEngagementTimeMs: number,
  topSources: Array<{ type, count }>,
  improvementCorrelation: number
}
```

### Technical Constraints

1. **Performance:** Recommendation queries must complete <500ms for typical requests (semantic search + graph traversal + scoring)
2. **Caching:** Cache recommendations per session-objective pair (TTL 15 min), invalidate on feedback
3. **Batch Processing:** Precompute recommendations for common objectives (background job, weekly)
4. **Privacy:** User feedback and interaction data private, no cross-user data exposure in MVP
5. **Scalability:** Design for multi-user expansion (collaborative filtering infrastructure ready)
6. **Accuracy:** Minimum recommendation score threshold 0.6 (filter out low-quality suggestions)
7. **Freshness:** Exclude recently viewed content (24h window) unless high-priority
8. **Diversity:** Top-K recommendations should include mix of content types (lectures, First Aid, concepts)

### Testing Strategy

**Unit Tests:**
- Scoring algorithm correctness (weighted sum, thresholds)
- Semantic similarity calculation (pgvector queries)
- Knowledge graph traversal logic (relationship weighting)
- Performance-aware filtering (mastery alignment, complexity matching)
- Feedback-driven re-ranking (score adjustments)

**Integration Tests:**
- End-to-end recommendation flow (request → scoring → filtering → response)
- Multi-source recommendations (lectures + First Aid + concepts)
- Mission context integration (mission-aware recommendations)
- User feedback loop (rating → score update → re-ranking)
- Cache invalidation (feedback triggers recalculation)

**Performance Tests:**
- Query latency <500ms for 10 recommendations
- Cache hit rate >70% after warm-up
- Concurrent requests (100 users simultaneously)
- Large knowledge graph (1000+ concepts, 10000+ relationships)

**User Acceptance Tests:**
- Recommendation relevance (manual review by medical students)
- Reasoning clarity (explanations understandable)
- UI usability (click, dismiss, rate actions work smoothly)
- Mobile responsiveness (touch targets, layout)

**Edge Cases:**
- No related content available (graceful empty state)
- Single content item (no recommendations possible)
- New user with no history (cold start problem)
- All recommendations dismissed (refresh suggestions)
- Network error during feedback submission (retry logic)

### Performance Optimizations

1. **Embedding Indexing:** pgvector IVFFLAT index on ContentChunk.embedding (lists=100)
2. **Graph Query Optimization:** Indexed ConceptRelationship queries (fromConceptId, toConceptId)
3. **Caching Strategy:** Redis cache for session-objective recommendations (TTL 15 min)
4. **Batch Precomputation:** Weekly job precomputes recommendations for top 100 objectives
5. **Lazy Loading:** Load 3 recommendations initially, fetch more on scroll/click
6. **Connection Pooling:** Prisma connection pool (max 10 connections)
7. **Query Batching:** Batch recommendation queries for all objectives in session
8. **CDN Caching:** Cache recommendation UI assets (static resources)

### Integration Points

**With Story 2.2 (Performance Tracking):**
- Query PerformanceMetric for user mastery levels
- Boost recommendations for weak areas
- Filter by complexity appropriateness

**With Story 2.4 (Daily Missions):**
- Mission-aware recommendation context
- Pre-mission recommendation preview
- Post-objective "What's next?" suggestions

**With Story 2.5 (Study Sessions):**
- In-session recommendation widget
- Contextual loading based on current objective
- Track recommendation engagement in session analytics

**With Story 2.6 (Mission Analytics):**
- Correlation between recommendation engagement and mission success
- Analytics for recommendation effectiveness

**With Story 3.1 (Semantic Search):**
- Reuse embedding generation and similarity search logic
- Share pgvector queries and indexes

**With Story 3.2 (Knowledge Graph):**
- Graph traversal for related concepts
- Prerequisite relationship weighting
- Concept-based recommendations

**With Story 3.3 (First Aid Integration):**
- Cross-reference lecture content with First Aid sections
- Prioritize high-yield First Aid content
- Multi-source recommendations

**With Epic 5 (Behavioral Learning Twin) - Future:**
- Story 5.1: Learning pattern-aware recommendations
- Story 5.2: Predictive recommendations for struggle areas
- Story 5.3: Optimal timing for recommendations
- Story 5.4: Cognitive load-aware suggestion throttling

### User Experience Considerations

**Discovery vs. Interruption:**
- Recommendations visible but not intrusive (collapsible sidebar)
- User controls when to view recommendations (expand on demand)
- No auto-popups or interruptions during study flow

**Trust and Transparency:**
- Clear reasoning for each recommendation (e.g., "Prerequisite for understanding X")
- Similarity score visible (builds trust in relevance)
- User can dismiss irrelevant recommendations (control over suggestions)
- Feedback loop visible (rating improves future recommendations)

**Personalization:**
- Recommendations adapt to user mastery level (appropriate difficulty)
- Content type preferences learned over time (lectures vs. First Aid)
- Feedback-driven improvement (positive ratings → more similar content)

**Cognitive Load:**
- Limit recommendations to 3-5 per page (avoid overwhelming)
- Clear visual hierarchy (most relevant at top)
- Quick actions (dismiss, rate) reduce decision fatigue
- "Load more" option for exploration without clutter

### References

- **Source:** Epic 3, Story 3.5 (epics-Americano-2025-10-14.md:470-491)
- **Source:** Solution Architecture, RecommendationEngine (solution-architecture.md:549-575)
- **Source:** PRD FR15 Search & Discovery (PRD-Americano-2025-10-14.md:169-175)
- **Source:** Story 2.2 for Performance Tracking integration
- **Source:** Story 2.4 for Mission integration
- **Source:** Story 2.5 for Study Session integration
- **Source:** Story 3.1 for Semantic Search integration
- **Source:** Story 3.2 for Knowledge Graph integration

## Dev Agent Record

### Context Reference

Context file to be generated by Bob (Scrum Master) during story kickoff.

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Implementation Notes

Story 3.5 creates a sophisticated recommendation engine combining content-based filtering (semantic similarity, knowledge graph traversal) with collaborative filtering (user interaction patterns). The MVP focuses on single-user recommendations with a clear path to multi-user collaborative filtering.

**Key Technical Decisions:**
1. **Hybrid Approach:** 70% content-based + 30% collaborative for MVP (adjust based on analytics)
2. **Scoring Algorithm:** Multi-factor weighted scoring (semantic similarity 40%, prerequisites 20%, mastery alignment 20%, recency 10%, feedback 10%)
3. **Performance:** Caching strategy (Redis, 15-min TTL) + pgvector indexing for <500ms queries
4. **ML Pipeline:** Rule-based MVP with clear path to gradient boosting/neural CF in post-MVP
5. **Integration:** Deep integration with study sessions (Story 2.5), missions (Story 2.4), performance tracking (Story 2.2)

**Quality Debt to Address:**
- Implement A/B testing framework for recommendation strategies
- Add comprehensive unit tests for scoring algorithm
- Optimize knowledge graph traversal for large graphs (1000+ concepts)
- Build ML training pipeline for advanced personalization (Epic 5)

### File List

**To Be Created:**
- `apps/web/prisma/migrations/[timestamp]_story_3_5_recommendations/` - Database migration for recommendation models
- `apps/web/src/lib/recommendation-engine.ts` - Core recommendation engine with hybrid strategies
- `apps/web/src/lib/recommendation-strategies.ts` - Semantic, collaborative, and hybrid strategies
- `apps/web/src/lib/recommendation-scorer.ts` - Multi-factor scoring algorithm
- `apps/web/src/components/recommendations/recommendation-panel.tsx` - Collapsible recommendation sidebar
- `apps/web/src/components/recommendations/recommendation-card.tsx` - Individual recommendation card UI
- `apps/web/src/components/recommendations/recommendation-feedback-dialog.tsx` - Rating and feedback UI
- `apps/web/src/app/api/recommendations/route.ts` - GET recommendations endpoint
- `apps/web/src/app/api/recommendations/[id]/feedback/route.ts` - POST feedback endpoint
- `apps/web/src/app/api/recommendations/[id]/dismiss/route.ts` - POST dismiss endpoint
- `apps/web/src/app/api/recommendations/[id]/view/route.ts` - POST view tracking endpoint
- `apps/web/src/app/api/recommendations/mission-preview/route.ts` - GET mission recommendations endpoint
- `apps/web/src/app/api/analytics/recommendations/route.ts` - GET recommendation analytics endpoint

**To Be Modified:**
- `apps/web/prisma/schema.prisma` - Add ContentRecommendation, RecommendationFeedback, RecommendationAnalytics models
- `apps/web/src/app/study/page.tsx` - Integrate RecommendationPanel component
- `apps/web/src/app/settings/page.tsx` - Add recommendation preferences section
- `apps/web/src/store/use-session-store.ts` - Add recommendation state management

**To Be Referenced:**
- `apps/web/src/lib/db.ts` - Prisma client for recommendation queries
- `apps/web/src/lib/embeddings.ts` - Reuse embedding generation from Story 3.1
- `apps/web/src/app/api/graph/search/route.ts` - Reuse semantic search logic from Story 3.1
- `apps/web/src/lib/performance-calculator.ts` - Query user mastery levels from Story 2.2
- `apps/web/src/lib/mission-generator.ts` - Mission context for recommendations from Story 2.4

## Senior Developer Review (AI)

Review to be completed after implementation.

**Review Checklist:**
- [ ] Recommendation accuracy: Manual review of sample recommendations by medical students
- [ ] Scoring algorithm correctness: Unit tests for weighted scoring, thresholds, edge cases
- [ ] Performance: Query latency <500ms, cache hit rate >70%
- [ ] UI/UX: Mobile responsiveness, touch targets 44px+, glassmorphism design compliance
- [ ] Integration: Study session context, mission awareness, performance tracking
- [ ] Security: User data privacy, no cross-user data exposure in MVP
- [ ] Code quality: TypeScript strict mode, 0 compilation errors, Biome linting passed
- [ ] Documentation: API endpoints documented, data models explained, algorithm rationale clear
