/**
 * GET /api/analytics/behavioral-insights/learning-science/:articleId
 *
 * Returns learning science article with personalized "Your Data" sections
 * Tracks article engagement via ArticleRead model
 *
 * Story 5.6: Behavioral Insights Dashboard - Task 11 (Learning Science Articles)
 */

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { errorResponse, successResponse, withErrorHandler } from '@/lib/api-response'
import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { LearningStyleProfile, PersonalizedForgettingCurve } from '@/types/prisma-json'

// Query parameter validation
const ArticleQuerySchema = z.object({
  userId: z.string().min(1).optional(),
})

/**
 * Personalized Data Injector
 * Replaces {YOUR_DATA_PLACEHOLDER} with user-specific behavioral insights
 */
async function injectPersonalizedData(
  article: any,
  userId: string,
): Promise<{ content: string; personalizedSections: any }> {
  let personalizedContent = article.content
  const personalizedSections: any = {}

  // Skip if no personalized sections defined
  if (!article.personalizedSections?.yourData) {
    return {
      content: personalizedContent,
      personalizedSections,
    }
  }

  const { type, placeholder } = article.personalizedSections.yourData

  let injectedHTML = ''

  switch (type) {
    case 'forgetting-curve': {
      // Fetch user's personalized forgetting curve from learning profile
      const profile = await prisma.userLearningProfile.findUnique({
        where: { userId },
        select: { personalizedForgettingCurve: true },
      })

      if (profile?.personalizedForgettingCurve) {
        // Legacy forgetting curve format with R0, k, halfLife properties
        interface LegacyForgettingCurve extends PersonalizedForgettingCurve {
          R0?: number
          k?: number
          halfLife?: number
          optimalIntervals?: number[]
          dataSources?: {
            sessionCount: number
            weeksAnalyzed: number
          }
        }

        const curve = profile.personalizedForgettingCurve as unknown as LegacyForgettingCurve

        // Map new properties to legacy if needed
        const r0 = curve.R0 ?? curve.initialRetention
        const k = curve.k ?? curve.decayRate
        const halfLife = curve.halfLife ?? curve.stabilityFactor * 24 // Convert days to hours approximation

        injectedHTML = `
## Your Personalized Forgetting Curve

Based on your study patterns, we've calculated your personal forgetting curve:

**Your Retention Parameters:**
- **Initial Retention (R₀)**: ${(r0 * 100).toFixed(1)}%
- **Decay Rate (k)**: ${k.toFixed(4)}
- **Half-life**: ~${halfLife ? Math.round(halfLife) : 'N/A'} hours

**What this means for you:**

${
  k < 0.05
    ? '✅ **Excellent retention!** Your forgetting curve is slower than average. You retain information well over time.'
    : k < 0.08
      ? '✓ **Good retention.** Your decay rate is average. Spaced reviews will optimize your learning.'
      : '⚠️ **Faster forgetting.** Your curve suggests more frequent review intervals would help. Consider reviewing material sooner.'
}

**Optimal Review Schedule (personalized for you):**
1. First review: ${curve.optimalIntervals?.[0] || curve.optimalSpacing?.[0] || 1} day after learning
2. Second review: ${curve.optimalIntervals?.[1] || curve.optimalSpacing?.[1] || 3} days after first
3. Third review: ${curve.optimalIntervals?.[2] || curve.optimalSpacing?.[2] || 7} days after second
4. Fourth review: ${curve.optimalIntervals?.[3] || curve.optimalSpacing?.[3] || 14} days after third

*This is based on ${curve.dataSources?.sessionCount || 0} study sessions analyzed over ${curve.dataSources?.weeksAnalyzed || 0} weeks.*
`
        personalizedSections.forgettingCurve = curve
      } else {
        injectedHTML = `
## Your Personalized Forgetting Curve

*Complete 6+ weeks of study sessions to unlock your personalized forgetting curve analysis.*

We'll analyze your retention patterns and provide:
- Your unique decay rate (k-value)
- Personalized review intervals
- Comparison to Ebbinghaus curve
- Optimization recommendations
`
      }
      break
    }

    case 'vark-profile': {
      // Fetch user's VARK learning style profile
      const profile = await prisma.userLearningProfile.findUnique({
        where: { userId },
        select: { learningStyleProfile: true },
      })

      if (profile?.learningStyleProfile) {
        const vark = profile.learningStyleProfile as unknown as LearningStyleProfile & {
          confidenceLevel?: number
          sessionCount?: number
        }

        // Find dominant style
        const styles = [
          { name: 'Visual', value: vark.visual || 0 },
          { name: 'Auditory', value: vark.auditory || 0 },
          { name: 'Reading/Writing', value: vark.reading || 0 },
          { name: 'Kinesthetic', value: vark.kinesthetic || 0 },
        ]
        const dominant = styles.reduce((a, b) => (a.value > b.value ? a : b))

        injectedHTML = `
## Your VARK Learning Profile

Based on your content interaction patterns:

**Your Learning Style Breakdown:**

| Style | Preference | Percentage |
|-------|-----------|------------|
| 🎨 Visual | ${vark.visual >= 30 ? 'Strong' : vark.visual >= 20 ? 'Moderate' : 'Low'} | ${vark.visual?.toFixed(1)}% |
| 🎧 Auditory | ${vark.auditory >= 30 ? 'Strong' : vark.auditory >= 20 ? 'Moderate' : 'Low'} | ${vark.auditory?.toFixed(1)}% |
| 📝 Reading/Writing | ${vark.reading >= 30 ? 'Strong' : vark.reading >= 20 ? 'Moderate' : 'Low'} | ${vark.reading?.toFixed(1)}% |
| 🤸 Kinesthetic | ${vark.kinesthetic >= 30 ? 'Strong' : vark.kinesthetic >= 20 ? 'Moderate' : 'Low'} | ${vark.kinesthetic?.toFixed(1)}% |

**Your Dominant Style: ${dominant.name}** (${dominant.value.toFixed(1)}%)

${
  dominant.value >= 40
    ? `You have a **strong ${dominant.name.toLowerCase()} preference**. While this is your strength, remember to incorporate other modalities for deeper learning.`
    : dominant.value >= 30
      ? `You show a **moderate ${dominant.name.toLowerCase()} preference**. Your balanced profile suggests you can adapt well to different learning formats.`
      : `You have a **multimodal learning profile** with no single dominant style. This is actually advantageous - you can learn effectively through various methods!`
}

**Personalized Recommendations:**
${
  dominant.name === 'Visual'
    ? '- Create mind maps and flowcharts for complex topics\n- Use color-coding in your notes\n- Draw diagrams before reading text explanations\n- **Growth area**: Practice explaining concepts verbally'
    : dominant.name === 'Auditory'
      ? '- Record yourself explaining concepts\n- Join study groups for discussion\n- Listen to lecture recordings actively\n- **Growth area**: Create visual summaries of key topics'
      : dominant.name === 'Reading/Writing'
        ? '- Write detailed summaries in your own words\n- Create comprehensive study notes\n- Rewrite concepts multiple times\n- **Growth area**: Convert text notes to diagrams'
        : '- Use clinical simulations and hands-on practice\n- Pace while reviewing flashcards\n- Build physical models of concepts\n- **Growth area**: Practice with abstract theoretical content'
}

*Analysis based on ${(vark.confidenceLevel ?? 0.5) >= 0.7 ? 'high' : (vark.confidenceLevel ?? 0.5) >= 0.5 ? 'moderate' : 'preliminary'} confidence (${((vark.confidenceLevel ?? 0.5) * 100).toFixed(0)}%) from ${vark.sessionCount || 0} sessions.*
`
        personalizedSections.varkProfile = vark
      } else {
        injectedHTML = `
## Your VARK Learning Profile

*Complete 20+ study sessions with varied content to unlock your personalized VARK profile.*

We'll analyze your content preferences to determine:
- Visual vs Auditory vs Reading vs Kinesthetic tendencies
- Your dominant and secondary learning styles
- Personalized study strategy recommendations
- Areas to develop for multimodal learning
`
      }
      break
    }

    case 'optimal-study-times': {
      // Fetch user's optimal study times from behavioral patterns
      const patterns = await prisma.behavioralPattern.findMany({
        where: {
          userId,
          patternType: 'OPTIMAL_STUDY_TIME',
          confidence: { gte: 0.6 },
        },
        orderBy: { confidence: 'desc' },
        take: 1,
      })

      if (patterns.length > 0) {
        const pattern = patterns[0]
        const data = (pattern.evidence as unknown as Record<string, unknown> & {
          optimalStartHour?: number
          sessionsAnalyzed?: number
          performancePeaks?: Array<{
            startHour: number
            endHour: number
            effectivenessScore?: number
          }>
        }) || { optimalStartHour: 10, sessionsAnalyzed: 0, performancePeaks: [] }

        // Determine chronotype
        const peakHour = data.optimalStartHour || 10
        const chronotype =
          peakHour < 10
            ? 'Lark (Morning Type)'
            : peakHour >= 16
              ? 'Owl (Evening Type)'
              : 'Hummingbird (Intermediate)'

        injectedHTML = `
## Your Chronotype & Optimal Study Times

Based on ${data.sessionsAnalyzed || 0} study sessions analyzed:

**Your Chronotype: ${chronotype}**

${
  chronotype.includes('Lark')
    ? '🌅 You perform best in the morning hours. Your alertness peaks early and declines in the afternoon.'
    : chronotype.includes('Owl')
      ? "🦉 You're an evening type. Your cognitive performance peaks later in the day."
      : '🐦 You have a balanced circadian rhythm with good performance throughout the day.'
}

**Your Peak Performance Windows:**

${
  data.performancePeaks
    ?.map(
      (peak: any, i: number) =>
        `${i + 1}. **${peak.startHour}:00 - ${peak.endHour}:00** (${peak.effectivenessScore?.toFixed(1)}% effectiveness)`,
    )
    .join('\n') || '- Data still being analyzed'
}

**Recommendations for Your Schedule:**

✅ **Best times for:**
- Complex new material: ${data.optimalStartHour || 10}:00 - ${(data.optimalStartHour || 10) + 2}:00
- Active recall practice: Your peak windows (above)
- Light review: ${chronotype.includes('Lark') ? 'Early morning' : chronotype.includes('Owl') ? 'Late evening' : 'Flexible'}

⏰ **Times to avoid for intensive study:**
${
  chronotype.includes('Lark')
    ? '- After 3 PM (your energy naturally dips)\n- Late evening (consider pre-sleep review only)'
    : chronotype.includes('Owl')
      ? '- Before 10 AM (if possible, schedule lighter tasks)\n- Early afternoon (unless using strategic caffeine)'
      : '- Early afternoon (1-3 PM post-lunch dip is common)'
}

**Optimization Tips:**
- ${chronotype.includes('Lark') ? 'Wake up early to leverage your natural peak' : chronotype.includes('Owl') ? 'Protect your afternoon/evening study time' : 'Maintain consistent sleep schedule'}
- ${chronotype.includes('Lark') ? 'Use bright lights in afternoon to extend alertness' : chronotype.includes('Owl') ? 'Get morning sunlight exposure to help with early obligations' : 'Avoid caffeine after 2 PM for better sleep'}
- Sleep 7-9 hours for optimal consolidation

*Confidence: ${(pattern.confidence * 100).toFixed(0)}% | Last updated: ${new Date(pattern.lastSeenAt).toLocaleDateString()}*
`
        personalizedSections.optimalTimes = data
      } else {
        injectedHTML = `
## Your Chronotype & Optimal Study Times

*Complete 15+ study sessions at different times of day to unlock your personalized chronotype analysis.*

We'll identify:
- Your peak cognitive performance hours
- Whether you're a Lark, Owl, or Hummingbird
- Optimal schedule for complex vs review tasks
- Times to avoid for intensive study
- Personalized timing strategies
`
      }
      break
    }

    case 'recall-performance': {
      // Fetch review accuracy and active recall patterns
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const reviews = await prisma.review.findMany({
        where: {
          userId,
          reviewedAt: { gte: thirtyDaysAgo },
        },
        select: {
          rating: true,
          reviewedAt: true,
        },
      })

      if (reviews.length >= 20) {
        // Calculate accuracy: GOOD and EASY are correct, AGAIN and HARD are incorrect
        const correct = reviews.filter((r) => r.rating === 'GOOD' || r.rating === 'EASY').length
        const accuracy = (correct / reviews.length) * 100

        // Group by week to show trend
        const weeklyData: { [key: string]: { correct: number; total: number } } = {}
        reviews.forEach((review) => {
          const week = new Date(review.reviewedAt)
          week.setDate(week.getDate() - week.getDay()) // Start of week
          const weekKey = week.toISOString().split('T')[0]

          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { correct: 0, total: 0 }
          }
          weeklyData[weekKey].total++
          if (review.rating === 'GOOD' || review.rating === 'EASY') {
            weeklyData[weekKey].correct++
          }
        })

        const weeklyAccuracy = Object.entries(weeklyData).map(([week, data]) => ({
          week,
          accuracy: (data.correct / data.total) * 100,
        }))

        // Calculate trend
        const recentWeek = weeklyAccuracy[weeklyAccuracy.length - 1]?.accuracy || 0
        const previousWeek = weeklyAccuracy[weeklyAccuracy.length - 2]?.accuracy || 0
        const trend = recentWeek - previousWeek

        injectedHTML = `
## Your Active Recall Performance

**Last 30 Days Summary:**

📊 **Overall Accuracy: ${accuracy.toFixed(1)}%** (${correct}/${reviews.length} reviews)

${
  accuracy >= 75
    ? "✅ **Excellent recall!** You're retrieving information effectively. Keep up the active practice."
    : accuracy >= 60
      ? "✓ **Good recall.** You're on the right track. Consider more frequent reviews for struggling topics."
      : '⚠️ **Room for improvement.** Your recall accuracy suggests material needs more active practice before long-term retention.'
}

**Weekly Trend:**
${
  trend > 5
    ? `📈 **Improving** (+${trend.toFixed(1)}% vs last week) - Your active recall is getting stronger!`
    : trend < -5
      ? `📉 **Declining** (${trend.toFixed(1)}% vs last week) - Consider reviewing study strategies or reducing cognitive load.`
      : `📊 **Stable** (${trend >= 0 ? '+' : ''}${trend.toFixed(1)}% vs last week) - Maintaining consistent performance.`
}

**What Your Data Tells Us:**

${
  accuracy >= 75
    ? "- You're spacing reviews appropriately\n- Active recall is working well for you\n- Material difficulty matches your current level"
    : accuracy >= 60
      ? '- Some concepts need more frequent review\n- Try increasing active recall frequency\n- Consider breaking complex topics into smaller chunks'
      : '- Material may be too difficult (reduce cognitive load)\n- Increase review frequency significantly\n- Focus on understanding before memorization\n- Use more elaborative rehearsal (explain why, not just what)'
}

**Optimization Recommendations:**

1. **Review Timing**: ${accuracy >= 70 ? 'Current intervals working well' : 'Shorten review intervals by 1-2 days'}
2. **Study Method**: ${accuracy >= 70 ? 'Continue with active recall focus' : 'Add more elaborative techniques (teach-back, self-explanation)'}
3. **Difficulty**: ${accuracy >= 80 ? 'Consider increasing challenge' : accuracy >= 60 ? 'Maintain current difficulty' : 'Break down complex topics further'}

*Based on ${reviews.length} active recall attempts over the last 30 days.*
`
        personalizedSections.recallPerformance = {
          accuracy,
          trend,
          reviewCount: reviews.length,
          weeklyData: weeklyAccuracy,
        }
      } else {
        injectedHTML = `
## Your Active Recall Performance

*Complete 20+ reviews to unlock your personalized active recall analysis.*

We'll show you:
- Your retrieval accuracy over time
- Weekly performance trends
- Optimal review intervals based on your retention
- Specific recommendations for improvement
- Comparison to research-backed benchmarks
`
      }
      break
    }

    case 'cognitive-load': {
      // Analyze session patterns for cognitive load indicators
      const sessions = await prisma.studySession.findMany({
        where: {
          userId,
          completedAt: { not: null },
          startedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          durationMs: true,
          reviewsCompleted: true,
          newCardsStudied: true,
        },
      })

      if (sessions.length >= 10) {
        // Calculate average session metrics
        const avgDuration =
          sessions.reduce((sum, s) => sum + (s.durationMs || 0), 0) / sessions.length / (60 * 1000)
        const avgReviews =
          sessions.reduce((sum, s) => sum + s.reviewsCompleted, 0) / sessions.length
        const avgNewCards =
          sessions.reduce((sum, s) => sum + s.newCardsStudied, 0) / sessions.length

        // Estimate cognitive load based on session intensity
        const intensity = (avgReviews + avgNewCards * 2) / avgDuration // Cards per minute (weighted for new cards)
        const loadLevel = intensity > 1.5 ? 'HIGH' : intensity > 0.8 ? 'MODERATE' : 'LOW'

        injectedHTML = `
## Your Cognitive Load Patterns

**Session Analysis (Last 30 Days):**

📈 **Load Level: ${loadLevel}**

| Metric | Your Average | Optimal Range |
|--------|--------------|---------------|
| Session Duration | ${avgDuration.toFixed(0)} min | 45-60 min |
| Reviews per Session | ${avgReviews.toFixed(0)} | 15-30 |
| New Cards per Session | ${avgNewCards.toFixed(0)} | 5-15 |
| Intensity (cards/min) | ${intensity.toFixed(2)} | 0.8-1.2 |

**What This Means:**

${
  loadLevel === 'HIGH'
    ? `⚠️ **High Cognitive Load Detected**

Your sessions are quite intense (${intensity.toFixed(1)} cards/minute). This suggests:
- Possible cognitive overload
- Risk of reduced retention due to rushed processing
- Potential for mental fatigue

**Recommendations:**
- **Reduce session intensity**: Fewer cards per session
- **Increase session duration**: Spread same material over longer time
- **Add breaks**: 5-min break every 25 minutes (Pomodoro)
- **Simplify materials**: Use cleaner, less cluttered resources
- **Check prerequisites**: Ensure foundational knowledge is solid`
    : loadLevel === 'MODERATE'
      ? `✓ **Optimal Cognitive Load**

Your study sessions are well-balanced (${intensity.toFixed(1)} cards/minute):
- Good pace for processing information
- Sustainable intensity over time
- Effective use of germane cognitive load

**Maintain Current Strategy:**
- Continue current session structure
- Monitor for fatigue over multiple days
- Adjust if difficulty increases`
      : `📊 **Low Cognitive Load**

Your sessions are quite relaxed (${intensity.toFixed(1)} cards/minute). This could mean:
- Material is well within your capability
- Potential to increase challenge
- Possibly too much extraneous load (distractions?)

**Consider:**
- Increasing new card introduction rate
- Tackling more complex topics
- Reducing session duration if retention is good
- Eliminating distractions to increase focus`
}

**Extraneous Load Checklist:**

${
  avgDuration > 60
    ? '⚠️ Sessions may be too long (fatigue increases extraneous load)\n'
    : avgDuration < 30
      ? "ℹ️ Very short sessions - ensure you're getting into focused state\n"
      : '✓ Session duration is appropriate\n'
}
${
  intensity > 2
    ? '⚠️ Very high intensity - likely rushing through material\n'
    : '✓ Processing pace allows for understanding\n'
}

*Based on ${sessions.length} completed study sessions.*
`
        personalizedSections.cognitiveLoad = {
          loadLevel,
          intensity,
          avgDuration,
          avgReviews,
          avgNewCards,
          sessionCount: sessions.length,
        }
      } else {
        injectedHTML = `
## Your Cognitive Load Patterns

*Complete 10+ study sessions to unlock your personalized cognitive load analysis.*

We'll analyze:
- Your session intensity and pacing
- Signs of cognitive overload
- Optimal study duration for you
- Recommendations to reduce extraneous load
- Strategies to optimize germane load
`
      }
      break
    }

    default:
      // Unknown personalization type - skip
      break
  }

  // Replace placeholder with injected content
  if (injectedHTML) {
    personalizedContent = personalizedContent.replace(
      placeholder || '{YOUR_DATA_PLACEHOLDER}',
      injectedHTML,
    )
  }

  return {
    content: personalizedContent,
    personalizedSections,
  }
}

