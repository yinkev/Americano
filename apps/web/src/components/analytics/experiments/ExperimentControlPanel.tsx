/**
 * ExperimentControlPanel Component
 * Story 5.5 Task 10.5: Experiment Conclusion Controls
 *
 * Provides manual controls to conclude experiments and roll out winning variants
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CheckCircle2, Trophy, AlertTriangle, Sparkles } from 'lucide-react'

interface ExperimentResults {
  variantAMetrics: {
    retention: number
    performance: number
    satisfaction: number
    sampleSize: number
  }
  variantBMetrics: {
    retention: number
    performance: number
    satisfaction: number
    sampleSize: number
  }
  statistical: {
    pValue: number
    isStatisticallySignificant: boolean
    winningVariant: 'A' | 'B' | 'NONE'
    confidenceLevel: number
  }
  recommendation: string
}

interface ExperimentControlPanelProps {
  experimentId: string
  results: ExperimentResults
  onConclude: (experimentId: string, winningVariant: 'A' | 'B') => Promise<void>
}

export function ExperimentControlPanel({
  experimentId,
  results,
  onConclude,
}: ExperimentControlPanelProps) {
  const [showConcludeDialog, setShowConcludeDialog] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B' | null>(null)
  const [concluding, setConcluding] = useState(false)

  const { statistical } = results
  const recommendedVariant = statistical.winningVariant !== 'NONE' ? statistical.winningVariant : null

  async function handleConclude() {
    if (!selectedVariant) return

    try {
      setConcluding(true)
      await onConclude(experimentId, selectedVariant)
      setShowConcludeDialog(false)
    } catch (error) {
      console.error('Error concluding experiment:', error)
    } finally {
      setConcluding(false)
    }
  }

  function openConcludeDialog(variant: 'A' | 'B') {
    setSelectedVariant(variant)
    setShowConcludeDialog(true)
  }

  return (
    <>
      <Card className="bg-card  border-border shadow-none rounded-xl">
        <CardHeader>
          <CardTitle className="font-heading font-semibold text-[18px] flex items-center gap-2">
            <Sparkles className="size-5" style={{ color: 'oklch(0.7 0.15 230)' }} />
            Experiment Controls
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Review results and conclude the experiment to roll out the winning variant
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Recommendation Banner */}
          {statistical.isStatisticallySignificant && recommendedVariant ? (
            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: 'oklch(0.7 0.15 145)/0.05',
                borderColor: 'oklch(0.7 0.15 145)/0.2',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg shrink-0"
                  style={{ backgroundColor: 'oklch(0.7 0.15 145)/0.15' }}
                >
                  <Trophy className="size-6" style={{ color: 'oklch(0.7 0.15 145)' }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    Recommended Action
                  </h4>
                  <p className="text-sm text-foreground mb-2">{results.recommendation}</p>
                  <Button
                    onClick={() => openConcludeDialog(recommendedVariant)}
                    className="gap-2 mt-2"
                    style={{
                      backgroundColor: 'oklch(0.7 0.15 145)',
                      color: 'white',
                    }}
                  >
                    <CheckCircle2 className="size-4" />
                    Roll Out Variant {recommendedVariant}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: 'oklch(0.8 0.15 85)/0.05',
                borderColor: 'oklch(0.8 0.15 85)/0.2',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg shrink-0"
                  style={{ backgroundColor: 'oklch(0.8 0.15 85)/0.15' }}
                >
                  <AlertTriangle className="size-6" style={{ color: 'oklch(0.8 0.15 85)' }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    Results Not Statistically Significant
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    The experiment data does not show a statistically significant difference between
                    variants. Consider collecting more data or running the experiment longer before
                    concluding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Conclusion Options */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Manual Conclusion</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Choose a variant to roll out to all users. This will end the experiment and apply the
              selected variant's configuration globally.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Variant A Option */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  recommendedVariant === 'A'
                    ? 'border-[oklch(0.7_0.15_145)] bg-[oklch(0.7_0.15_145)]/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-base font-semibold text-foreground">Variant A</h5>
                  {recommendedVariant === 'A' && (
                    <Badge
                      variant="outline"
                      className="px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: 'oklch(0.7 0.15 145)/0.1',
                        borderColor: 'oklch(0.7 0.15 145)',
                        color: 'oklch(0.7 0.15 145)',
                      }}
                    >
                      Recommended
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Retention</span>
                    <span className="font-medium">{results.variantAMetrics.retention.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Performance</span>
                    <span className="font-medium">{results.variantAMetrics.performance.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Satisfaction</span>
                    <span className="font-medium">{results.variantAMetrics.satisfaction.toFixed(1)}/5</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openConcludeDialog('A')}
                >
                  Select Variant A
                </Button>
              </div>

              {/* Variant B Option */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  recommendedVariant === 'B'
                    ? 'border-[oklch(0.7_0.15_145)] bg-[oklch(0.7_0.15_145)]/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-base font-semibold text-foreground">Variant B</h5>
                  {recommendedVariant === 'B' && (
                    <Badge
                      variant="outline"
                      className="px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: 'oklch(0.7 0.15 145)/0.1',
                        borderColor: 'oklch(0.7 0.15 145)',
                        color: 'oklch(0.7 0.15 145)',
                      }}
                    >
                      Recommended
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Retention</span>
                    <span className="font-medium">{results.variantBMetrics.retention.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Performance</span>
                    <span className="font-medium">{results.variantBMetrics.performance.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Satisfaction</span>
                    <span className="font-medium">{results.variantBMetrics.satisfaction.toFixed(1)}/5</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openConcludeDialog('B')}
                >
                  Select Variant B
                </Button>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Note:</span> Concluding an experiment is irreversible.
              The selected variant's configuration will be applied to all users, and the experiment
              data will be archived. Ensure you've reviewed all metrics before proceeding.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Conclude Confirmation Dialog */}
      <AlertDialog open={showConcludeDialog} onOpenChange={setShowConcludeDialog}>
        <AlertDialogContent className="bg-white border shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px]">
              Conclude Experiment with Variant {selectedVariant}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-[13px]">
              <p>This action will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>End the experiment immediately</li>
                <li>Roll out Variant {selectedVariant} configuration to all users</li>
                <li>Archive the experiment data for future reference</li>
                <li>Update personalization settings platform-wide</li>
              </ul>
              {selectedVariant !== recommendedVariant && (
                <p className="font-semibold mt-3 text-[oklch(0.8_0.15_85)]">
                  Warning: This variant is not the statistically recommended choice.
                </p>
              )}
              <p className="font-semibold mt-3">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={concluding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConclude}
              disabled={concluding}
              style={{
                backgroundColor: 'oklch(0.7 0.15 145)',
                color: 'white',
              }}
            >
              {concluding ? 'Concluding...' : `Conclude with Variant ${selectedVariant}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
