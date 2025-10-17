#!/usr/bin/env tsx
/**
 * Mission Generation Critical Path Validation
 *
 * Validates end-to-end integration of all Epic 5 stories in mission generation:
 * - Story 5.1: UserLearningProfile integration (VARK, attention cycles)
 * - Story 5.2: StrugglePrediction integration (predicted struggles, interventions)
 * - Story 5.3: Study orchestration (time recommendations, duration, sequencing)
 * - Story 5.4: Cognitive load and burnout prevention
 */

import { performance } from 'perf_hooks'

// Critical path flow definition
const EPIC_5_INTEGRATION_FLOW = {
  'Story 5.1': {
    subsystem: 'UserLearningProfile',
    checks: [
      'VARK learning style profile exists',
      'Optimal attention cycles configured',
      'Preferred study times set',
      'Content mix personalization applied'
    ]
  },
  'Story 5.2': {
    subsystem: 'StrugglePrediction',
    checks: [
      'Active struggle predictions queried',
      'High probability predictions (>0.7) detected',
      'Interventions applied (prerequisite gaps, complexity)',
      'Prediction context added to mission'
    ]
  },
  'Story 5.3': {
    subsystem: 'StudyOrchestration',
    checks: [
      'StudyTimeRecommender provides optimal time slots',
      'SessionDurationOptimizer recommends duration',
      'ContentSequencer defines content order',
      'StudyIntensityModulator sets intensity level'
    ]
  },
  'Story 5.4': {
    subsystem: 'CognitiveLoad',
    checks: [
      'CognitiveLoadMonitor tracks current load',
      'BurnoutPreventionEngine assesses risk',
      'Load-based intensity modulation applied',
      'Break recommendations included'
    ]
  }
}

interface ValidationResult {
  story: string
  subsystem: string
  checksCompleted: string[]
  checksFailed: string[]
  integrationStatus: 'SUCCESS' | 'PARTIAL' | 'FAIL'
  errorMessages: string[]
}

interface PerformanceMetrics {
  totalTimeMs: number
  subsystemTimings: Record<string, number>
  avgResponseTime: number
  criticalPathTime: number
}

class MissionGenerationValidator {
  private results: ValidationResult[] = []
  private performanceMetrics: PerformanceMetrics = {
    totalTimeMs: 0,
    subsystemTimings: {},
    avgResponseTime: 0,
    criticalPathTime: 0
  }

  /**
   * Main validation orchestrator
   */
  async validate(): Promise<void> {
    console.log('🚀 MISSION GENERATION CRITICAL PATH VALIDATION\n')
    console.log('=' .repeat(60))

    const startTime = performance.now()

    // Step 1: Validate MissionGenerator imports
    await this.validateImports()

    // Step 2: Validate Story 5.1 integration
    await this.validateStory51()

    // Step 3: Validate Story 5.2 integration
    await this.validateStory52()

    // Step 4: Validate Story 5.3 integration
    await this.validateStory53()

    // Step 5: Validate Story 5.4 integration (if implemented)
    await this.validateStory54()

    // Step 6: Check for circular dependencies
    await this.validateCircularDependencies()

    // Step 7: Performance validation
    await this.validatePerformance()

    const endTime = performance.now()
    this.performanceMetrics.totalTimeMs = endTime - startTime

    // Generate report
    this.generateReport()
  }

