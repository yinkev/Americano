/**
 * SearchAlertService
 * Story 3.6 Task 3.3: Implement search alerts system
 *
 * Background service that checks saved searches for new matching content
 * and creates alerts for users
 *
 * @module SearchAlertService
 */

import { prisma } from '@/lib/db'
import { semanticSearchService } from '@/lib/semantic-search-service'
import { AlertFrequency } from '@/generated/prisma'

/**
 * Check all active saved searches for new content
 * Should be run periodically (cron job or background worker)
 *
 * Task 3.3: Search alerts system with background job
 *
 * @returns Number of alerts created
 */
export async function checkSavedSearchAlerts(): Promise<number> {
  try {
    // Get all saved searches with alerts enabled
    const savedSearches = await prisma.savedSearch.findMany({
      where: {
        alertEnabled: true,
      },
    })

    let alertsCreated = 0

    for (const search of savedSearches) {
      try {
        // Check if we should run this search based on frequency
        if (!shouldCheckAlert(search.lastRun, search.alertFrequency)) {
          continue
        }

        // Execute search
        const filters = search.filters as any
        const results = await semanticSearchService.search({
          query: search.query,
          filters: filters || {},
          limit: 10,
        })

        // Check if there are new results
        const lastResultCount = search.resultCount || 0
        const newResultCount = results.total

        if (newResultCount > lastResultCount) {
          // Create alert
          await prisma.searchAlert.create({
            data: {
              savedSearchId: search.id,
              userId: search.userId,
              triggeredBy: results.results[0]?.id || 'unknown',
              triggeredType: results.results[0]?.type || 'unknown',
              newResultCount: newResultCount - lastResultCount,
              notificationSent: false,
            },
          })

          alertsCreated++
        }

        // Update lastRun and resultCount
        await prisma.savedSearch.update({
          where: { id: search.id },
          data: {
            lastRun: new Date(),
            resultCount: newResultCount,
          },
        })
      } catch (error) {
        console.error(`Failed to check alert for search ${search.id}:`, error)
        // Continue with other searches
      }
    }

    console.log(`Created ${alertsCreated} search alerts`)
    return alertsCreated
  } catch (error) {
    console.error('Failed to check saved search alerts:', error)
    return 0
  }
}

/**
 * Check if an alert should be checked based on frequency
 */
function shouldCheckAlert(lastRun: Date | null, frequency: AlertFrequency): boolean {
  if (!lastRun) {
    return true  // Never run before
  }

  const now = new Date()
  const timeSinceLastRun = now.getTime() - lastRun.getTime()

  switch (frequency) {
    case 'IMMEDIATE':
      // Check every hour for immediate alerts
      return timeSinceLastRun > 60 * 60 * 1000

    case 'DAILY':
      // Check once per day
      return timeSinceLastRun > 24 * 60 * 60 * 1000

    case 'WEEKLY':
      // Check once per week
      return timeSinceLastRun > 7 * 24 * 60 * 60 * 1000

    default:
      return false
  }
}

/**
 * Get unread alerts for a user
 *
 * @param userId - User ID
 * @param limit - Maximum alerts to return
 * @returns Array of unread alerts
 */
export async function getUnreadAlerts(userId: string, limit: number = 10) {
  try {
    const alerts = await prisma.searchAlert.findMany({
      where: {
        userId,
        viewed: false,
      },
      include: {
        savedSearch: {
          select: {
            name: true,
            query: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return alerts
  } catch (error) {
    console.error('Failed to get unread alerts:', error)
    return []
  }
}

/**
 * Mark alert as viewed
 *
 * @param alertId - Alert ID
 */
export async function markAlertAsViewed(alertId: string): Promise<void> {
  try {
    await prisma.searchAlert.update({
      where: { id: alertId },
      data: { viewed: true },
    })
  } catch (error) {
    console.error('Failed to mark alert as viewed:', error)
  }
}

/**
 * Mark all alerts as viewed for a saved search
 *
 * @param savedSearchId - Saved search ID
 */
export async function markSearchAlertsAsViewed(savedSearchId: string): Promise<void> {
  try {
    await prisma.searchAlert.updateMany({
      where: {
        savedSearchId,
        viewed: false,
      },
      data: { viewed: true },
    })
  } catch (error) {
    console.error('Failed to mark search alerts as viewed:', error)
  }
}

/**
 * Delete old viewed alerts (cleanup)
 *
 * @param daysOld - Alerts older than this will be deleted (default: 30)
 * @returns Number of alerts deleted
 */
export async function cleanupOldAlerts(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await prisma.searchAlert.deleteMany({
      where: {
        viewed: true,
        createdAt: { lt: cutoffDate },
      },
    })

    console.log(`Cleaned up ${result.count} old alerts`)
    return result.count
  } catch (error) {
    console.error('Failed to cleanup old alerts:', error)
    return 0
  }
}

/**
 * Export service interface
 */
export const searchAlertService = {
  checkSavedSearchAlerts,
  getUnreadAlerts,
  markAlertAsViewed,
  markSearchAlertsAsViewed,
  cleanupOldAlerts,
}
