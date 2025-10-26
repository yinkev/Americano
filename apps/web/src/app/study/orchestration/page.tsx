'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Clock,
  Brain,
  Target,
  Zap,
  ArrowLeft,
  Play,
  Settings as SettingsIcon,
  TrendingUp,
  BookOpen,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  springSubtle,
  springSmooth,
  listContainerVariants,
  listItemVariants,
  modalContentVariants
} from '@/lib/design-system'

interface StudyConfig {
  duration: number // minutes
  flashcardsMix: number // percentage
  comprehensionMix: number // percentage
  clinicalCasesMix: number // percentage
  difficultyLevel: 'adaptive' | 'easy' | 'medium' | 'hard'
  focusMode: boolean
}

const difficultyOptions = [
  { value: 'adaptive', label: 'Adaptive', description: 'AI adjusts difficulty based on performance' },
  { value: 'easy', label: 'Easy', description: 'Review familiar concepts' },
  { value: 'medium', label: 'Medium', description: 'Balanced challenge' },
  { value: 'hard', label: 'Hard', description: 'Push your limits' },
] as const

export default function StudyOrchestrationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'deep-study'

  const [config, setConfig] = useState<StudyConfig>({
    duration: 45,
    flashcardsMix: 40,
    comprehensionMix: 40,
    clinicalCasesMix: 20,
    difficultyLevel: 'adaptive',
    focusMode: true,
  })

  const [estimatedCards, setEstimatedCards] = useState(0)
  const [estimatedTopics, setEstimatedTopics] = useState(0)

  useEffect(() => {
    // Calculate estimated cards based on duration and mix
    const cardsPerMinute = 1.5
    const totalCards = Math.floor(config.duration * cardsPerMinute)
    setEstimatedCards(totalCards)
    setEstimatedTopics(Math.floor(totalCards / 5))
  }, [config])

  const handleStartSession = async () => {
    // TODO: Create session via API
    router.push('/study/sessions/new')
  }

  const updateMix = (key: 'flashcardsMix' | 'comprehensionMix' | 'clinicalCasesMix', value: number) => {
    // Auto-balance the other two sliders
    const total = 100
    const remaining = total - value

    setConfig(prev => {
      if (key === 'flashcardsMix') {
        const ratio = prev.comprehensionMix / (prev.comprehensionMix + prev.clinicalCasesMix)
        return {
          ...prev,
          flashcardsMix: value,
          comprehensionMix: Math.round(remaining * ratio),
          clinicalCasesMix: Math.round(remaining * (1 - ratio)),
        }
      } else if (key === 'comprehensionMix') {
        const ratio = prev.flashcardsMix / (prev.flashcardsMix + prev.clinicalCasesMix)
        return {
          ...prev,
          comprehensionMix: value,
          flashcardsMix: Math.round(remaining * ratio),
          clinicalCasesMix: Math.round(remaining * (1 - ratio)),
        }
      } else {
        const ratio = prev.flashcardsMix / (prev.flashcardsMix + prev.comprehensionMix)
        return {
          ...prev,
          clinicalCasesMix: value,
          flashcardsMix: Math.round(remaining * ratio),
          comprehensionMix: Math.round(remaining * (1 - ratio)),
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSmooth}
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <h1 className="text-4xl font-heading font-bold mb-2">
            Configure Your Session
          </h1>
          <p className="text-lg text-muted-foreground">
            Customize your learning experience for optimal results
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            variants={listContainerVariants}
            initial="initial"
            animate="animate"
          >
            {/* Duration */}
            <motion.div variants={listItemVariants}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-card flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold">Study Duration</Label>
                    <p className="text-sm text-muted-foreground">How long do you want to study?</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{config.duration} min</span>
                    <div className="flex gap-2">
                      {[15, 30, 45, 60, 90].map(dur => (
                        <Button
                          key={dur}
                          variant={config.duration === dur ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setConfig(prev => ({ ...prev, duration: dur }))}
                        >
                          {dur}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Slider
                    value={[config.duration]}
                    onValueChange={([val]) => setConfig(prev => ({ ...prev, duration: val }))}
                    min={15}
                    max={120}
                    step={5}
                    className="w-full"
                  />
                </div>
              </Card>
            </motion.div>

            {/* Content Mix */}
            <motion.div variants={listItemVariants}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-card flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold">Content Mix</Label>
                    <p className="text-sm text-muted-foreground">Balance between different learning modes</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Flashcards */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Flashcards</span>
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {config.flashcardsMix}%
                      </span>
                    </div>
                    <Slider
                      value={[config.flashcardsMix]}
                      onValueChange={([val]) => updateMix('flashcardsMix', val)}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Comprehension */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Comprehension Prompts</span>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {config.comprehensionMix}%
                      </span>
                    </div>
                    <Slider
                      value={[config.comprehensionMix]}
                      onValueChange={([val]) => updateMix('comprehensionMix', val)}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Clinical Cases */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Clinical Cases</span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {config.clinicalCasesMix}%
                      </span>
                    </div>
                    <Slider
                      value={[config.clinicalCasesMix]}
                      onValueChange={([val]) => updateMix('clinicalCasesMix', val)}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Difficulty */}
            <motion.div variants={listItemVariants}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-card flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold">Difficulty Level</Label>
                    <p className="text-sm text-muted-foreground">Choose your challenge level</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {difficultyOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setConfig(prev => ({ ...prev, difficultyLevel: option.value }))}
                      className={`
                        p-4 rounded-xl border-2 text-left transition-all
                        ${config.difficultyLevel === option.value
                          ? 'border-primary bg-card shadow-none'
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="font-semibold mb-1">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Focus Mode */}
            <motion.div variants={listItemVariants}>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-card flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <Label className="text-lg font-semibold">Focus Mode</Label>
                      <p className="text-sm text-muted-foreground">Minimize distractions during study</p>
                    </div>
                  </div>
                  <Button
                    variant={config.focusMode ? 'default' : 'outline'}
                    onClick={() => setConfig(prev => ({ ...prev, focusMode: !prev.focusMode }))}
                  >
                    {config.focusMode ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springSmooth, delay: 0.2 }}
          >
            <Card className="p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-card flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold">Session Preview</h3>
              </div>

              <div className="space-y-4">
                {/* Estimated Cards */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Estimated Cards</span>
                  <span className="text-2xl font-bold">{estimatedCards}</span>
                </div>

                {/* Topics Covered */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Topics Covered</span>
                  <span className="text-2xl font-bold">{estimatedTopics}</span>
                </div>

                {/* Completion Time */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Expected Duration</span>
                  <span className="text-2xl font-bold">{config.duration}m</span>
                </div>

                {/* Difficulty */}
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">Difficulty</span>
                  <span className="text-lg font-semibold capitalize">{config.difficultyLevel}</span>
                </div>
              </div>

              {/* Start Button */}
              <motion.div
                className="mt-8"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className="w-full py-6 text-lg font-semibold gap-2 shadow-none"
                  onClick={handleStartSession}
                  size="lg"
                >
                  <Play className="w-5 h-5" />
                  Start Session
                </Button>
              </motion.div>

              {/* Focus Mode Note */}
              {config.focusMode && (
                <motion.div
                  className="mt-4 p-3 rounded-lg bg-indigo-50 dark:bg-card border border-indigo-200 dark:border-indigo-800"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={springSubtle}
                >
                  <p className="text-sm text-indigo-900 dark:text-indigo-200">
                    Focus mode will hide the sidebar and minimize distractions
                  </p>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