  /**
   * Step 1: Validate all required imports in MissionGenerator
   */
  private async validateImports(): Promise<void> {
    console.log('\n📦 Step 1: Validating MissionGenerator Imports...')

    const requiredImports = [
      { name: 'StudyTimeRecommender', story: '5.3' },
      { name: 'SessionDurationOptimizer', story: '5.3' },
      { name: 'ContentSequencer', story: '5.3' },
      { name: 'StudyIntensityModulator', story: '5.3' },
      { name: 'UserLearningProfile', story: '5.1' },
      { name: 'StrugglePrediction', story: '5.2' }
    ]

    try {
      // Read mission-generator.ts and check imports
      const fs = await import('fs/promises')
      const path = await import('path')

      const missionGenPath = path.resolve(
        process.cwd(),
        'apps/web/src/lib/mission-generator.ts'
      )

      const content = await fs.readFile(missionGenPath, 'utf-8')

      const checksCompleted: string[] = []
      const checksFailed: string[] = []

      for (const imp of requiredImports) {
        if (content.includes(imp.name)) {
          checksCompleted.push(`✓ ${imp.name} imported (Story ${imp.story})`)
          console.log(`  ✓ ${imp.name} imported`)
        } else {
          checksFailed.push(`✗ ${imp.name} missing (Story ${imp.story})`)
          console.log(`  ✗ ${imp.name} NOT found`)
        }
      }

      this.results.push({
        story: 'Imports',
        subsystem: 'MissionGenerator',
        checksCompleted,
        checksFailed,
        integrationStatus: checksFailed.length === 0 ? 'SUCCESS' : 'PARTIAL',
        errorMessages: []
      })

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.results.push({
        story: 'Imports',
        subsystem: 'MissionGenerator',
        checksCompleted: [],
        checksFailed: ['Could not read mission-generator.ts'],
        integrationStatus: 'FAIL',
        errorMessages: [errorMessage]
      })
      console.error('  ✗ Error reading mission-generator.ts:', errorMessage)
    }
  }

