#!/usr/bin/env tsx
/**
 * Privacy Compliance Script: Anonymize Search Data
 * Story 3.1 Task 6.6: Privacy compliance - GDPR data anonymization
 *
 * This script should be run periodically (e.g., daily via cron) to:
 * 1. Anonymize search queries older than 90 days
 * 2. Delete fully anonymized data after retention period (180 days total)
 *
 * Usage:
 *   npx tsx scripts/anonymize-search-data.ts
 *
 * Cron schedule (daily at 2 AM):
 *   0 2 * * * cd /path/to/app && npx tsx scripts/anonymize-search-data.ts
 *
 * Environment variables:
 *   DATABASE_URL - PostgreSQL connection string
 *   ANONYMIZATION_DAYS - Days before anonymization (default: 90)
 *   DELETION_DAYS_AFTER_ANONYMIZATION - Days after anonymization to delete (default: 90)
 */

import { searchAnalyticsService } from '../src/lib/search-analytics-service'

/**
 * Main execution function
 */
async function main() {
  console.log('='.repeat(80))
  console.log('Search Data Privacy Compliance Script')
  console.log('='.repeat(80))
  console.log(`Started at: ${new Date().toISOString()}\n`)

  const anonymizationDays = Number(process.env.ANONYMIZATION_DAYS) || 90
  const deletionDaysAfterAnonymization = Number(process.env.DELETION_DAYS_AFTER_ANONYMIZATION) || 90

  console.log(`Configuration:`)
  console.log(`  - Anonymization threshold: ${anonymizationDays} days`)
  console.log(`  - Deletion after anonymization: ${deletionDaysAfterAnonymization} days`)
  console.log()

  try {
    // Step 1: Anonymize old search queries
    console.log(`Step 1: Anonymizing search queries older than ${anonymizationDays} days...`)
    const anonymizedCount =
      await searchAnalyticsService.anonymizeOldSearchQueries(anonymizationDays)
    console.log(`✓ Anonymized ${anonymizedCount} search queries\n`)

    // Step 2: Delete very old anonymized data
    console.log(
      `Step 2: Deleting anonymized data older than ${deletionDaysAfterAnonymization} days after anonymization...`,
    )
    const { queriesDeleted, clicksDeleted } =
      await searchAnalyticsService.deleteAnonymizedSearchData(deletionDaysAfterAnonymization)
    console.log(`✓ Deleted ${queriesDeleted} queries and ${clicksDeleted} clicks\n`)

    // Summary
    console.log('='.repeat(80))
    console.log('Summary:')
    console.log(`  - Total queries anonymized: ${anonymizedCount}`)
    console.log(`  - Total queries deleted: ${queriesDeleted}`)
    console.log(`  - Total clicks deleted: ${clicksDeleted}`)
    console.log(`Completed at: ${new Date().toISOString()}`)
    console.log('='.repeat(80))

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error during privacy compliance processing:')
    console.error(error)
    console.error(`\nFailed at: ${new Date().toISOString()}`)
    process.exit(1)
  }
}

// Run the script
main()
