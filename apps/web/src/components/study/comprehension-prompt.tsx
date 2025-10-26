'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  springSubtle,
  springSmooth,
  springBouncy,
  listContainerVariants,
  listItemVariants,
  modalContentVariants
} from '@/lib/design-system'

interface ComprehensionPromptProps {
  prompt: {
    id: string
    question: string
    concept: string
    expectedElements: string[]
  }
  onSubmit: (answer: string, confidence: number) => Promise<EvaluationResult>
  onContinue: () => void
}

interface EvaluationResult {
  overall_score: number
  terminology_score: number
  relationships_score: number
  application_score: number
  clarity_score: number
  strengths: string[]
  gaps: string[]
  calibration_delta: number
  calibration_note: string
}

const CONFIDENCE_LABELS = {
  1: 'Very Uncertain',
  2: 'Somewhat Uncertain',
  3: 'Neutral',
  4: 'Confident',
  5: 'Very Confident'
}

export function ComprehensionPrompt({ prompt, onSubmit, onContinue }: ComprehensionPromptProps) {
  const [answer, setAnswer] = useState('')
  const [confidence, setConfidence] = useState(3)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleSubmit = async () => {
    if (answer.trim().length < 20) {
      alert('Please provide a more detailed answer (at least 20 characters)')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await onSubmit(answer, confidence)
      setEvaluation(result)
      setShowResults(true)
    } catch (error) {
      console.error('Failed to submit answer:', error)
      alert('Failed to evaluate answer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 60) return 'text-blue-600 dark:text-blue-400'
    if (score >= 40) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 dark:bg-card'
    if (score >= 60) return 'bg-blue-100 dark:bg-card'
    if (score >= 40) return 'bg-amber-100 dark:bg-card'
    return 'bg-red-100 dark:bg-card'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {!showResults ? (
          // Input Phase
          <motion.div
            key="input"
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            {/* Header */}
            <Card className="p-6 bg-card border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2">
                    {prompt.concept}
                  </Badge>
                  <h3 className="text-2xl font-bold mb-2">Comprehension Check</h3>
                  <p className="text-lg text-muted-foreground">
                    {prompt.question}
                  </p>
                </div>
              </div>
            </Card>

            {/* Answer Input */}
            <Card className="p-6">
              <Label className="text-lg font-semibold mb-3 block">
                Your Explanation
              </Label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Explain the concept in your own words. Include key terminology, relationships, and real-world applications..."
                className="min-h-[200px] text-base resize-none"
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  {answer.length} characters (minimum 20)
                </p>
                {answer.length >= 20 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springBouncy}
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </motion.div>
                )}
              </div>
            </Card>

            {/* Confidence Slider */}
            <Card className="p-6">
              <Label className="text-lg font-semibold mb-4 block">
                How confident are you in your answer?
              </Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {CONFIDENCE_LABELS[confidence as keyof typeof CONFIDENCE_LABELS]}
                  </span>
                  <span className="text-2xl font-bold">
                    {confidence}/5
                  </span>
                </div>
                <Slider
                  value={[confidence]}
                  onValueChange={([val]) => setConfidence(val)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Very Uncertain</span>
                  <span>Very Confident</span>
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || answer.trim().length < 20}
              className="w-full py-6 text-lg font-semibold gap-3 shadow-none"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Evaluating your answer...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Answer
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          // Results Phase
          <motion.div
            key="results"
            variants={listContainerVariants}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            {/* Overall Score Header */}
            <motion.div variants={listItemVariants}>
              <Card className={`
                p-8 text-center
                bg-card ${getScoreBgColor(evaluation!.overall_score)}
                border-2
              `}>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Sparkles className={`w-8 h-8 ${getScoreColor(evaluation!.overall_score)}`} />
                  <h3 className="text-2xl font-bold">Overall Score</h3>
                </div>
                <p className={`text-6xl font-bold ${getScoreColor(evaluation!.overall_score)}`}>
                  {evaluation!.overall_score}
                  <span className="text-3xl">/100</span>
                </p>
              </Card>
            </motion.div>

            {/* Score Breakdown */}
            <motion.div variants={listItemVariants}>
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Score Breakdown</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Terminology (20%)', score: evaluation!.terminology_score },
                    { label: 'Relationships (30%)', score: evaluation!.relationships_score },
                    { label: 'Application (30%)', score: evaluation!.application_score },
                    { label: 'Clarity (20%)', score: evaluation!.clarity_score },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springSubtle, delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className={`text-lg font-bold ${getScoreColor(item.score)}`}>
                          {item.score}/100
                        </span>
                      </div>
                      <Progress value={item.score} className="h-2" />
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Strengths */}
            <motion.div variants={listItemVariants}>
              <Card className="p-6 border-emerald-200 dark:border-emerald-800 bg-card dark:bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-lg font-semibold">Strengths</h4>
                </div>
                <ul className="space-y-2">
                  {evaluation!.strengths.map((strength, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springSubtle, delay: index * 0.1 }}
                    >
                      <span className="text-emerald-600 dark:text-emerald-400 mt-1">•</span>
                      <span>{strength}</span>
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Gaps */}
            <motion.div variants={listItemVariants}>
              <Card className="p-6 border-amber-200 dark:border-amber-800 bg-card dark:bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-lg font-semibold">Areas to Improve</h4>
                </div>
                <ul className="space-y-2">
                  {evaluation!.gaps.map((gap, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springSubtle, delay: index * 0.1 }}
                    >
                      <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                      <span>{gap}</span>
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Calibration Feedback */}
            <motion.div variants={listItemVariants}>
              <Card className="p-6 bg-card  /50 dark:/20 dark:/10 border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-card flex items-center justify-center flex-shrink-0">
                    {evaluation!.calibration_delta > 15 ? (
                      <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    ) : evaluation!.calibration_delta < -15 ? (
                      <TrendingDown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold mb-2">Calibration Feedback</h4>
                    <p className="text-base text-muted-foreground mb-3">
                      {evaluation!.calibration_note}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Your confidence:</span>
                      <Badge variant="outline">{confidence}/5</Badge>
                      <span className="text-muted-foreground">vs Performance:</span>
                      <Badge variant="outline">{evaluation!.overall_score}/100</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Continue Button */}
            <motion.div variants={listItemVariants}>
              <Button
                onClick={onContinue}
                className="w-full py-6 text-lg font-semibold gap-3 shadow-none"
                size="lg"
              >
                Continue Learning
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
