'use client'

import { Activity, ChevronRight, Clock, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CaseStructure } from '@/types/clinical-scenarios'

interface ClinicalCaseDialogProps {
  scenario: {
    id: string
    objectiveId: string
    scenarioType: 'DIAGNOSIS' | 'MANAGEMENT' | 'DIFFERENTIAL' | 'COMPLICATIONS'
    difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
    caseText: CaseStructure
    boardExamTopic?: string
  }
  open: boolean
  onClose: () => void
  onSubmit: (choices: Record<string, any>, reasoning: string) => Promise<void>
}

type Stage = 'chiefComplaint' | 'history' | 'physicalExam' | 'workup' | 'questions'

const STAGE_ORDER: Stage[] = ['chiefComplaint', 'history', 'physicalExam', 'workup', 'questions']

const STAGE_LABELS: Record<Stage, string> = {
  chiefComplaint: 'Chief Complaint',
  history: 'History',
  physicalExam: 'Physical Exam',
  workup: 'Workup',
  questions: 'Clinical Questions',
}

// OKLCH color palette for competency types (from context)
const COMPETENCY_COLORS = {
  dataGathering: 'oklch(0.65 0.18 200)', // Blue
  diagnosis: 'oklch(0.7 0.15 145)', // Green
  management: 'oklch(0.68 0.16 280)', // Purple
  clinicalReasoning: 'oklch(0.72 0.12 45)', // Orange
}

