/**
 * A/B Testing Framework - Example Usage
 *
 * Story 5.5, Task 10: A/B Testing Framework
 *
 * Demonstrates how to use the A/B testing framework for personalization experiments
 */

import { ABTestingFramework } from './ab-testing-framework'
import type { ExperimentConfig } from './ab-testing-framework'

// ============================================================================
// Example 1: Create and Run Experiment
// ============================================================================

async function runPersonalizationExperiment() {
  const framework = new ABTestingFramework()

  // Step 1: Create experiment
  const config: ExperimentConfig = {
    name: 'Pattern vs Prediction Personalization',
    description: 'Compare pattern-heavy vs prediction-heavy personalization strategies',
    variantA: {
      strategy: 'pattern_heavy',
      patternWeight: 0.7,
      predictionWeight: 0.3,
      adaptationSpeed: 'gradual',
    },
    variantB: {
      strategy: 'prediction_heavy',
      patternWeight: 0.3,
      predictionWeight: 0.7,
      adaptationSpeed: 'aggressive',
    },
    successMetric: 'retention',
    targetUserCount: 40, // 20 per variant
    durationWeeks: 2,
  }

  const experimentId = await framework.createExperiment(config)
  console.log(`Experiment created: ${experimentId}`)

  // Step 2: Assign users to variants
  const users = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5']

  for (const userId of users) {
    const variant = await framework.assignUserToVariant(userId, experimentId)
    console.log(`${userId} assigned to Variant ${variant}`)

    // Apply variant config to personalization
    const variantConfig = variant === 'A' ? config.variantA : config.variantB
    await applyPersonalizationConfig(userId, variantConfig)
  }

  // Step 3: Record metrics (after 2 weeks of sessions)
  await framework.recordMetrics('user-1', experimentId, {
    retention: 0.85,
    performance: 0.78,
    completionRate: 0.92,
    satisfaction: 4.5,
  })

  await framework.recordMetrics('user-2', experimentId, {
    retention: 0.82,
    performance: 0.75,
    completionRate: 0.88,
    satisfaction: 4.2,
  })

  // ... record for all users

  // Step 4: Analyze experiment
  const analysis = await framework.analyzeExperiment(experimentId)

  console.log('\n=== Experiment Analysis ===')
  console.log(`Status: ${analysis.status}`)
  console.log(`Days Elapsed: ${analysis.daysElapsed}`)
  console.log(`\nVariant A (n=${analysis.variantA.userCount}):`)
  console.log(`  Mean: ${analysis.variantA.mean.toFixed(3)}`)
  console.log(`  Std Dev: ${analysis.variantA.stdDev.toFixed(3)}`)
  console.log(`\nVariant B (n=${analysis.variantB.userCount}):`)
  console.log(`  Mean: ${analysis.variantB.mean.toFixed(3)}`)
  console.log(`  Std Dev: ${analysis.variantB.stdDev.toFixed(3)}`)

  if (analysis.statistical) {
    console.log(`\n=== Statistical Analysis ===`)
    console.log(`T-statistic: ${analysis.statistical.tStatistic.toFixed(3)}`)
    console.log(`P-value: ${analysis.statistical.pValue.toFixed(4)}`)
    console.log(`Significant: ${analysis.statistical.isSignificant}`)
    console.log(`Winner: ${analysis.statistical.winner}`)
    console.log(`Effect Size (Cohen's d): ${analysis.statistical.effectSize.toFixed(3)}`)
    console.log(
      `95% CI: [${analysis.statistical.confidenceInterval.lower.toFixed(3)}, ${analysis.statistical.confidenceInterval.upper.toFixed(3)}]`,
    )
    console.log(`\nRecommendation: ${analysis.statistical.recommendation}`)
  }

  // Step 5: Conclude experiment (if requirements met)
  if (analysis.meetsRequirements.canConclude) {
    const finalAnalysis = await framework.concludeExperiment(experimentId)

    if (finalAnalysis.statistical?.isSignificant) {
      const winner = finalAnalysis.statistical.winner
      console.log(`\n✅ Rolling out Variant ${winner} to all users`)

      // Deploy winning variant
      const winningConfig = winner === 'A' ? config.variantA : config.variantB
      await deployPersonalizationStrategy(winningConfig)
    } else {
      console.log(`\n⚠️ No significant difference. Keeping current strategy.`)
    }
  } else {
    console.log(`\n⏳ Experiment still running. Requirements:`)
    console.log(`  Min Users: ${analysis.meetsRequirements.minUsers ? '✅' : '❌'}`)
    console.log(`  Min Duration: ${analysis.meetsRequirements.minDuration ? '✅' : '❌'}`)
  }
}

