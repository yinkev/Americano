/**
 * Story 5.2: Predictive Analytics for Learning Struggles
 * ML Prediction Model
 *
 * Implements two prediction strategies:
 * 1. Rule-based model (MVP) - Explicit thresholds based on domain knowledge
 * 2. Logistic regression (Post-MVP) - Learned from historical data
 *
 * Model targets: >75% accuracy, >70% recall (prioritize catching struggles)
 */

import { FeatureVector } from './struggle-feature-extractor'

/**
 * Prediction result with probability and confidence
 */
export interface PredictionResult {
  probability: number // 0.0-1.0: Likelihood of struggle
  confidence: number // 0.0-1.0: Model confidence in this prediction
  reasoning: {
    topFeatures: Array<{
      // Features contributing most to prediction
      name: string
      contribution: number // How much this feature contributed to probability
    }>
    riskFactors: string[] // Human-readable risk factors
    protectiveFactors: string[] // Human-readable protective factors
  }
}

/**
 * Training example for supervised learning
 */
export interface TrainingExample {
  features: FeatureVector
  label: number // 1 = struggled, 0 = didn't struggle
  weight?: number // Optional sample weight (default 1.0)
  timestamp?: Date // When this example was collected
}

/**
 * Model performance metrics
 */
export interface ModelMetrics {
  accuracy: number // Correct predictions / total predictions
  precision: number // True positives / (TP + FP)
  recall: number // True positives / (TP + FN)
  f1Score: number // Harmonic mean of precision and recall
  calibration: number // Predicted probability vs actual rate alignment (±10%)
}

/**
 * Extended performance metrics for monitoring
 */
export interface PerformanceMetrics {
  current: ModelMetrics
  baseline: ModelMetrics | null
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING'
  lastUpdated: Date
  dataPoints: number
  featureImportance: { [key: string]: number }
}

/**
 * Model weights for logistic regression
 */
export interface ModelWeights {
  bias: number
  weights: number[] // One per feature in FeatureVector
  featureNames: string[]
}

/**
 * Model update metrics
 */
export interface UpdateMetrics {
  previousAccuracy: number
  newAccuracy: number
  improvement: number
  trainingExamples: number
  updatedAt: Date
}

export class StrugglePredictionModel {
  private modelType: 'RULE_BASED' | 'LOGISTIC_REGRESSION' = 'RULE_BASED'
  private modelWeights: ModelWeights | null = null
  private useLogisticRegression: boolean = false
  private trainingHistory: TrainingExample[] = []

  constructor(useLogisticRegression: boolean = false) {
    this.useLogisticRegression = useLogisticRegression
    this.modelType = useLogisticRegression ? 'LOGISTIC_REGRESSION' : 'RULE_BASED'
  }

  /**
   * Predict struggle probability for a given feature vector
   */
  predict(featureVector: FeatureVector, dataQuality: number = 1.0): PredictionResult {
    if (this.useLogisticRegression && this.modelWeights) {
      return this.predictLogisticRegression(featureVector, dataQuality)
    } else {
      return this.predictRuleBased(featureVector, dataQuality)
    }
  }