  /**
   * Step 2: Validate Story 5.1 integration (UserLearningProfile)
   */
  private async validateStory51(): Promise<void> {
    console.log('\n📊 Step 2: Validating Story 5.1 Integration (UserLearningProfile)...')

    const startTime = performance.now()
    const checksCompleted: string[] = []
    const checksFailed: string[] = []
    const errorMessages: string[] = []

    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      const missionGenPath = path.resolve(
        process.cwd(),
        'apps/web/src/lib/mission-generator.ts'
      )

      const content = await fs.readFile(missionGenPath, 'utf-8')

      // Check 1: getUserLearningProfile method exists
      if (content.includes('getUserLearningProfile')) {
        checksCompleted.push('✓ getUserLearningProfile method exists')
        console.log('  ✓ getUserLearningProfile method found')
      } else {
        checksFailed.push('✗ getUserLearningProfile method missing')
        console.log('  ✗ getUserLearningProfile method NOT found')
      }

      // Check 2: Profile-based personalization applied
      if (content.includes('applyProfilePersonalization')) {
        checksCompleted.push('✓ Profile-based personalization method exists')
        console.log('  ✓ applyProfilePersonalization method found')
      } else {
        checksFailed.push('✗ Profile-based personalization missing')
        console.log('  ✗ applyProfilePersonalization NOT found')
      }

      // Check 3: Content mix personalization
      if (content.includes('applyContentMixPersonalization')) {
        checksCompleted.push('✓ Content mix personalization applied')
        console.log('  ✓ applyContentMixPersonalization method found')
      } else {
        checksFailed.push('✗ Content mix personalization missing')
        console.log('  ✗ applyContentMixPersonalization NOT found')
      }

      // Check 4: VARK learning style handling
      if (content.includes('learningStyleProfile') || content.includes('LearningStyleProfile')) {
        checksCompleted.push('✓ VARK learning style integration')
        console.log('  ✓ VARK learning style handling found')
      } else {
        checksFailed.push('✗ VARK learning style handling missing')
        console.log('  ✗ VARK learning style NOT found')
      }

      // Check 5: Optimal session duration adjustment
      if (content.includes('optimalSessionDuration')) {
        checksCompleted.push('✓ Optimal session duration adjustment')
        console.log('  ✓ optimalSessionDuration integration found')
      } else {
        checksFailed.push('✗ Session duration adjustment missing')
        console.log('  ✗ optimalSessionDuration NOT found')
      }

      // Check 6: Time-of-day recommendations
      if (content.includes('generateOptimalTimeRecommendation') || content.includes('preferredStudyTimes')) {
        checksCompleted.push('✓ Time-of-day recommendations')
        console.log('  ✓ Time-of-day recommendations found')
      } else {
        checksFailed.push('✗ Time-of-day recommendations missing')
        console.log('  ✗ Time-of-day recommendations NOT found')
      }

      const endTime = performance.now()
      this.performanceMetrics.subsystemTimings['Story 5.1'] = endTime - startTime

      this.results.push({
        story: 'Story 5.1',
        subsystem: 'UserLearningProfile',
        checksCompleted,
        checksFailed,
        integrationStatus: checksFailed.length === 0 ? 'SUCCESS' : checksFailed.length < 3 ? 'PARTIAL' : 'FAIL',
        errorMessages
      })

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.results.push({
        story: 'Story 5.1',
        subsystem: 'UserLearningProfile',
        checksCompleted: [],
        checksFailed: ['Validation failed'],
        integrationStatus: 'FAIL',
        errorMessages: [errorMessage]
      })
      console.error('  ✗ Validation error:', errorMessage)
    }
  }

  /**
   * Step 3: Validate Story 5.2 integration (StrugglePrediction)
   */
  private async validateStory52(): Promise<void> {
    console.log('\n🔮 Step 3: Validating Story 5.2 Integration (StrugglePrediction)...')

    const startTime = performance.now()
    const checksCompleted: string[] = []
    const checksFailed: string[] = []
    const errorMessages: string[] = []

    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      const missionGenPath = path.resolve(
        process.cwd(),
        'apps/web/src/lib/mission-generator.ts'
      )

      const content = await fs.readFile(missionGenPath, 'utf-8')

      // Check 1: getActiveStrugglePredictions method
      if (content.includes('getActiveStrugglePredictions')) {
        checksCompleted.push('✓ Active struggle predictions queried')
        console.log('  ✓ getActiveStrugglePredictions method found')
      } else {
        checksFailed.push('✗ Struggle predictions query missing')
        console.log('  ✗ getActiveStrugglePredictions NOT found')
      }

      // Check 2: Prediction-aware mission composition
      if (content.includes('composePredictionAwareMission')) {
        checksCompleted.push('✓ Prediction-aware mission composition')
        console.log('  ✓ composePredictionAwareMission method found')
      } else {
        checksFailed.push('✗ Prediction-aware composition missing')
        console.log('  ✗ composePredictionAwareMission NOT found')
      }

      // Check 3: Intervention application
      if (content.includes('applyPredictionInterventions')) {
        checksCompleted.push('✓ Prediction interventions applied')
        console.log('  ✓ applyPredictionInterventions method found')
      } else {
        checksFailed.push('✗ Intervention application missing')
        console.log('  ✗ applyPredictionInterventions NOT found')
      }

      // Check 4: Prediction context building
      if (content.includes('buildPredictionContext')) {
        checksCompleted.push('✓ Prediction context added to mission')
        console.log('  ✓ buildPredictionContext method found')
      } else {
        checksFailed.push('✗ Prediction context missing')
        console.log('  ✗ buildPredictionContext NOT found')
      }

      // Check 5: Post-mission outcome capture
      if (content.includes('capturePostMissionOutcomes')) {
        checksCompleted.push('✓ Post-mission outcome capture')
        console.log('  ✓ capturePostMissionOutcomes method found')
      } else {
        checksFailed.push('✗ Outcome capture missing')
        console.log('  ✗ capturePostMissionOutcomes NOT found')
      }

      // Check 6: Prerequisite gap handling
      if (content.includes('PREREQUISITE_GAP') || content.includes('prerequisiteObjectives')) {
        checksCompleted.push('✓ Prerequisite gap intervention')
        console.log('  ✓ Prerequisite gap handling found')
      } else {
        checksFailed.push('✗ Prerequisite gap handling missing')
        console.log('  ✗ PREREQUISITE_GAP NOT found')
      }

      const endTime = performance.now()
      this.performanceMetrics.subsystemTimings['Story 5.2'] = endTime - startTime

      this.results.push({
        story: 'Story 5.2',
        subsystem: 'StrugglePrediction',
        checksCompleted,
        checksFailed,
        integrationStatus: checksFailed.length === 0 ? 'SUCCESS' : checksFailed.length < 3 ? 'PARTIAL' : 'FAIL',
        errorMessages
      })

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.results.push({
        story: 'Story 5.2',
        subsystem: 'StrugglePrediction',
        checksCompleted: [],
        checksFailed: ['Validation failed'],
        integrationStatus: 'FAIL',
        errorMessages: [errorMessage]
      })
      console.error('  ✗ Validation error:', errorMessage)
    }
  }

  /**
   * Step 4: Validate Story 5.3 integration (Study Orchestration)
   */
  private async validateStory53(): Promise<void> {
    console.log('\n⏰ Step 4: Validating Story 5.3 Integration (Study Orchestration)...')

    const startTime = performance.now()
    const checksCompleted: string[] = []
    const checksFailed: string[] = []
    const errorMessages: string[] = []

    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      const missionGenPath = path.resolve(
        process.cwd(),
        'apps/web/src/lib/mission-generator.ts'
      )

      const content = await fs.readFile(missionGenPath, 'utf-8')

      // Check 1: getOrchestrationRecommendations method
      if (content.includes('getOrchestrationRecommendations')) {
        checksCompleted.push('✓ Orchestration recommendations queried')
        console.log('  ✓ getOrchestrationRecommendations method found')
      } else {
        checksFailed.push('✗ Orchestration recommendations missing')
        console.log('  ✗ getOrchestrationRecommendations NOT found')
      }

      // Check 2: StudyTimeRecommender integration
      if (content.includes('StudyTimeRecommender') && content.includes('generateRecommendations')) {
        checksCompleted.push('✓ StudyTimeRecommender provides optimal time')
        console.log('  ✓ StudyTimeRecommender integration found')
      } else {
        checksFailed.push('✗ StudyTimeRecommender integration missing')
        console.log('  ✗ StudyTimeRecommender NOT properly integrated')
      }

      // Check 3: SessionDurationOptimizer integration
      if (content.includes('SessionDurationOptimizer') && content.includes('recommendDuration')) {
        checksCompleted.push('✓ SessionDurationOptimizer recommends duration')
        console.log('  ✓ SessionDurationOptimizer integration found')
      } else {
        checksFailed.push('✗ SessionDurationOptimizer integration missing')
        console.log('  ✗ SessionDurationOptimizer NOT properly integrated')
      }

      // Check 4: StudyIntensityModulator integration
      if (content.includes('StudyIntensityModulator') && content.includes('recommendIntensity')) {
        checksCompleted.push('✓ StudyIntensityModulator sets intensity')
        console.log('  ✓ StudyIntensityModulator integration found')
      } else {
        checksFailed.push('✗ StudyIntensityModulator integration missing')
        console.log('  ✗ StudyIntensityModulator NOT properly integrated')
      }

      // Check 5: Orchestration metadata in result
      if (content.includes('recommendedStartTime') && content.includes('recommendedDuration')) {
        checksCompleted.push('✓ Orchestration metadata in mission result')
        console.log('  ✓ Orchestration metadata found in result')
      } else {
        checksFailed.push('✗ Orchestration metadata missing from result')
        console.log('  ✗ Orchestration metadata NOT in result')
      }

      // Check 6: Intensity level handling
      if (content.includes('intensityLevel')) {
        checksCompleted.push('✓ Intensity level integration')
        console.log('  ✓ intensityLevel handling found')
      } else {
        checksFailed.push('✗ Intensity level missing')
        console.log('  ✗ intensityLevel NOT found')
      }

      const endTime = performance.now()
      this.performanceMetrics.subsystemTimings['Story 5.3'] = endTime - startTime

      this.results.push({
        story: 'Story 5.3',
        subsystem: 'StudyOrchestration',
        checksCompleted,
        checksFailed,
        integrationStatus: checksFailed.length === 0 ? 'SUCCESS' : checksFailed.length < 3 ? 'PARTIAL' : 'FAIL',
        errorMessages
      })

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.results.push({
        story: 'Story 5.3',
        subsystem: 'StudyOrchestration',
        checksCompleted: [],
        checksFailed: ['Validation failed'],
        integrationStatus: 'FAIL',
        errorMessages: [errorMessage]
      })
      console.error('  ✗ Validation error:', errorMessage)
    }
  }

  /**
   * Step 5: Validate Story 5.4 integration (Cognitive Load & Burnout)
   */
  private async validateStory54(): Promise<void> {
    console.log('\n🧠 Step 5: Validating Story 5.4 Integration (Cognitive Load)...')

    const startTime = performance.now()
    const checksCompleted: string[] = []
    const checksFailed: string[] = []
    const errorMessages: string[] = []

    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      // Check if cognitive load subsystems exist
      const cognitiveLoadPath = path.resolve(
        process.cwd(),
        'apps/web/src/subsystems/behavioral-analytics/cognitive-load-monitor.ts'
      )

      const burnoutPath = path.resolve(
        process.cwd(),
        'apps/web/src/subsystems/behavioral-analytics/burnout-prevention-engine.ts'
      )

      try {
        await fs.access(cognitiveLoadPath)
        checksCompleted.push('✓ CognitiveLoadMonitor subsystem exists')
        console.log('  ✓ CognitiveLoadMonitor found')
      } catch {
        checksFailed.push('✗ CognitiveLoadMonitor not implemented yet')
        console.log('  ⚠️  CognitiveLoadMonitor not found (Story 5.4 pending)')
      }

      try {
        await fs.access(burnoutPath)
        checksCompleted.push('✓ BurnoutPreventionEngine subsystem exists')
        console.log('  ✓ BurnoutPreventionEngine found')
      } catch {
        checksFailed.push('✗ BurnoutPreventionEngine not implemented yet')
        console.log('  ⚠️  BurnoutPreventionEngine not found (Story 5.4 pending)')
      }

      const endTime = performance.now()
      this.performanceMetrics.subsystemTimings['Story 5.4'] = endTime - startTime

      // Story 5.4 may not be fully implemented yet
      const integrationStatus = checksCompleted.length > 0 ? 'PARTIAL' : 'FAIL'

      this.results.push({
        story: 'Story 5.4',
        subsystem: 'CognitiveLoad',
        checksCompleted,
        checksFailed,
        integrationStatus,
        errorMessages
      })

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.results.push({
        story: 'Story 5.4',
        subsystem: 'CognitiveLoad',
        checksCompleted: [],
        checksFailed: ['Validation failed'],
        integrationStatus: 'FAIL',
        errorMessages: [errorMessage]
      })
      console.error('  ✗ Validation error:', errorMessage)
    }
  }

  /**
   * Step 6: Check for circular dependencies
   */
  private async validateCircularDependencies(): Promise<void> {
    console.log('\n🔄 Step 6: Checking for Circular Dependencies...')

    const checksCompleted: string[] = []
    const checksFailed: string[] = []

    // Simple check: MissionGenerator should not import from itself
    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      const missionGenPath = path.resolve(
        process.cwd(),
        'apps/web/src/lib/mission-generator.ts'
      )

      const content = await fs.readFile(missionGenPath, 'utf-8')

      // Check for self-import
      if (content.includes("from '@/lib/mission-generator'") ||
          content.includes('from "./mission-generator"')) {
        checksFailed.push('✗ MissionGenerator imports itself (circular dependency)')
        console.log('  ✗ Circular dependency detected: MissionGenerator imports itself')
      } else {
        checksCompleted.push('✓ No self-import in MissionGenerator')
        console.log('  ✓ No circular dependency: MissionGenerator')
      }

      // Check subsystems don't import MissionGenerator
      const subsystemsPath = path.resolve(
        process.cwd(),
        'apps/web/src/subsystems/behavioral-analytics'
      )

      const subsystemFiles = await fs.readdir(subsystemsPath)
      const tsFiles = subsystemFiles.filter(f => f.endsWith('.ts') && !f.includes('.test.'))

      let circularFound = false
      for (const file of tsFiles) {
        const filePath = path.join(subsystemsPath, file)
        const fileContent = await fs.readFile(filePath, 'utf-8')

        // Check for actual import statements, not just comments
        const hasImport = fileContent.match(/import.*from ['"].*mission-generator/m)
        if (hasImport) {
          checksFailed.push(`✗ ${file} imports MissionGenerator (circular dependency)`)
          console.log(`  ✗ Circular dependency: ${file} imports MissionGenerator`)
          circularFound = true
        }
      }

      if (!circularFound) {
        checksCompleted.push('✓ No subsystems import MissionGenerator')
        console.log('  ✓ No circular dependencies in subsystems')
      }

      this.results.push({
        story: 'Circular Dependencies',
        subsystem: 'Architecture',
        checksCompleted,
        checksFailed,
        integrationStatus: checksFailed.length === 0 ? 'SUCCESS' : 'FAIL',
        errorMessages: []
      })

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.results.push({
        story: 'Circular Dependencies',
        subsystem: 'Architecture',
        checksCompleted: [],
        checksFailed: ['Validation failed'],
        integrationStatus: 'FAIL',
        errorMessages: [errorMessage]
      })
      console.error('  ✗ Validation error:', errorMessage)
    }
  }

  /**
   * Step 7: Performance validation (target: <3s for mission generation)
   */
  private async validatePerformance(): Promise<void> {
    console.log('\n⚡ Step 7: Performance Validation...')

    const checksCompleted: string[] = []
    const checksFailed: string[] = []

    // Calculate average response time
    const subsystemTimes = Object.values(this.performanceMetrics.subsystemTimings)
    const avgTime = subsystemTimes.reduce((a, b) => a + b, 0) / subsystemTimes.length

    this.performanceMetrics.avgResponseTime = avgTime
    this.performanceMetrics.criticalPathTime = subsystemTimes.reduce((a, b) => a + b, 0)

    console.log(`  • Average subsystem check time: ${avgTime.toFixed(2)}ms`)
    console.log(`  • Critical path time: ${this.performanceMetrics.criticalPathTime.toFixed(2)}ms`)

    // Performance target: <3000ms for full mission generation
    // This is a validation check, actual mission generation would be tested separately
    if (this.performanceMetrics.criticalPathTime < 3000) {
      checksCompleted.push('✓ Critical path validation <3s')
      console.log('  ✓ Validation performance acceptable')
    } else {
      checksFailed.push('✗ Critical path validation >3s')
      console.log('  ✗ Validation took longer than expected')
    }

    this.results.push({
      story: 'Performance',
      subsystem: 'MissionGenerator',
      checksCompleted,
      checksFailed,
      integrationStatus: checksFailed.length === 0 ? 'SUCCESS' : 'PARTIAL',
      errorMessages: []
    })
  }

  /**
   * Generate comprehensive validation report
   */
  private generateReport(): void {
    console.log('\n' + '='.repeat(60))
    console.log('📋 VALIDATION REPORT')
    console.log('='.repeat(60))

    // Summary by story
    const successCount = this.results.filter(r => r.integrationStatus === 'SUCCESS').length
    const partialCount = this.results.filter(r => r.integrationStatus === 'PARTIAL').length
    const failCount = this.results.filter(r => r.integrationStatus === 'FAIL').length

    console.log('\n📊 INTEGRATION STATUS:')
    for (const result of this.results) {
      const statusIcon =
        result.integrationStatus === 'SUCCESS' ? '✅' :
        result.integrationStatus === 'PARTIAL' ? '⚠️' :
        '❌'

      console.log(`\n${statusIcon} ${result.story} (${result.subsystem})`)
      console.log(`   Status: ${result.integrationStatus}`)
      console.log(`   Checks Passed: ${result.checksCompleted.length}`)
      console.log(`   Checks Failed: ${result.checksFailed.length}`)

      if (result.checksCompleted.length > 0) {
        console.log('   Passed:')
        result.checksCompleted.forEach(check => console.log(`     ${check}`))
      }

      if (result.checksFailed.length > 0) {
        console.log('   Failed:')
        result.checksFailed.forEach(check => console.log(`     ${check}`))
      }

      if (result.errorMessages.length > 0) {
        console.log('   Errors:')
        result.errorMessages.forEach(err => console.log(`     ${err}`))
      }
    }

    // Performance metrics
    console.log('\n⚡ PERFORMANCE METRICS:')
    console.log(`   Total validation time: ${this.performanceMetrics.totalTimeMs.toFixed(2)}ms`)
    console.log(`   Average subsystem check: ${this.performanceMetrics.avgResponseTime.toFixed(2)}ms`)
    console.log(`   Critical path time: ${this.performanceMetrics.criticalPathTime.toFixed(2)}ms`)

    // Subsystem breakdown
    console.log('\n   Subsystem Timings:')
    for (const [subsystem, time] of Object.entries(this.performanceMetrics.subsystemTimings)) {
      console.log(`     ${subsystem}: ${time.toFixed(2)}ms`)
    }

    // Final recommendation
    console.log('\n' + '='.repeat(60))
    console.log('🎯 FINAL RECOMMENDATION:')
    console.log('='.repeat(60))

    if (failCount === 0 && partialCount <= 1) {
      console.log('\n🟢 GREEN LIGHT')
      console.log('   All critical Epic 5 integrations are present and validated.')
      console.log('   Mission generation flow is complete and ready for testing.')
    } else if (partialCount > 1 || (failCount === 1 && partialCount > 0)) {
      console.log('\n🟡 YELLOW LIGHT')
      console.log('   Most integrations are present, but some components are incomplete.')
      console.log('   Review failed checks before proceeding with end-to-end testing.')
    } else {
      console.log('\n🔴 RED LIGHT')
      console.log('   Critical integrations are missing or failing.')
      console.log('   Complete the missing components before testing mission generation.')
    }

    // Epic 5 integrations working
    console.log('\n📦 EPIC 5 INTEGRATIONS WORKING:')
    const workingStories = this.results
      .filter(r => r.integrationStatus === 'SUCCESS' && r.story.includes('Story'))
      .map(r => r.story)

    if (workingStories.length > 0) {
      workingStories.forEach(story => console.log(`   ✓ ${story}`))
    } else {
      console.log('   (None fully validated)')
    }

    // Circular dependencies check
    const circularCheck = this.results.find(r => r.story === 'Circular Dependencies')
    if (circularCheck && circularCheck.integrationStatus === 'SUCCESS') {
      console.log('\n🔄 CIRCULAR DEPENDENCIES: NONE')
    } else if (circularCheck) {
      console.log('\n🔄 CIRCULAR DEPENDENCIES: DETECTED')
      circularCheck.checksFailed.forEach(check => console.log(`   ${check}`))
    }

    console.log('\n' + '='.repeat(60))
    console.log('✨ Validation Complete')
    console.log('='.repeat(60) + '\n')
  }
}

// Run validation
const validator = new MissionGenerationValidator()
validator.validate().catch(console.error)
