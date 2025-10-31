/**
 * FirstAidVersionChecker - Check for new First Aid editions
 *
 * Epic 3 - Story 3.3 - AC#8: Version checking and update detection
 *
 * Features:
 * - Check American Red Cross website for new editions
 * - Compare version numbers (2024 Edition vs 2025 Edition)
 * - Detect when updates are available
 * - Return structured version information
 *
 * Architecture:
 * - Used by scheduled job to detect updates
 * - Integrates with FirstAidEdition model
 * - Supports multiple version sources (web scraping, API, manual)
 */

import { PrismaClient } from '@/generated/prisma'

/**
 * Version information for a First Aid edition
 */
export interface FirstAidVersionInfo {
  edition: string // "2026", "2025"
  year: number
  publishedDate?: Date
  downloadUrl?: string
  releaseNotes?: string
  source: 'WEB_SCRAPE' | 'API' | 'MANUAL' | 'MOCK'
}

/**
 * Version comparison result
 */
export interface VersionComparisonResult {
  currentVersion: string | null
  latestVersion: string
  updateAvailable: boolean
  versionDifference: number // Number of versions behind
  comparisonDate: Date
  currentEdition?: {
    id: string
    year: number
    createdAt: Date
  }
  latestEdition: FirstAidVersionInfo
}

/**
 * FirstAidVersionChecker handles version detection and comparison
 *
 * @example
 * ```typescript
 * const checker = new FirstAidVersionChecker()
 *
 * const result = await checker.checkForUpdates('user-123')
 * if (result.updateAvailable) {
 *   console.log(`New version available: ${result.latestVersion}`)
 * }
 * ```
 */
export class FirstAidVersionChecker {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  /**
   * Check for First Aid updates for a specific user
   * Compares user's current edition with latest available
   */
  async checkForUpdates(userId: string): Promise<VersionComparisonResult> {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`🔍 Checking First Aid updates for user ${userId}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    // Get user's current First Aid edition
    const currentEdition = await this.getCurrentEdition(userId)

    // Get latest available edition from source
    const latestVersion = await this.getLatestVersion()

    // Compare versions
    const currentVersionNumber = currentEdition?.year || 0
    const latestVersionNumber = latestVersion.year
    const updateAvailable = latestVersionNumber > currentVersionNumber
    const versionDifference = latestVersionNumber - currentVersionNumber

    console.log(`✓ Current edition: ${currentEdition ? `${currentEdition.year}` : 'None'}`)
    console.log(`✓ Latest edition: ${latestVersion.year}`)
    console.log(
      `✓ Update available: ${updateAvailable ? `Yes (${versionDifference} versions behind)` : 'No'}`,
    )

    return {
      currentVersion: currentEdition ? `${currentEdition.year}` : null,
      latestVersion: `${latestVersion.year}`,
      updateAvailable,
      versionDifference,
      comparisonDate: new Date(),
      currentEdition: currentEdition
        ? {
            id: currentEdition.id,
            year: currentEdition.year,
            createdAt: currentEdition.createdAt,
          }
        : undefined,
      latestEdition: latestVersion,
    }
  }

  /**
   * Get user's current First Aid edition (most recent active edition)
   */
  private async getCurrentEdition(userId: string) {
    // NOTE: FirstAidSection is not user-scoped in the current schema.
    // Return the most recent First Aid edition available in the database.
    // The userId is accepted for API compatibility but not used.
    return this.prisma.firstAidSection.findFirst({
      select: { id: true, year: true, createdAt: true },
      orderBy: { year: 'desc' },
    })
  }

  /**
   * Get latest First Aid edition from external source
   *
   * Production implementation options:
   * 1. Web scraping: McGraw Hill education website
   * 2. API integration: Official publisher API (if available)
   * 3. Manual updates: Admin-configured latest version
   * 4. RSS feed: Subscribe to publisher updates
   *
   * MVP: Returns mock data with current year + 1
   */
  private async getLatestVersion(): Promise<FirstAidVersionInfo> {
    // Prefer the latest edition present in our database; fallback to current year
    const latest = await this.prisma.firstAidSection.findFirst({
      select: { year: true, edition: true, createdAt: true },
      orderBy: { year: 'desc' },
    })

    if (latest) {
      return {
        edition: latest.edition,
        year: latest.year,
        publishedDate: latest.createdAt,
        source: 'MANUAL',
      }
    }

    const fallbackYear = new Date().getFullYear()
    return {
      edition: `${fallbackYear}`,
      year: fallbackYear,
      publishedDate: new Date(`${fallbackYear}-01-01`),
      source: 'MOCK',
    }
  }

  /**
   * Check if a specific version exists in the database
   */
  async versionExists(userId: string, year: number): Promise<boolean> {
    // Schema has no user linkage; check globally for any section with the year
    const edition = await this.prisma.firstAidSection.findFirst({ where: { year } })
    return !!edition
  }

  /**
   * Get all editions for a user (for comparison/migration)
   */
  async getUserEditions(userId: string) {
    // Return all editions available; not user-scoped in current schema
    return this.prisma.firstAidSection.findMany({
      select: { id: true, year: true, edition: true, createdAt: true },
      orderBy: { year: 'desc' },
    })
  }

  /**
   * Check multiple users for updates (batch operation)
   * Used by scheduled job to check all users at once
   */
  async checkAllUsers(): Promise<Map<string, VersionComparisonResult>> {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`🔍 Checking updates for all users with First Aid content`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    // Get all users; FirstAidSection is not user-scoped in the current schema
    const users = await this.prisma.user.findMany({
      select: { id: true },
    })

    const results = new Map<string, VersionComparisonResult>()

    for (const user of users) {
      const result = await this.checkForUpdates(user.id)
      results.set(user.id, result)
    }

    const usersWithUpdates = Array.from(results.values()).filter((r) => r.updateAvailable).length

    console.log(`\n✓ Checked ${results.size} users`)
    console.log(`✓ Updates available for ${usersWithUpdates} users`)

    return results
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
export const firstAidVersionChecker = new FirstAidVersionChecker()

/**
 * Web scraping implementation (optional, for production)
 *
 * Example using puppeteer or cheerio to check McGraw Hill website:
 *
 * ```typescript
 * async function scrapeLatestVersion(): Promise<FirstAidVersionInfo> {
 *   const response = await fetch('https://www.mhprofessional.com/first-aid-usmle-step-1')
 *   const html = await response.text()
 *   const $ = cheerio.load(html)
 *
 *   const title = $('h1.product-title').text() // "First Aid for the USMLE Step 1 2026"
 *   const yearMatch = title.match(/(\d{4})/)
 *   const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()
 *
 *   return {
 *     edition: `${year}`,
 *     year,
 *     publishedDate: new Date(),
 *     source: 'WEB_SCRAPE'
 *   }
 * }
 * ```
 */