  /**
   * Rule-based prediction (MVP)
   * Uses explicit thresholds based on domain knowledge
   */
  private predictRuleBased(featureVector: FeatureVector, dataQuality: number): PredictionResult {
    const features = featureVector
    let probability = 0.0
    const contributions: Array<{ name: string; contribution: number }> = []
    const riskFactors: string[] = []
    const protectiveFactors: string[] = []

    // HIGH struggle probability (>0.7) if:
    // - Retention score <50%
    if (features.retentionScore < 0.5) {
      const contribution = (0.5 - features.retentionScore) * 0.4 // Up to 0.2
      probability += contribution
      contributions.push({ name: 'retentionScore', contribution })
      riskFactors.push(`Low retention score (${(features.retentionScore * 100).toFixed(0)}%)`)
    }

    // - 2+ prerequisite objectives with low mastery
    if (features.prerequisiteGapCount > 0.5) {
      const contribution = features.prerequisiteGapCount * 0.35 // Up to 0.35
      probability += contribution
      contributions.push({ name: 'prerequisiteGapCount', contribution })
      riskFactors.push(
        `Missing ${(features.prerequisiteGapCount * 100).toFixed(0)}% of prerequisites`,
      )
    }

    // - Complexity mismatch score >0.6
    if (features.complexityMismatch > 0.6) {
      const contribution = (features.complexityMismatch - 0.6) * 0.5 // Up to 0.2
      probability += contribution
      contributions.push({ name: 'complexityMismatch', contribution })
      riskFactors.push(`Content complexity exceeds current ability level`)
    }

    // - Historical struggle in similar topics (>0.7)
    if (features.historicalStruggleScore > 0.7) {
      const contribution = (features.historicalStruggleScore - 0.7) * 0.4 // Up to 0.12
      probability += contribution
      contributions.push({ name: 'historicalStruggleScore', contribution })
      riskFactors.push(`History of struggles in similar topics`)
    }

    // MEDIUM risk factors
    if (features.prerequisiteGapCount > 0.2 && features.prerequisiteGapCount <= 0.5) {
      const contribution = features.prerequisiteGapCount * 0.15
      probability += contribution
      contributions.push({ name: 'prerequisiteGapCount', contribution })
      riskFactors.push(`Some prerequisite gaps detected`)
    }

    if (features.contentTypeMismatch > 0.5) {
      const contribution = (features.contentTypeMismatch - 0.5) * 0.2 // Up to 0.1
      probability += contribution
      contributions.push({ name: 'contentTypeMismatch', contribution })
      riskFactors.push(`Content format may not match learning style`)
    }

    if (features.reviewLapseRate > 0.4) {
      const contribution = features.reviewLapseRate * 0.15
      probability += contribution
      contributions.push({ name: 'reviewLapseRate', contribution })
      riskFactors.push(
        `High rate of review failures (${(features.reviewLapseRate * 100).toFixed(0)}%)`,
      )
    }

    if (features.cognitiveLoadIndicator > 0.7) {
      const contribution = (features.cognitiveLoadIndicator - 0.7) * 0.3 // Up to 0.09
      probability += contribution
      contributions.push({ name: 'cognitiveLoadIndicator', contribution })
      riskFactors.push(`High cognitive load detected`)
    }

    // Baseline probability from weighted formula (if no critical factors)
    if (probability < 0.4) {
      const baselineProbability = this.calculateBaselineProbability(features)
      probability = Math.max(probability, baselineProbability)
    }

    // Cap probability at 1.0
    probability = Math.min(1.0, probability)

    // Identify protective factors
    if (features.retentionScore > 0.7) {
      protectiveFactors.push(
        `Strong retention score (${(features.retentionScore * 100).toFixed(0)}%)`,
      )
    }
    if (features.prerequisiteGapCount < 0.2) {
      protectiveFactors.push(`Solid prerequisite knowledge foundation`)
    }
    if (features.sessionPerformanceScore > 0.7) {
      protectiveFactors.push(`Recent study sessions performing well`)
    }
    if (features.validationScore > 0.7) {
      protectiveFactors.push(`High validation prompt scores`)
    }
    if (features.daysUntilExam > 0.5) {
      protectiveFactors.push(`Adequate time to prepare before exam`)
    }

    // Confidence based on data sufficiency
    const confidence = dataQuality * 0.5 + 0.5 // Min 0.5, max 1.0

    // Sort contributions by magnitude
    const topFeatures = contributions.sort((a, b) => b.contribution - a.contribution).slice(0, 5)

    return {
      probability,
      confidence,
      reasoning: {
        topFeatures,
        riskFactors,
        protectiveFactors,
      },
    }
  }

  /**
   * Calculate baseline probability from weighted formula
   * Used when no critical risk factors present
   */
  private calculateBaselineProbability(features: FeatureVector): number {
    // Weighted formula (all features normalized 0-1)
    const weights = {
      retentionScore: -0.25, // Negative weight (higher retention = lower struggle)
      retentionDeclineRate: 0.15,
      reviewLapseRate: 0.12,
      sessionPerformanceScore: -0.1, // Negative weight
      validationScore: -0.08, // Negative weight
      prerequisiteGapCount: 0.2,
      prerequisiteMasteryGap: 0.15,
      contentComplexity: 0.08,
      complexityMismatch: 0.18,
      historicalStruggleScore: 0.2,
      contentTypeMismatch: 0.1,
      cognitiveLoadIndicator: 0.12,
      daysUntilExam: -0.05, // Negative weight (more time = lower struggle)
      daysSinceLastStudy: 0.08,
      workloadLevel: 0.06,
    }

    let probability = 0.3 // Base probability

    Object.entries(weights).forEach(([key, weight]) => {
      const featureValue = features[key as keyof FeatureVector]
      if (typeof featureValue === 'number') {
        probability += weight * featureValue
      }
    })

    // Ensure probability is in [0, 1]
    return Math.max(0, Math.min(1, probability))
  }

