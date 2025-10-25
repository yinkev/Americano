/**
 * FirstAidUpdateNotifier - Send notifications for First Aid updates
 *
 * Epic 3 - Story 3.3 - AC#8: Update notifications
 *
 * Features:
 * - Send in-app notifications when updates are available
 * - Email notifications (optional)
 * - Log all notification attempts
 * - Support notification preferences
 *
 * Architecture:
 * - Integrates with version checker
 * - Uses existing notification system
 * - Stores notification history in database
 */

import { prisma } from '@/lib/db'
import type { VersionComparisonResult } from './first-aid-version-checker'

/**
 * Notification delivery method
 */
export type NotificationMethod = 'IN_APP' | 'EMAIL' | 'BOTH'

/**
 * Notification result
 */
export interface NotificationResult {
  userId: string
  method: NotificationMethod
  success: boolean
  sentAt: Date
  error?: string
}

/**
 * FirstAidUpdateNotifier handles sending update notifications
 *
 * @example
 * ```typescript
 * const notifier = new FirstAidUpdateNotifier()
 *
 * await notifier.notifyUser('user-123', versionResult)
 * ```
 */
export class FirstAidUpdateNotifier {
  private prisma = prisma

  constructor() {
    // uses singleton prisma
  }

  /**
   * Notify a user about available First Aid update
   */
  async notifyUser(
    userId: string,
    versionResult: VersionComparisonResult,
    method: NotificationMethod = 'IN_APP'
  ): Promise<NotificationResult> {
    console.log(`📧 Sending update notification to user ${userId}`)

    try {
      // Create notification content
      const notification = this.createNotificationContent(versionResult)

      // Send notification based on method
      if (method === 'IN_APP' || method === 'BOTH') {
        await this.sendInAppNotification(userId, notification)
      }

      if (method === 'EMAIL' || method === 'BOTH') {
        await this.sendEmailNotification(userId, notification)
      }

      // Log notification
      await this.logNotification(userId, notification, true)

      console.log(`✓ Notification sent successfully`)

      return {
        userId,
        method,
        success: true,
        sentAt: new Date(),
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Failed to send notification: ${errorMsg}`)

      // Log failed notification
      await this.logNotification(userId, 'Notification failed', false, errorMsg)

      return {
        userId,
        method,
        success: false,
        sentAt: new Date(),
        error: errorMsg,
      }
    }
  }

  /**
   * Notify multiple users about updates (batch operation)
   */
  async notifyMultipleUsers(
    updates: Map<string, VersionComparisonResult>,
    method: NotificationMethod = 'IN_APP'
  ): Promise<NotificationResult[]> {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`📧 Sending notifications to ${updates.size} users`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    const results: NotificationResult[] = []

    for (const [userId, versionResult] of updates) {
      // Only notify if update is available
      if (versionResult.updateAvailable) {
        const result = await this.notifyUser(userId, versionResult, method)
        results.push(result)
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    console.log(`\n✓ Notifications sent: ${successCount} success, ${failCount} failed`)

    return results
  }

  /**
   * Create notification content from version result
   */
  private createNotificationContent(versionResult: VersionComparisonResult): string {
    const { latestVersion, currentVersion, versionDifference } = versionResult

    if (!currentVersion) {
      return `First Aid for USMLE Step 1 ${latestVersion} Edition is now available! Upload your copy to get started with cross-references and board exam preparation.`
    }

    return `First Aid for USMLE Step 1 ${latestVersion} Edition is available! You're currently using the ${currentVersion} edition (${versionDifference} version${versionDifference > 1 ? 's' : ''} behind). Upload the new edition to get updated content and mappings.`
  }

  /**
   * Send in-app notification
   * MVP: Log to behavioral events
   * Production: Use real-time notification system (WebSocket, push notifications)
   */
  private async sendInAppNotification(userId: string, message: string): Promise<void> {
    // Store as behavioral event for user to see in dashboard
    await this.prisma.behavioralEvent.create({
      data: {
        userId,
        eventType: 'SEARCH_PERFORMED', // Reusing existing event type; add FIRST_AID_UPDATE_AVAILABLE in production
        eventData: {
          type: 'FIRST_AID_UPDATE_NOTIFICATION',
          message,
          timestamp: new Date().toISOString(),
          read: false,
        },
        timestamp: new Date(),
      },
    })

    console.log(`✓ In-app notification created`)
  }

  /**
   * Send email notification
   * MVP: Mock implementation
   * Production: Integrate with email service (SendGrid, AWS SES, etc.)
   */
  private async sendEmailNotification(userId: string, message: string): Promise<void> {
    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })

    if (!user?.email) {
      console.warn(`⚠️  User ${userId} has no email address, skipping email notification`)
      return
    }

    // MVP: Just log the email
    // Production: Use actual email service
    console.log(`📧 Email notification (MOCK):`)
    console.log(`   To: ${user.email} (${user.name || 'User'})`)
    console.log(`   Subject: New First Aid Edition Available`)
    console.log(`   Body: ${message}`)

    // Production implementation:
    // await emailService.send({
    //   to: user.email,
    //   subject: 'New First Aid Edition Available',
    //   body: message,
    //   template: 'first-aid-update'
    // })
  }

  /**
   * Log notification to database for audit trail
   */
  private async logNotification(
    userId: string,
    message: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    await this.prisma.behavioralEvent.create({
      data: {
        userId,
        eventType: 'SEARCH_PERFORMED', // Using existing type; add NOTIFICATION_SENT in production
        eventData: {
          type: 'FIRST_AID_UPDATE_NOTIFICATION_LOG',
          message,
          success,
          error,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date(),
      },
    })
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(userId: string, limit = 10) {
    const events = await this.prisma.behavioralEvent.findMany({
      where: {
        userId,
        eventType: 'SEARCH_PERFORMED', // Filter in application layer
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit * 2, // Get more to filter
    })

    // Filter for notification events
    return events
      .filter(e => {
        const data = e.eventData as { type?: string }
        return (
          data.type === 'FIRST_AID_UPDATE_NOTIFICATION' ||
          data.type === 'FIRST_AID_UPDATE_NOTIFICATION_LOG'
        )
      })
      .slice(0, limit)
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

/**
 * Singleton instance for application-wide use
 */
export const firstAidUpdateNotifier = new FirstAidUpdateNotifier()
