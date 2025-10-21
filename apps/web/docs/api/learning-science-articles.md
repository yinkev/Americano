# Learning Science Articles API

**Story 5.6, Task 11** - Educational content with personalized behavioral insights

---

## Quick Start

### 1. Setup Database

```bash
# Run migration
npx prisma migrate dev --name add-learning-articles

# Generate Prisma client
npx prisma generate

# Seed articles
npx tsx apps/web/prisma/seed-learning-articles.ts
```

### 2. Fetch Article

```bash
# Get article with personalization
curl "http://localhost:3000/api/analytics/behavioral-insights/learning-science/spaced-repetition-science?userId=kevy@americano.dev"
```

---

## API Reference

### Endpoint

```
GET /api/analytics/behavioral-insights/learning-science/:articleId?userId={userId}
```

### Available Articles

| Slug | Category | Personalization | Reading Time |
|------|----------|-----------------|--------------|
| `spaced-repetition-science` | SPACED_REPETITION | Forgetting curve | 7 min |
| `active-recall-benefits` | ACTIVE_RECALL | Recall performance | 8 min |
| `vark-learning-styles` | LEARNING_STYLES | VARK profile | 9 min |
| `cognitive-load-theory` | COGNITIVE_LOAD | Session intensity | 10 min |
| `circadian-rhythms-optimal-timing` | CIRCADIAN_RHYTHMS | Chronotype & peaks | 11 min |

### Response Structure

```typescript
{
  success: true,
  data: {
    article: LearningArticle & { content: string }, // Personalized content
    personalizedSections: {
      forgettingCurve?: { R0, k, halfLife, optimalIntervals },
      varkProfile?: { visual, auditory, reading, kinesthetic },
      optimalTimes?: { chronotype, performancePeaks },
      recallPerformance?: { accuracy, trend, weeklyData },
      cognitiveLoad?: { loadLevel, intensity, metrics }
    },
    readStatus: {
      hasRead: boolean,
      firstReadAt?: Date,
      lastReadAt: Date,
      completedRead: boolean,
      helpful?: boolean,
      rating?: number
    }
  }
}
```

---

## Personalization Types

### 1. Forgetting Curve (Spaced Repetition)
- **Data Source:** `UserLearningProfile.personalizedForgettingCurve`
- **Requirements:** 6+ weeks, 20+ sessions
- **Injected:** R₀, k-value, half-life, optimal review intervals

### 2. VARK Profile (Learning Styles)
- **Data Source:** `UserLearningProfile.learningStyleProfile`
- **Requirements:** 20+ study sessions
- **Injected:** V/A/R/K percentages, dominant style, recommendations

### 3. Optimal Study Times (Circadian Rhythms)
- **Data Source:** `BehavioralPattern` (OPTIMAL_STUDY_TIME)
- **Requirements:** 15+ sessions, confidence ≥0.6
- **Injected:** Chronotype (Lark/Owl/Hummingbird), peak windows

### 4. Recall Performance (Active Recall)
- **Data Source:** `Review` records (last 30 days)
- **Requirements:** 20+ reviews
- **Injected:** Accuracy, trends, weekly data, recommendations

### 5. Cognitive Load
- **Data Source:** `StudySession` metrics (last 30 days)
- **Requirements:** 10+ completed sessions
- **Injected:** Load level, intensity, optimization tips

---

## Frontend Integration Example

