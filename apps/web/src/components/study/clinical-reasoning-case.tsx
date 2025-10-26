'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Stethoscope,
  User,
  ClipboardList,
  ArrowRight,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  springSubtle,
  springSmooth,
  springBouncy,
  listContainerVariants,
  listItemVariants,
  modalContentVariants
} from '@/lib/design-system'

interface ClinicalCase {
  id: string
  title: string
  patientInfo: {
    age: number
    gender: string
    chiefComplaint: string
  }
  presentation: string
  physicalExam?: string
  labs?: string
  imaging?: string
  expectedDifferential: string[]
  expectedWorkup: string[]
}

interface ClinicalReasoningCaseProps {
  case: ClinicalCase
  onSubmit: (response: {
    differential: string
    workup: string
    reasoning: string
  }) => Promise<CaseEvaluation>
  onContinue: () => void
}

interface CaseEvaluation {
  differential_score: number
  workup_score: number
  reasoning_score: number
  overall_score: number
  correct_diagnoses: string[]
  missed_diagnoses: string[]
  appropriate_tests: string[]
  unnecessary_tests: string[]
  feedback: string
  teaching_points: string[]
}

type Step = 'case' | 'response' | 'evaluation'

export function ClinicalReasoningCase({ case: clinicalCase, onSubmit, onContinue }: ClinicalReasoningCaseProps) {
  const [currentStep, setCurrentStep] = useState<Step>('case')
  const [differential, setDifferential] = useState('')
  const [workup, setWorkup] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evaluation, setEvaluation] = useState<CaseEvaluation | null>(null)

  const handleSubmit = async () => {
    if (!differential.trim() || !workup.trim() || !reasoning.trim()) {
      alert('Please complete all fields before submitting')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await onSubmit({ differential, workup, reasoning })
      setEvaluation(result)
      setCurrentStep('evaluation')
    } catch (error) {
      console.error('Failed to evaluate case:', error)
      alert('Failed to evaluate your response. Please try again.')
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
    <div className="max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        {currentStep === 'case' && (
          // Case Presentation Step
          <motion.div
            key="case"
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Case Details - Left Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Header */}
                <Card className="p-6 bg-card border-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">Clinical Case</Badge>
                      <h2 className="text-2xl font-bold mb-1">{clinicalCase.title}</h2>
                    </div>
                  </div>
                </Card>

                {/* Patient Info */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold">Patient Information</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Age</p>
                      <p className="font-semibold">{clinicalCase.patientInfo.age} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Gender</p>
                      <p className="font-semibold capitalize">{clinicalCase.patientInfo.gender}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm text-muted-foreground mb-1">Chief Complaint</p>
                      <p className="font-semibold">{clinicalCase.patientInfo.chiefComplaint}</p>
                    </div>
                  </div>
                </Card>

                {/* Clinical Details Tabs */}
                <Card className="p-6">
                  <Tabs defaultValue="presentation" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="presentation">Presentation</TabsTrigger>
                      <TabsTrigger value="exam">Physical Exam</TabsTrigger>
                      <TabsTrigger value="labs">Labs</TabsTrigger>
                      <TabsTrigger value="imaging">Imaging</TabsTrigger>
                    </TabsList>
                    <TabsContent value="presentation" className="mt-4">
                      <p className="text-base leading-relaxed">{clinicalCase.presentation}</p>
                    </TabsContent>
                    <TabsContent value="exam" className="mt-4">
                      <p className="text-base leading-relaxed">
                        {clinicalCase.physicalExam || 'No physical exam findings provided.'}
                      </p>
                    </TabsContent>
                    <TabsContent value="labs" className="mt-4">
                      <p className="text-base leading-relaxed">
                        {clinicalCase.labs || 'No lab results provided.'}
                      </p>
                    </TabsContent>
                    <TabsContent value="imaging" className="mt-4">
                      <p className="text-base leading-relaxed">
                        {clinicalCase.imaging || 'No imaging results provided.'}
                      </p>
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>

              {/* Notes Panel - Right Sidebar */}
              <div className="space-y-6">
                <Card className="p-6 sticky top-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-semibold">Your Notes</h3>
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Take notes as you analyze the case..."
                    className="min-h-[300px] resize-none"
                  />
                  <Button
                    onClick={() => setCurrentStep('response')}
                    className="w-full mt-4 gap-2"
                    size="lg"
                  >
                    Analyze Case
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 'response' && (
          // Response Step
          <motion.div
            key="response"
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            {/* Header */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-2">Provide Your Clinical Analysis</h2>
              <p className="text-muted-foreground">
                Based on the case, provide your differential diagnosis, workup plan, and clinical reasoning.
              </p>
            </Card>

            {/* Differential Diagnosis */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold">Differential Diagnosis</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                List your differential diagnoses in order of likelihood
              </p>
              <Textarea
                value={differential}
                onChange={(e) => setDifferential(e.target.value)}
                placeholder="1. Most likely diagnosis&#10;2. Second most likely&#10;3. Other considerations..."
                className="min-h-[120px] resize-none"
                disabled={isSubmitting}
              />
            </Card>

            {/* Workup Plan */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-semibold">Workup Plan</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                What tests or procedures would you order?
              </p>
              <Textarea
                value={workup}
                onChange={(e) => setWorkup(e.target.value)}
                placeholder="- Blood work: CBC, CMP&#10;- Imaging: Chest X-ray&#10;- Additional tests..."
                className="min-h-[120px] resize-none"
                disabled={isSubmitting}
              />
            </Card>

            {/* Clinical Reasoning */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold">Clinical Reasoning</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Explain your thought process and clinical reasoning
              </p>
              <Textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Based on the patient's presentation, I considered... The key findings that support... The most likely diagnosis is..."
                className="min-h-[150px] resize-none"
                disabled={isSubmitting}
              />
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('case')}
                className="flex-1"
                disabled={isSubmitting}
              >
                Back to Case
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !differential.trim() || !workup.trim() || !reasoning.trim()}
                className="flex-1 gap-2"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Analysis
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {currentStep === 'evaluation' && evaluation && (
          // Evaluation Results
          <motion.div
            key="evaluation"
            variants={listContainerVariants}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            {/* Overall Score */}
            <motion.div variants={listItemVariants}>
              <Card className={`
                p-8 text-center
                bg-card ${getScoreBgColor(evaluation.overall_score)}
                border-2
              `}>
                <h3 className="text-2xl font-bold mb-4">Clinical Performance</h3>
                <p className={`text-6xl font-bold ${getScoreColor(evaluation.overall_score)}`}>
                  {evaluation.overall_score}
                  <span className="text-3xl">/100</span>
                </p>
              </Card>
            </motion.div>

            {/* Score Breakdown */}
            <motion.div variants={listItemVariants}>
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Score Breakdown</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Differential</p>
                    <p className={`text-3xl font-bold ${getScoreColor(evaluation.differential_score)}`}>
                      {evaluation.differential_score}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Workup</p>
                    <p className={`text-3xl font-bold ${getScoreColor(evaluation.workup_score)}`}>
                      {evaluation.workup_score}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Reasoning</p>
                    <p className={`text-3xl font-bold ${getScoreColor(evaluation.reasoning_score)}`}>
                      {evaluation.reasoning_score}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Correct & Missed Diagnoses */}
            <div className="grid grid-cols-2 gap-6">
              <motion.div variants={listItemVariants}>
                <Card className="p-6 border-emerald-200 dark:border-emerald-800 bg-card dark:bg-card h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-lg font-semibold">Correct Diagnoses</h4>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.correct_diagnoses.map((dx, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400">•</span>
                        <span>{dx}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>

              <motion.div variants={listItemVariants}>
                <Card className="p-6 border-red-200 dark:border-red-800 bg-card dark:bg-card h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <h4 className="text-lg font-semibold">Missed Diagnoses</h4>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.missed_diagnoses.map((dx, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400">•</span>
                        <span>{dx}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            </div>

            {/* Workup Feedback */}
            <div className="grid grid-cols-2 gap-6">
              <motion.div variants={listItemVariants}>
                <Card className="p-6 border-blue-200 dark:border-blue-800 bg-card dark:bg-card h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-lg font-semibold">Appropriate Tests</h4>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.appropriate_tests.map((test, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400">•</span>
                        <span>{test}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>

              <motion.div variants={listItemVariants}>
                <Card className="p-6 border-amber-200 dark:border-amber-800 bg-card dark:bg-card h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-lg font-semibold">Unnecessary Tests</h4>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.unnecessary_tests.length > 0 ? (
                      evaluation.unnecessary_tests.map((test, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-600 dark:text-amber-400">•</span>
                          <span>{test}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">All ordered tests were appropriate!</p>
                    )}
                  </ul>
                </Card>
              </motion.div>
            </div>

            {/* Detailed Feedback */}
            <motion.div variants={listItemVariants}>
              <Card className="p-6 bg-card  /50 dark:/20 dark:/10 border-purple-200 dark:border-purple-800">
                <h4 className="text-lg font-semibold mb-3">Detailed Feedback</h4>
                <p className="text-base leading-relaxed">{evaluation.feedback}</p>
              </Card>
            </motion.div>

            {/* Teaching Points */}
            <motion.div variants={listItemVariants}>
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-semibold">Teaching Points</h4>
                </div>
                <ul className="space-y-3">
                  {evaluation.teaching_points.map((point, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-card"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springSubtle, delay: i * 0.1 }}
                    >
                      <span className="text-primary font-semibold">{i + 1}.</span>
                      <span>{point}</span>
                    </motion.li>
                  ))}
                </ul>
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
