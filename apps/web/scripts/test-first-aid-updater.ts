#!/usr/bin/env tsx
/**
 * Test script for First Aid Updater
 *
 * Usage:
 *   pnpm tsx scripts/test-first-aid-updater.ts
 *   pnpm tsx scripts/test-first-aid-updater.ts --dry-run
 *   pnpm tsx scripts/test-first-aid-updater.ts --status
 */

import { runFirstAidUpdateCheck, getFirstAidUpdater } from '../src/jobs/first-aid-updater'

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const isStatusOnly = args.includes('--status')

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`🧪 First Aid Updater Test Script`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  if (isStatusOnly) {
    // Just show status
    const updater = getFirstAidUpdater()
    const status = updater.getStatus()
    const lastExecution = updater.getLastExecution()

    console.log(`📊 Job Status:`)
    console.log(`   Enabled: ${status.enabled}`)
    console.log(`   Running: ${status.running}`)
    console.log(`   Schedule: ${status.schedule}`)
    console.log(`   Is Executing: ${status.isExecuting}`)

    if (lastExecution) {
      console.log(`\n📈 Last Execution:`)
      console.log(`   Time: ${lastExecution.executedAt.toISOString()}`)
      console.log(`   Users Checked: ${lastExecution.usersChecked}`)
      console.log(`   Updates Found: ${lastExecution.updatesFound}`)
      console.log(`   Notifications Sent: ${lastExecution.notificationsSent}`)
      console.log(`   Duration: ${lastExecution.duration}ms`)
      console.log(`   Success: ${lastExecution.success}`)

      if (lastExecution.errors.length > 0) {
        console.log(`\n❌ Errors:`)
        lastExecution.errors.forEach(error => console.log(`   - ${error}`))
      }
    } else {
      console.log(`\n⚠️  No execution history available`)
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    return
  }

  // Run update check
  console.log(`🔄 Running First Aid update check...`)
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (no notifications)' : 'LIVE'}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  const updater = getFirstAidUpdater({ dryRun: isDryRun, logResults: true })
  const result = await runFirstAidUpdateCheck()

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(result.success ? `✅ Test completed successfully` : `❌ Test failed`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  console.log(`📊 Results Summary:`)
  console.log(`   Executed at: ${result.executedAt.toISOString()}`)
  console.log(`   Users checked: ${result.usersChecked}`)
  console.log(`   Updates found: ${result.updatesFound}`)
  console.log(`   Notifications sent: ${result.notificationsSent}`)
  console.log(`   Notifications failed: ${result.notificationsFailed}`)
  console.log(`   Duration: ${result.duration}ms`)
  console.log(`   Success: ${result.success}`)

  if (result.errors.length > 0) {
    console.log(`\n❌ Errors encountered:`)
    result.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`)
    })
  }

  if (isDryRun && result.updatesFound > 0) {
    console.log(`\n💡 Dry run mode: ${result.updatesFound} notification(s) would have been sent`)
    console.log(`   Run without --dry-run to actually send notifications`)
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  process.exit(result.success ? 0 : 1)
}

main().catch(error => {
  console.error(`\n❌ Fatal error:`, error)
  process.exit(1)
})
