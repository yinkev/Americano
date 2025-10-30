/**
 * SearchAnalyticsService
 * Story 3.1 Task 6: Search History & Analytics
 *
 * Provides comprehensive search analytics including:
 * - Click-through rate tracking
 * - Popular searches analysis
 * - Zero-result query detection
 * - Search performance metrics
 * - Privacy-compliant data anonymization
 *
 * @module SearchAnalyticsService
 */

import { Prisma } from '@/generated/prisma'
import { prisma } from '@/lib/db'

/**
 * Log a search query for analytics
 * Task 6.1: Search query logging
 *
 * @param params - Search logging parameters
 */
export async function logSearchQuery(params: {
  userId: string
  query: string
  filters: any
  resultCount: number
  topResultId?: string
  responseTimeMs: number
  timestamp: Date
}): Promise<void> {
  try {
    await prisma.searchQuery.create({
      data: {
        userId: params.userId,
        query: params.query,
        filters: params.filters as any,
        resultCount: params.resultCount,
        topResultId: params.topResultId,
        responseTimeMs: params.responseTimeMs,
        timestamp: params.timestamp,
      },
    })
  } catch (error) {
    console.error('Failed to log search query:', error)
    // Don't throw - analytics logging should not break user experience
  }
}

/**
 * Track a search result click
 * Task 6.2: Track click-through rates on search results
 *
 * @param params - Click tracking parameters
 */
export async function trackSearchClick(params: {
  searchQueryId: string
  userId: string
  resultId: string
  resultType: 'lecture' | 'chunk' | 'objective' | 'concept'
  position: number
  similarity?: number
}): Promise<void> {
  try {
    await prisma.searchClick.create({
      data: {
        searchQueryId: params.searchQueryId,
        userId: params.userId,
        resultId: params.resultId,
        resultType: params.resultType,
        position: params.position,
        similarity: params.similarity,
      },
    })
  } catch (error) {
    console.error('Failed to track search click:', error)
    // Don't throw - analytics tracking should not break user experience
  }
}

/**
 * Get popular searches for a time period
 * Task 6.3: Analytics dashboard - popular searches
 *
 * @param userId - User ID (optional, for personalized analytics)
 * @param limit - Maximum number of results
 * @param timeWindowDays - Time window in days (default: 30)
 * @returns Array of popular search terms with counts
 */
export async function getPopularSearches(
  userId?: string,
  limit: number = 10,
  timeWindowDays: number = 30,
): Promise<Array<{ query: string; count: number; avgResults: number }>> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - timeWindowDays)

    // Raw SQL query for performance (Prisma doesn't support GROUP BY well)
    const results = await prisma.$queryRaw<
      Array<{ query: string; count: bigint; avgResults: number }>
    >`
      SELECT
        query,
        COUNT(*) as count,
        AVG("resultCount")::float as "avgResults"
      FROM search_queries
      WHERE
        timestamp >= ${since}
        ${userId ? Prisma.sql`AND "userId" = ${userId}` : Prisma.empty}
        AND "isAnonymized" = false
      GROUP BY query
      ORDER BY count DESC
      LIMIT ${limit}
    `

    return results.map((r) => ({
      query: r.query,
      count: Number(r.count),
      avgResults: r.avgResults,
    }))
  } catch (error) {
    console.error('Failed to get popular searches:', error)
    return []
  }
}

/**
 * Get zero-result queries (searches that returned no results)
 * Task 6.3: Analytics dashboard - zero-result queries
 *
 * @param userId - User ID (optional)
 * @param limit - Maximum number of results
 * @param timeWindowDays - Time window in days (default: 30)
 * @returns Array of queries with no results
 */
