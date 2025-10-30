/**
 * FirstAidUpdater - Scheduled job for checking First Aid edition updates
 *
 * Epic 3 - Story 3.3 - AC#8: Scheduled update checks
 *
 * Features:
 * - Monthly scheduled check for new First Aid editions
 * - Automatic version comparison for all users
 * - Send notifications when updates are available
 * - Log all update check attempts and results
 * - Configurable schedule and notification preferences
 *
 * Architecture:
 * - Uses node-cron for scheduling
 * - Integrates with FirstAidVersionChecker
 * - Integrates with FirstAidUpdateNotifier
 * - Supports enable/disable via environment variables
 *
 * Schedule: Monthly on 1st at 2:00 AM (configurable)
 * Cron expression: '0 2 1 * *'
 */

import cron from 'node-cron'
import type { NotificationMethod } from '@/lib/first-aid-update-notifier'
import { firstAidUpdateNotifier } from '@/lib/first-aid-update-notifier'
import { firstAidVersionChecker } from '@/lib/first-aid-version-checker'

/**
 * Job execution result
 */
export interface JobExecutionResult {
  executedAt: Date
  usersChecked: number
  updatesFound: number
  notificationsSent: number
  notificationsFailed: number
  errors: string[]
  duration: number // milliseconds
  success: boolean
}

/**
 * Job configuration
 */
export interface FirstAidUpdaterConfig {
  enabled: boolean // Enable/disable job
  schedule: string // Cron expression
  notificationMethod: NotificationMethod
  dryRun: boolean // Don't send notifications, just log
  logResults: boolean // Log results to console
}

/**
 * FirstAidUpdater handles scheduled checks for First Aid updates
 *
 * @example
 * ```typescript
 * const updater = new FirstAidUpdater({
 *   enabled: true,
 *   schedule: '0 2 1 * *', // Monthly at 2 AM
 *   notificationMethod: 'IN_APP',
 *   dryRun: false,
 *   logResults: true
 * })
 *
 * updater.start()
 * ```
 */
export class FirstAidUpdater {
  private job: cron.ScheduledTask | null = null
  private config: FirstAidUpdaterConfig
  private lastExecution: JobExecutionResult | null = null
  private isRunning = false

  constructor(config?: Partial<FirstAidUpdaterConfig>) {
    this.config = {
      enabled: config?.enabled ?? this.isEnabled(),
      schedule: config?.schedule ?? process.env.FIRST_AID_UPDATE_SCHEDULE ?? '0 2 1 * *',
      notificationMethod: (config?.notificationMethod ?? 'IN_APP') as NotificationMethod,
      dryRun: config?.dryRun ?? false,
      logResults: config?.logResults ?? true,
    }
  }

  /**
   * Start the scheduled job
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('⏸️  First Aid updater is disabled (FIRST_AID_UPDATE_ENABLED=false)')
      return
    }

    if (this.job) {
      console.log('⚠️  First Aid updater is already running')
      return
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`🚀 Starting First Aid Update Checker`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`   Schedule: ${this.config.schedule}`)
    console.log(`   Notification method: ${this.config.notificationMethod}`)
    console.log(`   Dry run: ${this.config.dryRun}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

    this.job = cron.schedule(
      this.config.schedule,
      async () => {
        await this.execute()
      },
      {
        timezone: 'America/New_York', // Adjust to your timezone
      },
    )

    console.log(`✓ First Aid updater started successfully`)
    console.log(`✓ Next check will run according to schedule: ${this.config.schedule}\n`)
  }

  /**
   * Stop the scheduled job
   */
  stop(): void {
    if (!this.job) {
      console.log('⚠️  First Aid updater is not running')
      return
    }

    this.job.stop()
    this.job = null
    console.log('✓ First Aid updater stopped')
  }

  /**
   * Execute the update check (can be called manually)
   */
  async execute(): Promise<JobExecutionResult> {
    if (this.isRunning) {
      console.warn('⚠️  First Aid update check is already running, skipping...')
      return this.lastExecution!
    }

    this.isRunning = true
    const startTime = Date.now()
    const errors: string[] = []

    if (this.config.logResults) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`🔄 Running First Aid update check`)
      console.log(`   Time: ${new Date().toISOString()}`)
      console.log(`   Dry run: ${this.config.dryRun}`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    }

