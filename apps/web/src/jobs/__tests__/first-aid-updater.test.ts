/**
 * Tests for FirstAidUpdater scheduled job
 *
 * Epic 3 - Story 3.3 - AC#8: Update system tests
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { firstAidUpdateNotifier } from '@/lib/first-aid-update-notifier'
import { firstAidVersionChecker } from '@/lib/first-aid-version-checker'
import { FirstAidUpdater } from '../first-aid-updater'

// Mock dependencies
jest.mock('@/lib/first-aid-version-checker')
jest.mock('@/lib/first-aid-update-notifier')

describe('FirstAidUpdater', () => {
  let updater: FirstAidUpdater

  beforeEach(() => {
    updater = new FirstAidUpdater({
      enabled: true,
      schedule: '0 2 1 * *',
      notificationMethod: 'IN_APP',
      dryRun: false,
      logResults: false,
    })

    // Clear all mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    updater.stop()
  })

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      const defaultUpdater = new FirstAidUpdater()
      const status = defaultUpdater.getStatus()

      expect(status.schedule).toBe('0 2 1 * *')
      expect(status.enabled).toBe(true)
    })

    it('should initialize with custom config', () => {
      const customUpdater = new FirstAidUpdater({
        schedule: '0 0 * * *',
        dryRun: true,
      })
      const status = customUpdater.getStatus()

      expect(status.schedule).toBe('0 0 * * *')
    })

    it('should update config dynamically', () => {
      updater.updateConfig({ schedule: '0 3 1 * *' })
      const status = updater.getStatus()

      expect(status.schedule).toBe('0 3 1 * *')
    })
  })

  describe('Job Execution', () => {
    it('should execute update check successfully', async () => {
      // Mock version checker to return updates for 2 users
      const mockUpdateResults = new Map([
        [
          'user-1',
          {
            currentVersion: '2024',
            latestVersion: '2025',
            updateAvailable: true,
            versionDifference: 1,
            comparisonDate: new Date(),
            latestEdition: {
              edition: '2025',
              year: 2025,
              source: 'MOCK' as const,
            },
          },
        ],
        [
          'user-2',
          {
            currentVersion: '2025',
            latestVersion: '2025',
            updateAvailable: false,
            versionDifference: 0,
            comparisonDate: new Date(),
            latestEdition: {
              edition: '2025',
              year: 2025,
              source: 'MOCK' as const,
            },
          },
        ],
      ])

      jest.mocked(firstAidVersionChecker.checkAllUsers).mockResolvedValue(mockUpdateResults)

      // Mock notifier to return success
      jest.mocked(firstAidUpdateNotifier.notifyMultipleUsers).mockResolvedValue([
        {
          userId: 'user-1',
          method: 'IN_APP',
          success: true,
          sentAt: new Date(),
        },
      ])

      const result = await updater.execute()

      expect(result.success).toBe(true)
      expect(result.usersChecked).toBe(2)
      expect(result.updatesFound).toBe(1)
      expect(result.notificationsSent).toBe(1)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle dry run mode', async () => {
      const dryRunUpdater = new FirstAidUpdater({
        dryRun: true,
        logResults: false,
      })

      const mockUpdateResults = new Map([
        [
          'user-1',
          {
            currentVersion: '2024',
            latestVersion: '2025',
            updateAvailable: true,
            versionDifference: 1,
            comparisonDate: new Date(),
            latestEdition: {
              edition: '2025',
              year: 2025,
              source: 'MOCK' as const,
            },
          },
        ],
      ])

      jest.mocked(firstAidVersionChecker.checkAllUsers).mockResolvedValue(mockUpdateResults)

      const result = await dryRunUpdater.execute()

      expect(result.success).toBe(true)
      expect(result.usersChecked).toBe(1)
      expect(result.updatesFound).toBe(1)
      expect(result.notificationsSent).toBe(0) // No notifications sent in dry run
      expect(firstAidUpdateNotifier.notifyMultipleUsers).not.toHaveBeenCalled()
    })

    it('should handle execution errors gracefully', async () => {
      // Mock version checker to throw error
      jest
        .mocked(firstAidVersionChecker.checkAllUsers)
        .mockRejectedValue(new Error('Database connection failed'))

      const result = await updater.execute()

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Database connection failed')
      expect(result.usersChecked).toBe(0)
    })

    it('should prevent concurrent executions', async () => {
      // Create a long-running mock
      jest
        .mocked(firstAidVersionChecker.checkAllUsers)
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(new Map()), 1000)),
        )

      const execution1 = updater.execute()
      const execution2 = updater.execute() // Should be skipped

      const result1 = await execution1
      const result2 = await execution2

      expect(result1).toBe(result2) // Should return same result
      expect(firstAidVersionChecker.checkAllUsers).toHaveBeenCalledTimes(1)
    })
  })

  describe('Job Status', () => {
    it('should track job status correctly', () => {
      const status = updater.getStatus()

      expect(status.enabled).toBe(true)
      expect(status.running).toBe(false)
      expect(status.schedule).toBe('0 2 1 * *')
      expect(status.isExecuting).toBe(false)
    })

    it('should update status after starting job', () => {
      updater.start()
      const status = updater.getStatus()

      expect(status.running).toBe(true)

      updater.stop()
    })

    it('should track last execution', async () => {
      jest.mocked(firstAidVersionChecker.checkAllUsers).mockResolvedValue(new Map())

      expect(updater.getLastExecution()).toBeNull()

      await updater.execute()

      const lastExecution = updater.getLastExecution()
      expect(lastExecution).not.toBeNull()
      expect(lastExecution?.executedAt).toBeInstanceOf(Date)
    })
  })

  describe('Job Lifecycle', () => {
    it('should start and stop job correctly', () => {
      updater.start()
      expect(updater.getStatus().running).toBe(true)

      updater.stop()
      expect(updater.getStatus().running).toBe(false)
    })

    it('should prevent starting job twice', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      updater.start()
      updater.start() // Should warn

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already running'))

      updater.stop()
      consoleSpy.mockRestore()
    })

    it('should not start if disabled', () => {
      const disabledUpdater = new FirstAidUpdater({ enabled: false })
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      disabledUpdater.start()

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('disabled'))
      expect(disabledUpdater.getStatus().running).toBe(false)

      consoleSpy.mockRestore()
    })
  })
})