  /**
   * Logistic regression prediction (Post-MVP)
   * Uses learned weights from training data
   */
  private predictLogisticRegression(
    featureVector: FeatureVector,
    dataQuality: number,
  ): PredictionResult {
    if (!this.modelWeights) {
      throw new Error('Model not trained. Call train() first.')
    }

    // Convert feature vector to array
    const x = this.featureVectorToArray(featureVector)

    // Add bias term
    const xWithBias = [1, ...x]

    // Calculate z = bias + w1*x1 + w2*x2 + ... + wn*xn
    const weights = [this.modelWeights.bias, ...this.modelWeights.weights]
    const z = xWithBias.reduce((sum, xi, i) => sum + weights[i] * xi, 0)

    // Sigmoid: P(struggle) = 1 / (1 + e^-z)
    const probability = 1 / (1 + Math.exp(-z))

    // Calculate feature contributions
    const contributions = this.modelWeights.featureNames.map((name, i) => ({
      name,
      contribution: Math.abs(this.modelWeights!.weights[i] * x[i]),
    }))

    const topFeatures = contributions.sort((a, b) => b.contribution - a.contribution).slice(0, 5)

    // Generate reasoning with risk/protective factors
    const reasoning = this.generateLogisticReasoning(featureVector, probability, topFeatures)

    return {
      probability,
      confidence: dataQuality,
      reasoning,
    }
  }

  /**
   * Generate reasoning for logistic regression predictions
   */
  private generateLogisticReasoning(
    features: FeatureVector,
    probability: number,
    topFeatures: Array<{ name: string; contribution: number }>,
  ): {
    topFeatures: Array<{ name: string; contribution: number }>
    riskFactors: string[]
    protectiveFactors: string[]
  } {
    const riskFactors: string[] = []
    const protectiveFactors: string[] = []

    // Identify risk factors based on feature values
    if (features.retentionScore < 0.5) {
      riskFactors.push(`Low retention score (${(features.retentionScore * 100).toFixed(0)}%)`)
    }
    if (features.prerequisiteGapCount > 0.5) {
      riskFactors.push(
        `Missing ${(features.prerequisiteGapCount * 100).toFixed(0)}% of prerequisites`,
      )
    }
    if (features.complexityMismatch > 0.6) {
      riskFactors.push(`Content complexity exceeds current ability level`)
    }
    if (features.historicalStruggleScore > 0.7) {
      riskFactors.push(`History of struggles in similar topics`)
    }

    // Identify protective factors
    if (features.retentionScore > 0.7) {
      protectiveFactors.push(
        `Strong retention score (${(features.retentionScore * 100).toFixed(0)}%)`,
      )
    }
    if (features.prerequisiteGapCount < 0.2) {
      protectiveFactors.push(`Solid prerequisite knowledge foundation`)
    }
    if (features.sessionPerformanceScore > 0.7) {
      protectiveFactors.push(`Recent study sessions performing well`)
    }

    return {
      topFeatures,
      riskFactors,
      protectiveFactors,
    }
  }