    try {
      // Step 1: Check for updates for all users
      const updateResults = await firstAidVersionChecker.checkAllUsers()

      // Step 2: Filter users with available updates
      const usersWithUpdates = new Map(
        Array.from(updateResults.entries()).filter(([, result]) => result.updateAvailable),
      )

      if (this.config.logResults) {
        console.log(`\n📊 Update check results:`)
        console.log(`   Users checked: ${updateResults.size}`)
        console.log(`   Updates available: ${usersWithUpdates.size}`)
      }

      // Step 3: Send notifications (if not dry run)
      let notificationResults: Array<{ success: boolean }> = []

      if (usersWithUpdates.size > 0) {
        if (this.config.dryRun) {
          console.log(`\n🔍 DRY RUN: Would send ${usersWithUpdates.size} notifications`)
          console.log(`   Users with updates:`)
          for (const [userId, result] of usersWithUpdates) {
            console.log(
              `   - ${userId}: ${result.currentVersion} → ${result.latestVersion} (${result.versionDifference} version${result.versionDifference > 1 ? 's' : ''} behind)`,
            )
          }
        } else {
          notificationResults = await firstAidUpdateNotifier.notifyMultipleUsers(
            usersWithUpdates,
            this.config.notificationMethod,
          )
        }
      }

      // Step 4: Calculate results
      const duration = Date.now() - startTime
      const result: JobExecutionResult = {
        executedAt: new Date(),
        usersChecked: updateResults.size,
        updatesFound: usersWithUpdates.size,
        notificationsSent: notificationResults.filter((r) => r.success).length,
        notificationsFailed: notificationResults.filter((r) => !r.success).length,
        errors,
        duration,
        success: true,
      }

      this.lastExecution = result

      if (this.config.logResults) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        console.log(`✅ First Aid update check completed`)
        console.log(`   Duration: ${duration}ms`)
        console.log(`   Users checked: ${result.usersChecked}`)
        console.log(`   Updates found: ${result.updatesFound}`)
        if (!this.config.dryRun) {
          console.log(`   Notifications sent: ${result.notificationsSent}`)
          console.log(`   Notifications failed: ${result.notificationsFailed}`)
        }
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
      }

      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(errorMsg)

      if (this.config.logResults) {
        console.error(`\n❌ First Aid update check failed:`)
        console.error(`   Error: ${errorMsg}`)
      }

      const duration = Date.now() - startTime
      const result: JobExecutionResult = {
        executedAt: new Date(),
        usersChecked: 0,
        updatesFound: 0,
        notificationsSent: 0,
        notificationsFailed: 0,
        errors,
        duration,
        success: false,
      }

      this.lastExecution = result
      return result
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Get last execution result
   */
  getLastExecution(): JobExecutionResult | null {
    return this.lastExecution
  }

  /**
   * Check if job is currently running
   */
  isJobRunning(): boolean {
    return this.isRunning
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      running: !!this.job,
      schedule: this.config.schedule,
      lastExecution: this.lastExecution,
      isExecuting: this.isRunning,
    }
  }

  /**
   * Update job configuration
   */
  updateConfig(newConfig: Partial<FirstAidUpdaterConfig>): void {
    const wasRunning = !!this.job

    if (wasRunning) {
      this.stop()
    }

    this.config = {
      ...this.config,
      ...newConfig,
    }

    if (wasRunning && this.config.enabled) {
      this.start()
    }
  }

  /**
   * Check if job is enabled via environment variable
   */
  private isEnabled(): boolean {
    return process.env.FIRST_AID_UPDATE_ENABLED !== 'false'
  }
}

/**
 * Singleton instance for application-wide use
 */
let firstAidUpdaterInstance: FirstAidUpdater | null = null

export function getFirstAidUpdater(config?: Partial<FirstAidUpdaterConfig>): FirstAidUpdater {
  if (!firstAidUpdaterInstance) {
    firstAidUpdaterInstance = new FirstAidUpdater(config)
  }
  return firstAidUpdaterInstance
}

/**
 * Start the First Aid updater (convenience function)
 */
export function startFirstAidUpdater(config?: Partial<FirstAidUpdaterConfig>): FirstAidUpdater {
  const updater = getFirstAidUpdater(config)
  updater.start()
  return updater
}

/**
 * Stop the First Aid updater (convenience function)
 */
export function stopFirstAidUpdater(): void {
  if (firstAidUpdaterInstance) {
    firstAidUpdaterInstance.stop()
  }
}

/**
 * Manual execution (for testing or admin trigger)
 */
export async function runFirstAidUpdateCheck(): Promise<JobExecutionResult> {
  const updater = getFirstAidUpdater()
  return updater.execute()
}