export async function getZeroResultQueries(
  userId?: string,
  limit: number = 10,
  timeWindowDays: number = 30,
): Promise<Array<{ query: string; count: number; lastSearched: Date }>> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - timeWindowDays)

    const results = await prisma.$queryRaw<
      Array<{ query: string; count: bigint; lastSearched: Date }>
    >`
      SELECT
        query,
        COUNT(*) as count,
        MAX(timestamp) as "lastSearched"
      FROM search_queries
      WHERE
        "resultCount" = 0
        AND timestamp >= ${since}
        ${userId ? Prisma.sql`AND "userId" = ${userId}` : Prisma.empty}
        AND "isAnonymized" = false
      GROUP BY query
      ORDER BY count DESC, "lastSearched" DESC
      LIMIT ${limit}
    `

    return results.map((r) => ({
      query: r.query,
      count: Number(r.count),
      lastSearched: r.lastSearched,
    }))
  } catch (error) {
    console.error('Failed to get zero-result queries:', error)
    return []
  }
}

/**
 * Get click-through rate analytics
 * Task 6.2: Track click-through rates on search results
 *
 * @param timeWindowDays - Time window in days (default: 30)
 * @returns CTR analytics including overall CTR and by position
 */
export async function getClickThroughRateAnalytics(
  userId?: string,
  timeWindowDays: number = 30,
): Promise<{
  overallCTR: number
  byPosition: Array<{ position: number; ctr: number; clicks: number }>
  totalSearches: number
  totalClicks: number
}> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - timeWindowDays)

    // Get total searches
    const totalSearches = await prisma.searchQuery.count({
      where: {
        timestamp: { gte: since },
        ...(userId && { userId }),
        isAnonymized: false,
      },
    })

    // Get total clicks
    const totalClicks = await prisma.searchClick.count({
      where: {
        timestamp: { gte: since },
        ...(userId && { userId }),
      },
    })

    // Get CTR by position
    const positionAnalytics = await prisma.$queryRaw<
      Array<{ position: number; clicks: bigint; searches: bigint }>
    >`
      SELECT
        sc.position,
        COUNT(DISTINCT sc.id) as clicks,
        COUNT(DISTINCT sq.id) as searches
      FROM search_clicks sc
      INNER JOIN search_queries sq ON sc."searchQueryId" = sq.id
      WHERE
        sc.timestamp >= ${since}
        ${userId ? Prisma.sql`AND sc."userId" = ${userId}` : Prisma.empty}
      GROUP BY sc.position
      ORDER BY sc.position ASC
      LIMIT 20
    `

    const byPosition = positionAnalytics.map((p) => ({
      position: p.position,
      clicks: Number(p.clicks),
      ctr: totalSearches > 0 ? Number(p.clicks) / totalSearches : 0,
    }))

    return {
      overallCTR: totalSearches > 0 ? totalClicks / totalSearches : 0,
      byPosition,
      totalSearches,
      totalClicks,
    }
  } catch (error) {
    console.error('Failed to get CTR analytics:', error)
    return {
      overallCTR: 0,
      byPosition: [],
      totalSearches: 0,
      totalClicks: 0,
    }
  }
}

/**
 * Get search performance metrics
 * Task 6.3: Analytics dashboard - performance metrics
 *
 * @param timeWindowDays - Time window in days (default: 30)
 * @returns Performance metrics including avg response time, results per query
 */
