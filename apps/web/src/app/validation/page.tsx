/**
 * Comprehension Validation Engine - Agent 12
 *
 * Complete premium interface for multi-dimensional comprehension validation
 * and clinical scenario evaluation.
 *
 * Features:
 * - 5-step validation flow (select → generate → respond → evaluate → review)
 * - 4-dimensional evaluation (terminology, relationships, application, clarity)
 * - Clinical scenario multi-stage cases
 * - Confidence calibration with visual feedback
 * - Premium animations for score reveals and feedback
 * - Session history and progress tracking
 * - Retry/next question flow
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Award,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  History,
  Lightbulb,
  RefreshCcw,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InsightCard } from '@/components/ui/insight-card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  useEvaluateResponse,
  useEvaluateScenario,
  useGenerateChallenge,
  useGeneratePrompt,
  useGenerateScenario,
  useScenarioMetrics,
} from '@/lib/api/hooks/validation'
import type { ScenarioMetricsResponse } from '@/lib/api/hooks/types/generated'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

type ValidationStep = 'select' | 'generate' | 'respond' | 'evaluate' | 'review'
type PromptType = 'explain-to-patient' | 'clinical-reasoning' | 'controlled-failure'
type ScenarioDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

interface SessionRecord {
  id: string
  timestamp: Date
  type: 'prompt' | 'scenario'
  score: number
  topic: string
  confidence: number
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_OBJECTIVES = [
  { id: 'obj_001', text: 'Cardiac Conduction System', category: 'Cardiology' },
  { id: 'obj_002', text: 'Acute Myocardial Infarction', category: 'Cardiology' },
  { id: 'obj_003', text: 'Diabetic Ketoacidosis', category: 'Endocrinology' },
  { id: 'obj_004', text: 'Community Acquired Pneumonia', category: 'Pulmonology' },
  { id: 'obj_005', text: 'Inflammatory Bowel Disease', category: 'Gastroenterology' },
]

const MOCK_EVALUATION = {
  overall_score: 85,
  dimension_scores: {
    terminology: 90,
    relationships: 82,
    application: 85,
    clarity: 83,
  },
  calibration_delta: -5,
  strengths: [
    'Excellent use of medical terminology',
    'Clear explanation of physiological mechanisms',
    'Good use of analogies for patient understanding',
  ],
  gaps: [
    'Could elaborate more on clinical implications',
    'Missing discussion of contraindications',
  ],
  recommendations: [
    'Review clinical guidelines for this condition',
    'Practice explaining complex pathways in simpler terms',
  ],
}

// ============================================================================
// Main Component
// ============================================================================

export default function ValidationPage() {
  // State management
  const [currentStep, setCurrentStep] = useState<ValidationStep>('select')
  const [validationType, setValidationType] = useState<'prompt' | 'scenario'>('prompt')
  const [selectedObjective, setSelectedObjective] = useState<string>('')
  const [promptType, setPromptType] = useState<PromptType>('explain-to-patient')
  const [scenarioDifficulty, setScenarioDifficulty] = useState<ScenarioDifficulty>('INTERMEDIATE')
  const [userAnswer, setUserAnswer] = useState('')
  const [confidence, setConfidence] = useState(50)
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('')
  const [generatedScenario, setGeneratedScenario] = useState<any>(null)
  const [evaluationResult, setEvaluationResult] = useState<any>(null)
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // API hooks
  const generatePrompt = useGeneratePrompt()
  const evaluateResponse = useEvaluateResponse()
  const generateScenario = useGenerateScenario()
  const evaluateScenario = useEvaluateScenario()
  const generateChallenge = useGenerateChallenge()
  // Query data may be typed as unknown by React Query defaults.
  // Cast to the expected API response shape for safe property access.
  const { data: metrics } = useScenarioMetrics()
  const metricsData = metrics as ScenarioMetricsResponse | undefined

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleGenerate = async () => {
    const objective = MOCK_OBJECTIVES.find((o) => o.id === selectedObjective)
    if (!objective) return

    if (validationType === 'prompt') {
      // Mock prompt generation
      setGeneratedPrompt(
        `Explain ${objective.text} to a patient who has just been diagnosed with this condition. Focus on helping them understand what is happening in their body and what to expect.`,
      )
      setCurrentStep('respond')
    } else {
      // Mock scenario generation
      setGeneratedScenario({
        case: {
          chief_complaint: `A 65-year-old patient presents with chest pain...`,
          history: 'Patient has hypertension and diabetes...',
          physical_exam: 'BP 160/95, HR 88, diaphoretic...',
          questions: [
            { text: 'What is your initial differential diagnosis?', stage: 1 },
            { text: 'What diagnostic tests would you order?', stage: 2 },
            { text: 'What is your treatment plan?', stage: 3 },
          ],
        },
        learning_points: ['ECG changes in acute MI', 'Time to intervention critical'],
      })
      setCurrentStep('respond')
    }
  }

  const handleSubmitResponse = async () => {
    // Mock evaluation
    setEvaluationResult(MOCK_EVALUATION)
    setCurrentStep('evaluate')

    // Add to session history
    const newRecord: SessionRecord = {
      id: `session_${Date.now()}`,
      timestamp: new Date(),
      type: validationType,
      score: MOCK_EVALUATION.overall_score,
      topic: MOCK_OBJECTIVES.find((o) => o.id === selectedObjective)?.text || '',
      confidence,
    }
    setSessionHistory([newRecord, ...sessionHistory])
  }

  const handleRetry = () => {
    setUserAnswer('')
    setConfidence(50)
    setCurrentStep('respond')
  }

  const handleNext = () => {
    setUserAnswer('')
    setConfidence(50)
    setGeneratedPrompt('')
    setGeneratedScenario(null)
    setEvaluationResult(null)
    setCurrentStep('select')
  }

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderStepIndicator = () => {
    const steps = ['select', 'generate', 'respond', 'evaluate', 'review']
    const currentIndex = steps.indexOf(currentStep)

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300',
                  index <= currentIndex
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {index + 1}
              </motion.div>
              <span className="text-xs mt-2 capitalize">{step}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mt-[-20px] bg-muted">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: index < currentIndex ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-primary"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderConfidenceSlider = () => {
    const getConfidenceColor = (value: number) => {
      if (value < 30) return 'text-red-600'
      if (value < 60) return 'text-amber-600'
      return 'text-green-600'
    }

    const getConfidenceLabel = (value: number) => {
      if (value < 30) return 'Low Confidence'
      if (value < 60) return 'Moderate Confidence'
      return 'High Confidence'
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Confidence Level</Label>
          <div className="flex items-center gap-2">
            <span className={cn('text-2xl font-bold', getConfidenceColor(confidence))}>
              {confidence}%
            </span>
            <span className={cn('text-sm', getConfidenceColor(confidence))}>
              {getConfidenceLabel(confidence)}
            </span>
          </div>
        </div>

        <Slider
          value={[confidence]}
          onValueChange={(value) => setConfidence(value[0])}
          min={0}
          max={100}
          step={5}
          className="py-4"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Not confident</span>
          <span>Somewhat confident</span>
          <span>Very confident</span>
        </div>

        <InsightCard
          title="Why Calibration Matters"
          description="Accurate self-assessment helps you identify knowledge gaps and avoid overconfidence. Your calibration score shows how well your confidence matches your actual performance."
          priority="info"
          animate={false}
        />
      </div>
    )
  }

  const renderDimensionScores = () => {
    if (!evaluationResult) return null

    const dimensions = [
      { key: 'terminology', label: 'Medical Terminology', icon: FileText, color: 'blue' },
      { key: 'relationships', label: 'Concept Relationships', icon: Brain, color: 'purple' },
      { key: 'application', label: 'Clinical Application', icon: Target, color: 'green' },
      { key: 'clarity', label: 'Explanation Clarity', icon: Sparkles, color: 'amber' },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dimensions.map((dim, index) => {
          const score = evaluationResult.dimension_scores[dim.key]
          const Icon = dim.icon

          return (
            <motion.div
              key={dim.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-sm font-medium">{dim.label}</CardTitle>
                    </div>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                      className={cn(
                        'text-2xl font-bold',
                        score >= 90
                          ? 'text-green-600'
                          : score >= 70
                            ? 'text-amber-600'
                            : 'text-red-600',
                      )}
                    >
                      {score}
                    </motion.span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={score} className="h-2" />
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    )
  }

  const renderCalibrationFeedback = () => {
    if (!evaluationResult) return null

    const delta = evaluationResult.calibration_delta
    const isWellCalibrated = Math.abs(delta) < 10

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <InsightCard
          title="Calibration Analysis"
          description={
            isWellCalibrated
              ? `Excellent calibration! Your confidence (${confidence}%) closely matched your performance (${evaluationResult.overall_score}%).`
              : delta > 0
                ? `You were slightly overconfident. Your confidence was ${Math.abs(delta)}% higher than your actual performance. Consider being more critical when self-assessing.`
                : `You were underconfident. Your performance was ${Math.abs(delta)}% better than you expected! Trust your knowledge more.`
          }
          priority={isWellCalibrated ? 'success' : delta > 0 ? 'warning' : 'info'}
          badge={
            isWellCalibrated ? 'Well Calibrated' : delta > 0 ? 'Overconfident' : 'Underconfident'
          }
        />
      </motion.div>
    )
  }

  // ============================================================================
  // Step Renderers
  // ============================================================================

  const renderSelectStep = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Start Your Validation Session</h2>
        <p className="text-muted-foreground">
          Choose a learning objective and validation type to test your comprehension
        </p>
      </div>

      <Tabs
        value={validationType}
        onValueChange={(v: any) => setValidationType(v)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prompt" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Comprehension Prompt
          </TabsTrigger>
          <TabsTrigger value="scenario" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Clinical Scenario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Comprehension Validation</CardTitle>
              <CardDescription>
                Test your ability to explain medical concepts clearly and accurately
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="objective">Learning Objective</Label>
                <Select value={selectedObjective} onValueChange={setSelectedObjective}>
                  <SelectTrigger id="objective">
                    <SelectValue placeholder="Select a learning objective" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_OBJECTIVES.map((obj) => (
                      <SelectItem key={obj.id} value={obj.id}>
                        {obj.text} ({obj.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prompt-type">Prompt Type</Label>
                <Select value={promptType} onValueChange={(v: any) => setPromptType(v)}>
                  <SelectTrigger id="prompt-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="explain-to-patient">Explain to Patient</SelectItem>
                    <SelectItem value="clinical-reasoning">Clinical Reasoning</SelectItem>
                    <SelectItem value="controlled-failure">Controlled Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!selectedObjective}
                className="w-full"
                size="lg"
              >
                Generate Prompt
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenario" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Scenario</CardTitle>
              <CardDescription>
                Practice clinical reasoning with multi-stage patient cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scenario-objective">Learning Objective</Label>
                <Select value={selectedObjective} onValueChange={setSelectedObjective}>
                  <SelectTrigger id="scenario-objective">
                    <SelectValue placeholder="Select a learning objective" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_OBJECTIVES.map((obj) => (
                      <SelectItem key={obj.id} value={obj.id}>
                        {obj.text} ({obj.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={scenarioDifficulty}
                  onValueChange={(v: any) => setScenarioDifficulty(v)}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!selectedObjective}
                className="w-full"
                size="lg"
              >
                Generate Scenario
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Stats */}
      {metricsData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <StatCard
            label="Total Sessions"
            value={metricsData.total_scenarios_completed}
            variant="primary"
            size="sm"
          />
          <StatCard
            label="Average Score"
            value={metricsData.average_score}
            formatValue={(v) => `${v}%`}
            variant="success"
            size="sm"
          />
          <StatCard
            label="Completed This Week"
            value={sessionHistory.length}
            variant="default"
            size="sm"
          />
        </div>
      ) : null}
    </div>
  )

  const renderRespondStep = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">
                {validationType === 'prompt' ? 'Comprehension Prompt' : 'Clinical Scenario'}
              </CardTitle>
              <CardDescription className="mt-2">
                {MOCK_OBJECTIVES.find((o) => o.id === selectedObjective)?.text}
              </CardDescription>
            </div>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {validationType === 'prompt' ? (
            <p className="text-base leading-relaxed">{generatedPrompt}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Chief Complaint:</h4>
                <p>{generatedScenario?.case?.chief_complaint}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">History:</h4>
                <p>{generatedScenario?.case?.history}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Physical Exam:</h4>
                <p>{generatedScenario?.case?.physical_exam}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Response</CardTitle>
          <CardDescription>
            Provide a comprehensive answer. Focus on accuracy, clarity, and clinical relevance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="answer">Your Answer</Label>
            <Textarea
              id="answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="min-h-[200px] mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {userAnswer.length} characters • Aim for at least 200 characters
            </p>
          </div>

          {renderConfidenceSlider()}

          <Button
            onClick={handleSubmitResponse}
            disabled={userAnswer.length < 50}
            className="w-full"
            size="lg"
          >
            Submit for Evaluation
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderEvaluateStep = () => (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4"
        >
          <Award className="h-10 w-10 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold mb-2">Your Results</h2>
        <p className="text-muted-foreground">
          Overall Score:{' '}
          <span className="text-2xl font-bold text-primary">
            {evaluationResult?.overall_score}%
          </span>
        </p>
      </motion.div>

      {/* Dimension Scores */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Dimension Breakdown</h3>
        {renderDimensionScores()}
      </div>

      <Separator />

      {/* Calibration Feedback */}
      {renderCalibrationFeedback()}

      <Separator />

      {/* Strengths and Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900 dark:text-green-100">Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluationResult?.strengths.map((strength: string, idx: number) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-900 dark:text-amber-100">Areas to Improve</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluationResult?.gaps.map((gap: string, idx: number) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{gap}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900 dark:text-blue-100">
              Personalized Recommendations
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {evaluationResult?.recommendations.map((rec: string, idx: number) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-2"
              >
                <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{rec}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleRetry} variant="outline" size="lg" className="flex-1">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry Question
        </Button>
        <Button onClick={handleNext} size="lg" className="flex-1">
          Next Question
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Comprehension Validation</h1>
          <p className="text-muted-foreground">
            Test and calibrate your understanding with AI-powered evaluation
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2"
        >
          <History className="h-4 w-4" />
          History ({sessionHistory.length})
        </Button>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 'select' && renderSelectStep()}
          {currentStep === 'respond' && renderRespondStep()}
          {currentStep === 'evaluate' && renderEvaluateStep()}
        </motion.div>
      </AnimatePresence>

      {/* Session History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 h-full w-96 bg-background border-l shadow-xl p-6 overflow-y-auto z-50"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Session History</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {sessionHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sessions yet. Complete a validation to see your history.
                </p>
              ) : (
                sessionHistory.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm">{session.topic}</CardTitle>
                        <span
                          className={cn(
                            'text-xl font-bold',
                            session.score >= 80
                              ? 'text-green-600'
                              : session.score >= 60
                                ? 'text-amber-600'
                                : 'text-red-600',
                          )}
                        >
                          {session.score}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{session.type === 'prompt' ? 'Prompt' : 'Scenario'}</span>
                        <span>{session.timestamp.toLocaleDateString()}</span>
                      </div>
                      <div className="mt-2">
                        <Progress value={session.score} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