// ============================================================================
// Example 2: Ongoing Experiment Monitoring
// ============================================================================

async function monitorActiveExperiments(userId: string) {
  const framework = new ABTestingFramework()

  // Get user's active experiments
  const experiments = await framework.getActiveExperiments(userId)

  console.log(`\n=== Active Experiments for ${userId} ===`)
  for (const exp of experiments) {
    console.log(`\nExperiment: ${exp.experimentName}`)
    console.log(`Variant: ${exp.variant}`)
    console.log(`Config:`, exp.variantConfig)

    // Apply experiment variant config
    await applyPersonalizationConfig(userId, exp.variantConfig)
  }
}

// ============================================================================
// Example 3: Multiple Experiments
// ============================================================================

async function runMultipleExperiments() {
  const framework = new ABTestingFramework()

  // Experiment 1: Session Duration
  const exp1 = await framework.createExperiment({
    name: 'Session Duration: 30min vs 45min',
    description: 'Test optimal session duration',
    variantA: { sessionDuration: 30 },
    variantB: { sessionDuration: 45 },
    successMetric: 'completion_rate',
  })

  // Experiment 2: Break Timing
  const exp2 = await framework.createExperiment({
    name: 'Break Timing: Fixed vs Adaptive',
    description: 'Test fixed vs adaptive break timing',
    variantA: { breakStrategy: 'fixed', breakInterval: 25 },
    variantB: { breakStrategy: 'adaptive', attentionBased: true },
    successMetric: 'performance',
  })

  // Experiment 3: Content Mix
  const exp3 = await framework.createExperiment({
    name: 'Content Mix: Balanced vs Learning-Style',
    description: 'Test balanced vs learning-style-optimized content',
    variantA: { contentMix: 'balanced' },
    variantB: { contentMix: 'learning_style_optimized' },
    successMetric: 'retention',
  })

  console.log('Running 3 experiments concurrently...')
  console.log(`Experiment 1: ${exp1}`)
  console.log(`Experiment 2: ${exp2}`)
  console.log(`Experiment 3: ${exp3}`)
}

// ============================================================================
// Example 4: Real-world Integration with Personalization Engine
// ============================================================================

async function personalizeWithExperiments(userId: string, context: 'mission' | 'content') {
  const framework = new ABTestingFramework()

  // Check for active experiments
  const experiments = await framework.getActiveExperiments(userId)

  if (experiments.length > 0) {
    // User is in experiment - use experiment variant
    const experiment = experiments[0]
    console.log(`Using experiment variant: ${experiment.variant}`)
    return experiment.variantConfig
  } else {
    // No experiments - use standard personalization
    console.log('Using standard personalization')
    return await getStandardPersonalization(userId, context)
  }
}

// ============================================================================
// Example 5: Post-Session Metrics Recording
// ============================================================================

async function recordSessionMetrics(
  userId: string,
  sessionId: string,
  retention: number,
  performance: number,
  completionRate: number,
) {
  const framework = new ABTestingFramework()

  // Get active experiments
  const experiments = await framework.getActiveExperiments(userId)

  // Record metrics for all active experiments
  for (const exp of experiments) {
    await framework.recordMetrics(userId, exp.experimentId, {
      retention,
      performance,
      completionRate,
    })

    console.log(`Metrics recorded for ${exp.experimentName}`)
  }
}

// ============================================================================
// Helper Functions (placeholder implementations)
// ============================================================================

async function applyPersonalizationConfig(userId: string, config: any): Promise<void> {
  console.log(`Applying config for ${userId}:`, config)
  // Implementation: Update PersonalizationConfig in database
}

async function deployPersonalizationStrategy(config: any): Promise<void> {
  console.log('Deploying strategy to all users:', config)
  // Implementation: Update global PersonalizationConfig
}

async function getStandardPersonalization(userId: string, context: string): Promise<any> {
  console.log(`Getting standard personalization for ${userId} in ${context}`)
  // Implementation: Standard PersonalizationEngine logic
  return {}
}

// ============================================================================
// Run Examples
// ============================================================================

// Example usage:
// await runPersonalizationExperiment();
// await monitorActiveExperiments('user-123');
// await runMultipleExperiments();
// await personalizeWithExperiments('user-123', 'mission');
// await recordSessionMetrics('user-123', 'session-456', 0.85, 0.78, 0.92);

export {
  runPersonalizationExperiment,
  monitorActiveExperiments,
  runMultipleExperiments,
  personalizeWithExperiments,
  recordSessionMetrics,
}