export async function getSearchPerformanceMetrics(
  userId?: string,
  timeWindowDays: number = 30,
): Promise<{
  avgResponseTimeMs: number
  avgResultsPerQuery: number
  totalSearches: number
  p95ResponseTimeMs: number | null
}> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - timeWindowDays)

    const result = await prisma.$queryRaw<
      Array<{
        avgResponseTime: number
        avgResults: number
        totalSearches: bigint
      }>
    >`
      SELECT
        AVG("responseTimeMs")::float as "avgResponseTime",
        AVG("resultCount")::float as "avgResults",
        COUNT(*) as "totalSearches"
      FROM search_queries
      WHERE
        timestamp >= ${since}
        ${userId ? Prisma.sql`AND "userId" = ${userId}` : Prisma.empty}
        AND "isAnonymized" = false
        AND "responseTimeMs" IS NOT NULL
    `

    // Get p95 response time
    const p95Result = await prisma.$queryRaw<Array<{ p95: number }>>`
      SELECT
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "responseTimeMs") as p95
      FROM search_queries
      WHERE
        timestamp >= ${since}
        ${userId ? Prisma.sql`AND "userId" = ${userId}` : Prisma.empty}
        AND "isAnonymized" = false
        AND "responseTimeMs" IS NOT NULL
    `

    const metrics = result[0] || {
      avgResponseTime: 0,
      avgResults: 0,
      totalSearches: 0n,
    }

    return {
      avgResponseTimeMs: metrics.avgResponseTime || 0,
      avgResultsPerQuery: metrics.avgResults || 0,
      totalSearches: Number(metrics.totalSearches),
      p95ResponseTimeMs: p95Result[0]?.p95 || null,
    }
  } catch (error) {
    console.error('Failed to get search performance metrics:', error)
    return {
      avgResponseTimeMs: 0,
      avgResultsPerQuery: 0,
      totalSearches: 0,
      p95ResponseTimeMs: null,
    }
  }
}

/**
 * Get search suggestions based on history
 * Task 6.4: Implement search query suggestions based on history
 *
 * @param userId - User ID
 * @param limit - Maximum suggestions
 * @returns Array of suggested queries
 */
export async function getSearchSuggestions(
  userId: string,
  limit: number = 5,
): Promise<Array<{ query: string; frequency: number; lastSearched: Date }>> {
  try {
    // Get most frequently searched queries by this user
    const results = await prisma.$queryRaw<
      Array<{ query: string; frequency: bigint; lastSearched: Date }>
    >`
      SELECT
        query,
        COUNT(*) as frequency,
        MAX(timestamp) as "lastSearched"
      FROM search_queries
      WHERE
        "userId" = ${userId}
        AND "isAnonymized" = false
        AND "resultCount" > 0
      GROUP BY query
      ORDER BY frequency DESC, "lastSearched" DESC
      LIMIT ${limit}
    `

    return results.map((r) => ({
      query: r.query,
      frequency: Number(r.frequency),
      lastSearched: r.lastSearched,
    }))
  } catch (error) {
    console.error('Failed to get search suggestions:', error)
    return []
  }
}

/**
 * Anonymize search queries older than specified days
 * Task 6.6: Privacy compliance - anonymize after 90 days (GDPR)
 *
 * @param daysOld - Queries older than this will be anonymized (default: 90)
 * @returns Number of queries anonymized
 */
export async function anonymizeOldSearchQueries(daysOld: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await prisma.searchQuery.updateMany({
      where: {
        timestamp: { lt: cutoffDate },
        isAnonymized: false,
      },
      data: {
        isAnonymized: true,
        anonymizedAt: new Date(),
        // Note: We keep the query text for aggregate analytics
        // but remove user linkage by marking as anonymized
      },
    })

    console.log(`Anonymized ${result.count} search queries older than ${daysOld} days`)
    return result.count
  } catch (error) {
    console.error('Failed to anonymize search queries:', error)
    throw error
  }
}

/**
 * Delete anonymized search queries and their clicks
 * Task 6.6: Privacy compliance - delete anonymized data after retention period
 *
 * @param daysAfterAnonymization - Days after anonymization to delete (default: 90)
 * @returns Object with counts of deleted queries and clicks
 */
