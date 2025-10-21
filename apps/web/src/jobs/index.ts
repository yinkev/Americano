/**
 * Job Manager - Centralized job initialization and management
 *
 * Epic 3 - Story 3.3 - AC#8: Job orchestration
 *
 * Features:
 * - Initialize all scheduled jobs
 * - Manage job lifecycle (start/stop)
 * - Monitor job health
 * - Provide job status API
 *
 * Usage:
 * ```typescript
 * import { initializeJobs, getJobManager } from '@/jobs'
 *
 * // On app startup
 * initializeJobs()
 *
 * // Get job status
 * const status = getJobManager().getStatus()
 * ```
 */

import { getFirstAidUpdater, type FirstAidUpdaterConfig } from './first-aid-updater'
import type { JobExecutionResult } from './first-aid-updater'

/**
 * Job manager for all scheduled jobs
 */
export class JobManager {
  private initialized = false

  /**
   * Initialize all scheduled jobs
   */
  initialize(config?: { firstAidUpdater?: Partial<FirstAidUpdaterConfig> }): void {
    if (this.initialized) {
      console.warn('⚠️  Jobs already initialized')
      return
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`🚀 Initializing Scheduled Jobs`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

    // Initialize First Aid updater
    const firstAidUpdater = getFirstAidUpdater(config?.firstAidUpdater)
    firstAidUpdater.start()

    this.initialized = true

    console.log(`\n✓ All scheduled jobs initialized`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  }

  /**
   * Stop all scheduled jobs
   */
  shutdown(): void {
    if (!this.initialized) {
      console.warn('⚠️  Jobs not initialized, nothing to shutdown')
      return
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`🛑 Shutting down scheduled jobs`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

    const firstAidUpdater = getFirstAidUpdater()
    firstAidUpdater.stop()

    this.initialized = false

    console.log(`\n✓ All scheduled jobs stopped`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    const firstAidUpdater = getFirstAidUpdater()

    return {
      initialized: this.initialized,
      jobs: {
        firstAidUpdater: firstAidUpdater.getStatus(),
      },
    }
  }

  /**
   * Get last execution results for all jobs
   */
  getLastExecutions(): Record<string, JobExecutionResult | null> {
    const firstAidUpdater = getFirstAidUpdater()

    return {
      firstAidUpdater: firstAidUpdater.getLastExecution(),
    }
  }
}

/**
 * Singleton job manager instance
 */
let jobManagerInstance: JobManager | null = null

export function getJobManager(): JobManager {
  if (!jobManagerInstance) {
    jobManagerInstance = new JobManager()
  }
  return jobManagerInstance
}

/**
 * Initialize all scheduled jobs (convenience function)
 */
export function initializeJobs(config?: { firstAidUpdater?: Partial<FirstAidUpdaterConfig> }): void {
  const manager = getJobManager()
  manager.initialize(config)
}

/**
 * Shutdown all scheduled jobs (convenience function)
 */
export function shutdownJobs(): void {
  const manager = getJobManager()
  manager.shutdown()
}

/**
 * Re-export job modules for direct access
 */
export { getFirstAidUpdater, startFirstAidUpdater, stopFirstAidUpdater, runFirstAidUpdateCheck } from './first-aid-updater'
export type { FirstAidUpdaterConfig, JobExecutionResult } from './first-aid-updater'