export function ClinicalCaseDialog({ scenario, open, onClose, onSubmit }: ClinicalCaseDialogProps) {
  const [currentStage, setCurrentStage] = useState<Stage>('chiefComplaint')
  const [userChoices, setUserChoices] = useState<Record<string, any>>({})
  const [timeStarted, setTimeStarted] = useState<number>(Date.now())
  const [reasoning, setReasoning] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const caseData = scenario.caseText

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStage('chiefComplaint')
      setUserChoices({})
      setTimeStarted(Date.now())
      setReasoning('')
      setIsSubmitting(false)
    }
  }, [open])

  // Calculate time elapsed
  const timeElapsed = useMemo(() => {
    const seconds = Math.floor((Date.now() - timeStarted) / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [timeStarted])

  const handleNextStage = () => {
    const currentIndex = STAGE_ORDER.indexOf(currentStage)
    if (currentIndex < STAGE_ORDER.length - 1) {
      setCurrentStage(STAGE_ORDER[currentIndex + 1])
    }
  }

  const handlePreviousStage = () => {
    const currentIndex = STAGE_ORDER.indexOf(currentStage)
    if (currentIndex > 0) {
      setCurrentStage(STAGE_ORDER[currentIndex - 1])
    }
  }

  const handleQuestionChoice = (questionIndex: number, choice: string) => {
    setUserChoices((prev) => ({
      ...prev,
      [`question_${questionIndex}`]: choice,
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(userChoices, reasoning)
      onClose()
    } catch (error) {
      console.error('Failed to submit scenario:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    if (currentStage === 'questions') {
      // Check if all questions are answered
      const questionCount = caseData.questions.length
      const answeredCount = Object.keys(userChoices).filter((k) => k.startsWith('question_')).length
      return answeredCount === questionCount && reasoning.trim().length >= 50
    }
    return true
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200 motion-reduce:animate-none"
        style={{
          backgroundColor: 'oklch(0.98 0.01 200)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${COMPETENCY_COLORS.dataGathering}20`,
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-2xl font-bold">Clinical Case Scenario</span>
            <div className="flex items-center gap-2 text-sm font-normal">
              <Clock className="h-4 w-4" />
              <span>{timeElapsed}</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {scenario.boardExamTopic && (
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${COMPETENCY_COLORS.diagnosis}15`,
                  color: COMPETENCY_COLORS.diagnosis,
                }}
              >
                {scenario.boardExamTopic}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STAGE_ORDER.map((stage, index) => (
            <div key={stage} className="flex items-center flex-1">
              <div
                className="h-2 rounded-full flex-1 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out motion-reduce:transition-none"
                style={{
                  backgroundColor:
                    STAGE_ORDER.indexOf(currentStage) >= index
                      ? COMPETENCY_COLORS.dataGathering
                      : 'oklch(0.85 0.05 200)',
                }}
              />
              {index < STAGE_ORDER.length - 1 && <ChevronRight className="h-4 w-4 mx-1" />}
            </div>
          ))}
        </div>

        {/* Stage title */}
        <h3 className="text-lg font-semibold mb-4" style={{ color: COMPETENCY_COLORS.diagnosis }}>
          {STAGE_LABELS[currentStage]}
        </h3>

        {/* Chief Complaint Stage */}
        {currentStage === 'chiefComplaint' && (
          <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-300 motion-reduce:animate-none">
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'oklch(0.95 0.05 200)',
                borderColor: 'oklch(0.85 0.08 200)',
              }}
            >
              <div className="flex items-start gap-4 mb-4">
                <User className="h-6 w-6" style={{ color: COMPETENCY_COLORS.dataGathering }} />
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Patient Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <strong>Age:</strong> {caseData.demographics.age}
                    </p>
                    <p>
                      <strong>Sex:</strong> {caseData.demographics.sex}
                    </p>
                    {caseData.demographics.occupation && (
                      <p className="col-span-2">
                        <strong>Occupation:</strong> {caseData.demographics.occupation}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded" style={{ backgroundColor: 'oklch(1 0 0)' }}>
                <p className="font-semibold mb-2">Chief Complaint:</p>
                <p className="text-lg">{caseData.chiefComplaint}</p>
              </div>
            </div>

            <button
              onClick={handleNextStage}
              className="w-full min-h-[44px] rounded-lg text-white font-medium motion-safe:transition-all motion-safe:duration-150 hover:opacity-90 motion-safe:active:scale-[0.98] motion-reduce:transition-none"
              style={{ backgroundColor: COMPETENCY_COLORS.dataGathering }}
              aria-label="Continue to history"
            >
              Continue to History →
            </button>
          </div>
        )}

        {/* History Stage */}
        {currentStage === 'history' && (
          <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-300 motion-reduce:animate-none">
            <div
              className="p-6 rounded-lg border space-y-4"
              style={{
                backgroundColor: 'oklch(0.95 0.05 200)',
                borderColor: 'oklch(0.85 0.08 200)',
              }}
            >
              <div>
                <h4 className="font-semibold mb-2">History of Present Illness (HPI)</h4>
                <p className="text-sm">{caseData.history.presenting}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Past Medical History</h4>
                <p className="text-sm">{caseData.history.past}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Medications</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {caseData.history.medications?.map((med, idx) => (
                    <li key={idx}>{med}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Social History</h4>
                <p className="text-sm">{caseData.history.socialHistory}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePreviousStage}
                className="flex-1 min-h-[44px] rounded-lg font-medium border-2 motion-safe:transition-all motion-safe:duration-150 hover:bg-opacity-10 motion-safe:active:scale-[0.98] motion-reduce:transition-none"
                style={{
                  borderColor: COMPETENCY_COLORS.dataGathering,
                  color: COMPETENCY_COLORS.dataGathering,
                }}
                aria-label="Go back to chief complaint"
              >
                ← Back
              </button>
              <button
                onClick={handleNextStage}
                className="flex-1 min-h-[44px] rounded-lg text-white font-medium motion-safe:transition-all motion-safe:duration-150 hover:opacity-90 motion-safe:active:scale-[0.98] motion-reduce:transition-none"
                style={{ backgroundColor: COMPETENCY_COLORS.dataGathering }}
                aria-label="Continue to physical exam"
              >
                Continue to Physical Exam →
              </button>
            </div>
          </div>
        )}

        {/* Physical Exam Stage */}
        {currentStage === 'physicalExam' && (
          <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-300 motion-reduce:animate-none">
            <div
              className="p-6 rounded-lg border space-y-4"
              style={{
                backgroundColor: 'oklch(0.95 0.05 200)',
                borderColor: 'oklch(0.85 0.08 200)',
              }}
            >
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Vital Signs
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(caseData.physicalExam.vitals).map(([key, value]) => (
                    <p key={key}>
                      <strong>{key}:</strong> {value}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">General Appearance</h4>
                <p className="text-sm">{caseData.physicalExam.general}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Cardiovascular</h4>
                <p className="text-sm">{caseData.physicalExam.cardiovascular}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Respiratory</h4>
                <p className="text-sm">{caseData.physicalExam.respiratory}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePreviousStage}
                className="flex-1 min-h-[44px] rounded-lg font-medium transition-all border-2"
                style={{
                  borderColor: COMPETENCY_COLORS.dataGathering,
                  color: COMPETENCY_COLORS.dataGathering,
                }}
                aria-label="Go back to history"
              >
                ← Back
              </button>
              <button
                onClick={handleNextStage}
                className="flex-1 min-h-[44px] rounded-lg text-white font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: COMPETENCY_COLORS.dataGathering }}
                aria-label="Continue to workup"
              >
                Continue to Workup →
              </button>
            </div>
          </div>
        )}

        {/* Workup Stage */}
        {currentStage === 'workup' && (
          <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-300 motion-reduce:animate-none">
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'oklch(0.95 0.05 200)',
                borderColor: 'oklch(0.85 0.08 200)',
              }}
            >
              <h4 className="font-semibold mb-4">Laboratory and Imaging Options</h4>
              {caseData.labs.available ? (
                <div className="space-y-2">
                  <p className="text-sm mb-3">Available tests:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {caseData.labs.options.map((option, idx) => (
                      <li key={idx}>{option}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm italic">No additional workup available at this time.</p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePreviousStage}
                className="flex-1 min-h-[44px] rounded-lg font-medium transition-all border-2"
                style={{
                  borderColor: COMPETENCY_COLORS.dataGathering,
                  color: COMPETENCY_COLORS.dataGathering,
                }}
                aria-label="Go back to physical exam"
              >
                ← Back
              </button>
              <button
                onClick={handleNextStage}
                className="flex-1 min-h-[44px] rounded-lg text-white font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: COMPETENCY_COLORS.diagnosis }}
                aria-label="Continue to clinical questions"
              >
                Continue to Questions →
              </button>
            </div>
          </div>
        )}

        {/* Questions Stage */}
        {currentStage === 'questions' && (
          <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-300 motion-reduce:animate-none">
            <div className="space-y-6">
              {caseData.questions.map((question, qIndex) => (
                <div
                  key={qIndex}
                  className="p-6 rounded-lg border motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-400 motion-reduce:animate-none"
                  style={{
                    backgroundColor: 'oklch(0.95 0.05 200)',
                    borderColor: 'oklch(0.85 0.08 200)',
                    animationDelay: `${qIndex * 100}ms`,
                  }}
                >
                  <p className="font-semibold mb-4">
                    Question {qIndex + 1}: {question.prompt}
                  </p>
                  <div className="space-y-2">
                    {question.options?.map((option, oIndex) => (
                      <label
                        key={oIndex}
                        className="flex items-center gap-3 p-3 rounded min-h-[44px] cursor-pointer motion-safe:transition-all motion-safe:duration-200 hover:scale-[1.02] motion-safe:active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
                        style={{
                          backgroundColor:
                            userChoices[`question_${qIndex}`] === option
                              ? `${COMPETENCY_COLORS.diagnosis}15`
                              : 'oklch(1 0 0)',
                          border: `2px solid ${
                            userChoices[`question_${qIndex}`] === option
                              ? COMPETENCY_COLORS.diagnosis
                              : 'oklch(0.85 0.05 200)'
                          }`,
                        }}
                      >
                        <input
                          type="radio"
                          name={`question_${qIndex}`}
                          value={option}
                          checked={userChoices[`question_${qIndex}`] === option}
                          onChange={() => handleQuestionChoice(qIndex, option)}
                          className="w-5 h-5"
                          style={{ accentColor: COMPETENCY_COLORS.diagnosis }}
                        />
                        <span className="flex-1">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Reasoning textarea */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'oklch(0.95 0.05 200)',
                borderColor: 'oklch(0.85 0.08 200)',
              }}
            >
              <label className="block font-semibold mb-2">
                Explain your clinical reasoning (minimum 50 characters):
              </label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                className="w-full min-h-[120px] p-3 rounded border text-sm"
                style={{
                  backgroundColor: 'oklch(1 0 0)',
                  borderColor: 'oklch(0.85 0.05 200)',
                }}
                placeholder="Describe your differential diagnosis, key findings that led to your answers, and your diagnostic approach..."
                aria-label="Clinical reasoning explanation"
              />
              <p className="text-xs mt-2" style={{ color: 'oklch(0.5 0.05 200)' }}>
                {reasoning.length} / 50 characters minimum
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePreviousStage}
                className="flex-1 min-h-[44px] rounded-lg font-medium transition-all border-2"
                style={{
                  borderColor: COMPETENCY_COLORS.dataGathering,
                  color: COMPETENCY_COLORS.dataGathering,
                }}
                aria-label="Go back to workup"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="flex-1 min-h-[44px] rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: COMPETENCY_COLORS.management }}
                aria-label="Submit scenario responses"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Scenario'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