export async function deleteAnonymizedSearchData(
  daysAfterAnonymization: number = 90,
): Promise<{ queriesDeleted: number; clicksDeleted: number }> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAfterAnonymization)

    // Delete clicks first (foreign key constraint)
    const clicksDeleted = await prisma.searchClick.deleteMany({
      where: {
        searchQuery: {
          isAnonymized: true,
          anonymizedAt: { lt: cutoffDate },
        },
      },
    })

    // Then delete queries
    const queriesDeleted = await prisma.searchQuery.deleteMany({
      where: {
        isAnonymized: true,
        anonymizedAt: { lt: cutoffDate },
      },
    })

    console.log(
      `Deleted ${queriesDeleted.count} anonymized queries and ${clicksDeleted.count} clicks`,
    )

    return {
      queriesDeleted: queriesDeleted.count,
      clicksDeleted: clicksDeleted.count,
    }
  } catch (error) {
    console.error('Failed to delete anonymized search data:', error)
    throw error
  }
}

/**
 * Get comprehensive search analytics summary
 * Task 6.3: Analytics dashboard data aggregation
 *
 * @param userId - User ID (optional, for personalized analytics)
 * @param timeWindowDays - Time window in days (default: 30)
 * @returns Comprehensive analytics summary
 */
export async function getSearchAnalyticsSummary(
  userId?: string,
  timeWindowDays: number = 30,
): Promise<{
  popularSearches: Array<{ query: string; count: number; avgResults: number }>
  zeroResultQueries: Array<{ query: string; count: number; lastSearched: Date }>
  ctrAnalytics: {
    overallCTR: number
    byPosition: Array<{ position: number; ctr: number; clicks: number }>
    totalSearches: number
    totalClicks: number
  }
  performanceMetrics: {
    avgResponseTimeMs: number
    avgResultsPerQuery: number
    totalSearches: number
    p95ResponseTimeMs: number | null
  }
}> {
  const [popularSearches, zeroResultQueries, ctrAnalytics, performanceMetrics] = await Promise.all([
    getPopularSearches(userId, 10, timeWindowDays),
    getZeroResultQueries(userId, 10, timeWindowDays),
    getClickThroughRateAnalytics(userId, timeWindowDays),
    getSearchPerformanceMetrics(userId, timeWindowDays),
  ])

  return {
    popularSearches,
    zeroResultQueries,
    ctrAnalytics,
    performanceMetrics,
  }
}

/**
 * Story 3.6 Task 5.1: Daily/weekly/monthly aggregation queries
 * Get search volume aggregated by time period
 *
 * @param userId - User ID (optional)
 * @param period - Aggregation period (7d, 30d, 90d)
 * @returns Time-series data of search volume
 */
export async function getSearchVolumeOverTime(
  userId?: string,
  period: '7d' | '30d' | '90d' = '30d',
): Promise<Array<{ date: string; count: number; avgResponseTimeMs: number }>> {
  try {
    const days = parseInt(period) // 7, 30, or 90
    const since = new Date()
    since.setDate(since.getDate() - days)

    // Aggregate searches by day
    const results = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint; avgResponseTime: number }>
    >`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as count,
        AVG("responseTimeMs")::float as "avgResponseTime"
      FROM search_queries
      WHERE
        timestamp >= ${since}
        ${userId ? Prisma.sql`AND "userId" = ${userId}` : Prisma.empty}
        AND "isAnonymized" = false
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `

    return results.map((r) => ({
      date: r.date.toISOString().split('T')[0], // YYYY-MM-DD format
      count: Number(r.count),
      avgResponseTimeMs: r.avgResponseTime || 0,
    }))
  } catch (error) {
    console.error('Failed to get search volume over time:', error)
    return []
  }
}

/**
 * Story 3.6 Task 5.1: Get searches by content type distribution
 *
 * @param userId - User ID (optional)
 * @param timeWindowDays - Time window in days (default: 30)
 * @returns Content type distribution
 */