  /**
   * Train logistic regression model on historical data
   */
  async train(trainingData: TrainingExample[]): Promise<ModelMetrics> {
    if (trainingData.length < 50) {
      throw new Error('Insufficient training data. Need at least 50 examples.')
    }

    this.trainingHistory = trainingData
    this.useLogisticRegression = true

    // Split data: 80% training, 20% testing
    const splitIndex = Math.floor(trainingData.length * 0.8)
    const trainSet = trainingData.slice(0, splitIndex)
    const testSet = trainingData.slice(splitIndex)

    // Initialize weights
    const featureNames = Object.keys(trainingData[0].features).filter((k) => k !== 'metadata')
    let weights = Array(featureNames.length).fill(0)
    let bias = 0

    const learningRate = 0.01
    const epochs = 1000
    const l2Lambda = 0.01 // L2 regularization

    // Gradient descent training
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const example of trainSet) {
        const x = this.featureVectorToArray(example.features)
        const y = example.label
        const weight = example.weight || 1.0

        // Forward pass: z = bias + w·x
        const z = bias + weights.reduce((sum, wi, i) => sum + wi * x[i], 0)
        const prediction = 1 / (1 + Math.exp(-z)) // Sigmoid

        // Backward pass: gradient descent with L2 regularization
        const error = (prediction - y) * weight

        // Update weights
        for (let i = 0; i < weights.length; i++) {
          const gradient = error * x[i] + l2Lambda * weights[i] // L2 penalty
          weights[i] -= learningRate * gradient
        }

        // Update bias
        bias -= learningRate * error
      }
    }

    // Save trained model
    this.modelWeights = {
      bias,
      weights,
      featureNames,
    }

    // Evaluate on test set
    const performance = await this.evaluate(testSet)

    return performance
  }

  /**
   * Update model with new feedback data (incremental learning)
   */
  async updateModel(newData: TrainingExample[]): Promise<UpdateMetrics> {
    const previousPerformance = await this.getModelPerformance()
    const previousF1 = previousPerformance?.current.f1Score || 0

    // Combine new data with training history
    this.trainingHistory.push(...newData)

    // Retrain model
    const newPerformance = await this.train(this.trainingHistory)

    return {
      previousAccuracy: previousF1,
      newAccuracy: newPerformance.f1Score,
      improvement: newPerformance.f1Score - previousF1,
      trainingExamples: this.trainingHistory.length,
      updatedAt: new Date(),
    }
  }

  /**
   * Get current model performance metrics
   */
  async getModelPerformance(): Promise<PerformanceMetrics> {
    let currentMetrics: ModelMetrics

    if (this.trainingHistory.length < 20) {
      // Not enough data to evaluate properly
      currentMetrics = {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        calibration: 0,
      }
    } else {
      // Use last 20% of training history as test set
      const testSize = Math.floor(this.trainingHistory.length * 0.2)
      const testSet = this.trainingHistory.slice(-testSize)
      currentMetrics = await this.evaluate(testSet)
    }

    // Calculate feature importance
    const featureImportance = this.calculateFeatureImportance()

    // Determine trend
    const trend: 'IMPROVING' | 'STABLE' | 'DEGRADING' =
      currentMetrics.f1Score >= 0.75
        ? 'IMPROVING'
        : currentMetrics.f1Score >= 0.65
          ? 'STABLE'
          : 'DEGRADING'

    return {
      current: currentMetrics,
      baseline: null, // Set in production with initial baseline
      trend,
      lastUpdated: new Date(),
      dataPoints: this.trainingHistory.length,
      featureImportance,
    }
  }

  /**
   * Calculate feature importance scores
   */
  private calculateFeatureImportance(): { [key: string]: number } {
    if (this.modelType === 'LOGISTIC_REGRESSION' && this.modelWeights) {
      // Use learned coefficients (absolute values)
      const importance: { [key: string]: number } = {}
      this.modelWeights.featureNames.forEach((name, i) => {
        importance[name] = Math.abs(this.modelWeights!.weights[i])
      })

      // Normalize to sum to 1
      const total = Object.values(importance).reduce((sum, val) => sum + val, 0)
      if (total > 0) {
        Object.keys(importance).forEach((key) => {
          importance[key] /= total
        })
      }

      return importance
    } else {
      // Use predefined weights for rule-based model
      return {
        retentionScore: 0.25,
        prerequisiteGapCount: 0.2,
        complexityMismatch: 0.15,
        historicalStruggleScore: 0.15,
        reviewLapseRate: 0.08,
        cognitiveLoadIndicator: 0.07,
        contentTypeMismatch: 0.05,
        prerequisiteMasteryGap: 0.03,
        retentionDeclineRate: 0.02,
      }
    }
  }

  /**
   * Evaluate model on test data
   */
  private async evaluate(testData: TrainingExample[]): Promise<ModelMetrics> {
    let truePositives = 0
    let falsePositives = 0
    let trueNegatives = 0
    let falseNegatives = 0

    const predictions: Array<{ predicted: number; actual: number }> = []

    for (const example of testData) {
      const dataQuality = example.features.metadata?.dataQuality || 1.0
      const result = await this.predict(example.features, dataQuality)
      const predicted = result.probability > 0.5 ? 1 : 0
      const actual = example.label

      predictions.push({ predicted: result.probability, actual })

      if (predicted === 1 && actual === 1) truePositives++
      else if (predicted === 1 && actual === 0) falsePositives++
      else if (predicted === 0 && actual === 0) trueNegatives++
      else if (predicted === 0 && actual === 1) falseNegatives++
    }

    // Calculate metrics
    const accuracy = (truePositives + trueNegatives) / testData.length
    const precision =
      truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0
    const recall =
      truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

    // Calculate calibration (average absolute error between predicted and actual)
    let calibrationError = 0
    predictions.forEach((p) => {
      calibrationError += Math.abs(p.predicted - p.actual)
    })
    const calibration = 1 - calibrationError / predictions.length // Convert to score (1 = perfect)

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      calibration,
    }
  }

  /**
   * Convert FeatureVector object to array for linear algebra
   */
  private featureVectorToArray(features: FeatureVector): number[] {
    return [
      features.retentionScore,
      features.retentionDeclineRate,
      features.reviewLapseRate,
      features.sessionPerformanceScore,
      features.validationScore,
      features.prerequisiteGapCount,
      features.prerequisiteMasteryGap,
      features.contentComplexity,
      features.complexityMismatch,
      features.historicalStruggleScore,
      features.contentTypeMismatch,
      features.cognitiveLoadIndicator,
      features.daysUntilExam,
      features.daysSinceLastStudy,
      features.workloadLevel,
    ]
  }
}
