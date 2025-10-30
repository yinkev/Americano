#!/usr/bin/env tsx

/**
 * Autocomplete Performance Test Runner
 * Story 3.6: Standalone script to validate <100ms performance target
 *
 * Usage:
 *   pnpm tsx scripts/test-autocomplete-performance.ts
 *
 * Environment:
 *   Requires DATABASE_URL environment variable
 */

import { runPerformanceTests } from '../src/__tests__/performance/autocomplete-performance.test'

async function main() {
  try {
    // Check environment
    if (!process.env.DATABASE_URL) {
      console.error('❌ Error: DATABASE_URL environment variable not set')
      process.exit(1)
    }

    console.log('🔧 Environment: ' + (process.env.NODE_ENV || 'development'))
    console.log(
      '🗄️  Database: ' + process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'configured',
    )
    console.log('')

    // Run tests
    await runPerformanceTests()

    console.log('\n✅ Performance testing complete')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Performance testing failed:', error)
    process.exit(1)
  }
}

main()