export async function getSearchesByContentType(
  userId?: string,
  timeWindowDays: number = 30,
): Promise<Array<{ contentType: string; count: number; percentage: number }>> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - timeWindowDays)

    // Get total searches
    const totalSearches = await prisma.searchQuery.count({
      where: {
        timestamp: { gte: since },
        ...(userId && { userId }),
        isAnonymized: false,
      },
    })

    if (totalSearches === 0) {
      return []
    }

    // Get searches by content type from SearchClick data
    const results = await prisma.$queryRaw<Array<{ resultType: string; count: bigint }>>`
      SELECT
        sc."resultType" as "resultType",
        COUNT(*) as count
      FROM search_clicks sc
      INNER JOIN search_queries sq ON sc."searchQueryId" = sq.id
      WHERE
        sc.timestamp >= ${since}
        ${userId ? Prisma.sql`AND sc."userId" = ${userId}` : Prisma.empty}
      GROUP BY sc."resultType"
      ORDER BY count DESC
    `

    return results.map((r) => ({
      contentType: r.resultType,
      count: Number(r.count),
      percentage: (Number(r.count) / totalSearches) * 100,
    }))
  } catch (error) {
    console.error('Failed to get searches by content type:', error)
    return []
  }
}

/**
 * Story 3.6 Task 5.2: Gap analysis algorithm
 * Identify high-frequency searches with low content matches
 *
 * Priority scoring: (search_frequency × (1 - avg_result_count / 10))
 * Higher score = more urgent content gap
 *
 * @param userId - User ID (optional)
 * @param timeWindowDays - Time window in days (default: 30)
 * @param limit - Maximum gaps to return (default: 20)
 * @returns Content gaps with priority scores
 */
export async function getContentGaps(
  userId?: string,
  timeWindowDays: number = 30,
  limit: number = 20,
): Promise<
  Array<{
    query: string
    searchFrequency: number
    avgResultCount: number
    priorityScore: number
    lastSearched: Date
  }>
> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - timeWindowDays)

    // Find queries with high frequency but low result counts (<3 results)
    const results = await prisma.$queryRaw<
      Array<{
        query: string
        frequency: bigint
        avgResults: number
        lastSearched: Date
      }>
    >`
      SELECT
        query,
        COUNT(*) as frequency,
        AVG("resultCount")::float as "avgResults",
        MAX(timestamp) as "lastSearched"
      FROM search_queries
      WHERE
        timestamp >= ${since}
        ${userId ? Prisma.sql`AND "userId" = ${userId}` : Prisma.empty}
        AND "isAnonymized" = false
        AND "resultCount" < 3
      GROUP BY query
      HAVING COUNT(*) >= 2
      ORDER BY COUNT(*) DESC, "avgResults" ASC
      LIMIT ${limit}
    `

    // Calculate priority scores
    return results.map((r) => {
      const frequency = Number(r.frequency)
      const avgResults = r.avgResults || 0
      // Priority formula: higher frequency + lower results = higher priority
      const priorityScore = frequency * (1 - avgResults / 10)

      return {
        query: r.query,
        searchFrequency: frequency,
        avgResultCount: avgResults,
        priorityScore: Math.round(priorityScore * 100) / 100, // Round to 2 decimals
        lastSearched: r.lastSearched,
      }
    })
  } catch (error) {
    console.error('Failed to get content gaps:', error)
    return []
  }
}

/**
 * Story 3.6 Task 5.1: Get top queries by click-through rate
 *
 * @param userId - User ID (optional)
 * @param timeWindowDays - Time window in days (default: 30)
 * @param limit - Maximum queries to return (default: 20)
 * @returns Top queries with CTR metrics
 */
export async function getTopQueriesByCTR(
  userId?: string,
  timeWindowDays: number = 30,
  limit: number = 20,
): Promise<
  Array<{
    query: string
    searches: number
    clicks: number
    ctr: number
    avgPosition: number
  }>
> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - timeWindowDays)

    const results = await prisma.$queryRaw<
      Array<{
        query: string
        searches: bigint
        clicks: bigint
        avgPosition: number
      }>
    >`
      SELECT
        sq.query,
        COUNT(DISTINCT sq.id) as searches,
        COUNT(sc.id) as clicks,
        AVG(sc.position)::float as "avgPosition"
      FROM search_queries sq
      LEFT JOIN search_clicks sc ON sq.id = sc."searchQueryId"
      WHERE
        sq.timestamp >= ${since}
        ${userId ? Prisma.sql`AND sq."userId" = ${userId}` : Prisma.empty}
        AND sq."isAnonymized" = false
      GROUP BY sq.query
      HAVING COUNT(DISTINCT sq.id) >= 2
      ORDER BY (COUNT(sc.id)::float / COUNT(DISTINCT sq.id)) DESC
      LIMIT ${limit}
    `

    return results.map((r) => {
      const searches = Number(r.searches)
      const clicks = Number(r.clicks)
      const ctr = searches > 0 ? clicks / searches : 0

      return {
        query: r.query,
        searches,
        clicks,
        ctr: Math.round(ctr * 1000) / 10, // Convert to percentage, round to 1 decimal
        avgPosition: Math.round((r.avgPosition || 0) * 10) / 10,
      }
    })
  } catch (error) {
    console.error('Failed to get top queries by CTR:', error)
    return []
  }
}

/**
 * Story 3.6 Task 5.1: Comprehensive analytics for dashboard
 * Combines all metrics into a single response for the dashboard
 *
 * @param userId - User ID (optional)
 * @param period - Time period (7d, 30d, 90d)
 * @returns Complete analytics dashboard data
 */
export async function getDashboardAnalytics(
  userId?: string,
  period: '7d' | '30d' | '90d' = '30d',
): Promise<{
  summary: {
    totalSearches: number
    avgResponseTimeMs: number
    overallCTR: number
    contentGapsCount: number
  }
  volumeOverTime: Array<{ date: string; count: number; avgResponseTimeMs: number }>
  topQueries: Array<{ query: string; count: number; avgResults: number }>
  contentTypeDistribution: Array<{
    contentType: string
    count: number
    percentage: number
  }>
  contentGaps: Array<{
    query: string
    searchFrequency: number
    avgResultCount: number
    priorityScore: number
    lastSearched: Date
  }>
  topQueriesByCTR: Array<{
    query: string
    searches: number
    clicks: number
    ctr: number
    avgPosition: number
  }>
}> {
  const days = parseInt(period) // 7, 30, or 90

  // Fetch all analytics in parallel for performance
  const [
    performanceMetrics,
    ctrAnalytics,
    volumeOverTime,
    topQueries,
    contentTypeDistribution,
    contentGaps,
    topQueriesByCTR,
  ] = await Promise.all([
    getSearchPerformanceMetrics(userId, days),
    getClickThroughRateAnalytics(userId, days),
    getSearchVolumeOverTime(userId, period),
    getPopularSearches(userId, 20, days),
    getSearchesByContentType(userId, days),
    getContentGaps(userId, days, 20),
    getTopQueriesByCTR(userId, days, 20),
  ])

  return {
    summary: {
      totalSearches: performanceMetrics.totalSearches,
      avgResponseTimeMs: performanceMetrics.avgResponseTimeMs,
      overallCTR: ctrAnalytics.overallCTR,
      contentGapsCount: contentGaps.length,
    },
    volumeOverTime,
    topQueries,
    contentTypeDistribution,
    contentGaps,
    topQueriesByCTR,
  }
}

/**
 * Export all analytics functions as a service
 */
export const searchAnalyticsService = {
  logSearchQuery,
  trackSearchClick,
  getPopularSearches,
  getZeroResultQueries,
  getClickThroughRateAnalytics,
  getSearchPerformanceMetrics,
  getSearchSuggestions,
  anonymizeOldSearchQueries,
  deleteAnonymizedSearchData,
  getSearchAnalyticsSummary,
  // Story 3.6 Task 5: New analytics functions
  getSearchVolumeOverTime,
  getSearchesByContentType,
  getContentGaps,
  getTopQueriesByCTR,
  getDashboardAnalytics,
}