/**
 * GET /api/analytics/behavioral-insights/learning-science/:articleId
 *
 * Returns:
 * - article: LearningArticle with personalized content
 * - personalizedSections: Extracted user data used for personalization
 * - readStatus: Whether user has read this article before
 * - Creates/updates ArticleRead tracking record
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ articleId: string }> }) => {
    const { articleId } = await params

    // Extract and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = ArticleQuerySchema.parse({
      userId: searchParams.get('userId') || undefined,
    })

    const sessionUserId = await getCurrentUserId()

    if (queryParams.userId && queryParams.userId !== sessionUserId) {
      return Response.json(
        errorResponse('Forbidden: userId does not match the authenticated user', 'FORBIDDEN'),
        { status: 403 },
      )
    }

    const userId = queryParams.userId ?? sessionUserId

    // Fetch article by slug (articleId is the slug)
    const article = await prisma.learningArticle.findUnique({
      where: { slug: articleId },
    })

    if (!article) {
      return Response.json(errorResponse('Article not found', 'NOT_FOUND'), { status: 404 })
    }

    // Inject personalized data into article content
    const { content: personalizedContent, personalizedSections } = await injectPersonalizedData(
      article,
      userId,
    )

    // Check if user has read this article before
    const existingRead = await prisma.articleRead.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id,
        },
      },
    })

    // Create or update ArticleRead tracking
    const articleRead = await prisma.articleRead.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id,
        },
      },
      create: {
        userId,
        articleId: article.id,
        readAt: new Date(),
      },
      update: {
        readAt: new Date(), // Update read timestamp on each view
      },
    })

    return Response.json(
      successResponse({
        article: {
          ...article,
          content: personalizedContent, // Return personalized content
        },
        personalizedSections, // Return extracted user data
        readStatus: {
          hasRead: !!existingRead,
          firstReadAt: existingRead?.readAt,
          lastReadAt: articleRead.readAt,
          completedRead: existingRead?.completedRead || false,
          helpful: existingRead?.helpful,
          rating: existingRead?.rating,
        },
      }),
    )
  },
)