```typescript
// Fetch article
async function fetchArticle(slug: string) {
  const userId = 'kevy@americano.dev' // Replace with actual userId
  const response = await fetch(
    `/api/analytics/behavioral-insights/learning-science/${slug}?userId=${userId}`
  )
  const { data } = await response.json()

  return {
    article: data.article,
    personalizedData: data.personalizedSections,
    readStatus: data.readStatus
  }
}

// Render article
function ArticlePage({ slug }: { slug: string }) {
  const { article, personalizedData, readStatus } = await fetchArticle(slug)

  return (
    <div>
      <h1>{article.title}</h1>
      <p>{article.summary}</p>

      {/* Render Markdown content with personalized sections */}
      <Markdown>{article.content}</Markdown>

      {/* Show read status */}
      {readStatus.hasRead && (
        <p>Last read: {new Date(readStatus.lastReadAt).toLocaleDateString()}</p>
      )}

      {/* External links */}
      <h3>Further Reading</h3>
      <ul>
        {article.externalLinks.map(link => (
          <li key={link.url}>
            <a href={link.url} target="_blank">{link.title}</a>
            <p>{link.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Database Schema

### LearningArticle

```prisma
model LearningArticle {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  category    ArticleCategory
  summary     String
  content     String   @db.Text

  personalizedSections Json?
  externalLinks Json?

  readingTimeMinutes Int  @default(5)
  difficulty        String @default("BEGINNER")
  tags              String[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime @default(now())

  articleReads ArticleRead[]
}
```

### ArticleRead

```prisma
model ArticleRead {
  id         String   @id @default(cuid())
  userId     String
  articleId  String

  readAt     DateTime @default(now())
  readDurationSeconds Int?
  completedRead Boolean @default(false)

  helpful    Boolean?
  rating     Int?
  feedback   String?

  article    LearningArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])
}
```

---

## Testing

### Test Cases

1. **Valid article fetch**
   ```bash
   curl "localhost:3000/api/analytics/behavioral-insights/learning-science/spaced-repetition-science?userId=test"
   # Expect: 200 with article
   ```

2. **Invalid slug**
   ```bash
   curl "localhost:3000/api/analytics/behavioral-insights/learning-science/invalid?userId=test"
   # Expect: 404 Not Found
   ```

3. **Missing userId**
   ```bash
   curl "localhost:3000/api/analytics/behavioral-insights/learning-science/spaced-repetition-science"
   # Expect: 400 Bad Request
   ```

4. **Personalization with data**
   - User with UserLearningProfile → See personalized sections
   - User with BehavioralPattern → See optimal times
   - User with Reviews → See recall performance

5. **Personalization without data**
   - New user → See "insufficient data" messages
   - Article still readable with general content

### Manual Testing Checklist

- [ ] All 5 articles seed successfully
- [ ] Each article has correct category
- [ ] Personalization works for users with data
- [ ] Fallback works for users without data
- [ ] ArticleRead tracking creates/updates correctly
- [ ] readStatus reflects accurate state
- [ ] External links are valid
- [ ] Content renders properly (Markdown)

---

## Future Enhancements

### Phase 2: Completion & Feedback
```typescript
// Mark article as completed
PATCH /learning-science/:articleId/complete
Body: { readDurationSeconds: 420 }

// Submit feedback
POST /learning-science/:articleId/feedback
Body: { helpful: true, rating: 5, feedback: "Very helpful!" }
```

### Phase 3: Recommendations
```typescript
// Get recommended articles based on patterns
GET /learning-science/recommendations?userId={userId}

// Returns: Articles ranked by relevance to user's behavioral data
// - Steep forgetting curve → Spaced Repetition
// - Low recall accuracy → Active Recall
// - High cognitive load → Cognitive Load Theory
```

### Phase 4: Browse & Search
```typescript
// List all articles
GET /learning-science?category=SPACED_REPETITION&difficulty=BEGINNER

// Search articles
GET /learning-science/search?q=memory&tags=retention
```

---

## Troubleshooting

### Issue: Personalization not showing

**Check:**
1. User has sufficient data (see requirements above)
2. `UserLearningProfile` exists for user
3. `BehavioralPattern` has confidence ≥0.6
4. Review/StudySession records exist

**Debug:**
```typescript
// Check user data
const profile = await prisma.userLearningProfile.findUnique({
  where: { userId: 'test' }
})
console.log('Profile:', profile)

const patterns = await prisma.behavioralPattern.findMany({
  where: { userId: 'test', confidence: { gte: 0.6 } }
})
console.log('Patterns:', patterns)
```

### Issue: Article not found (404)

**Check:**
1. Article slug is correct (lowercase, hyphenated)
2. Articles are seeded: `npx tsx prisma/seed-learning-articles.ts`
3. Database migration ran: `npx prisma migrate dev`

### Issue: ArticleRead not tracking

**Check:**
1. userId is valid
2. articleId exists
3. Unique constraint not violated
4. Database connection is working

---

## Files Reference

```
/apps/web/
├── prisma/
│   ├── schema.prisma                    # Models: LearningArticle, ArticleRead
│   └── seed-learning-articles.ts        # 5 articles seed data
│
├── src/app/api/analytics/behavioral-insights/
│   └── learning-science/
│       └── [articleId]/
│           └── route.ts                 # GET endpoint
│
└── docs/api/
    └── learning-science-articles.md    # This file
```

---

## Support

For issues or questions:
1. Check this documentation
2. Review implementation summary: `/STORY-5.6-TASK-11-IMPLEMENTATION-SUMMARY.md`
3. Check Prisma schema: `/apps/web/prisma/schema.prisma`
4. Inspect seed data: `/apps/web/prisma/seed-learning-articles.ts`
