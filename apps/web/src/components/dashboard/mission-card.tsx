'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ChevronRight, RefreshCw, Clock, CheckCircle2, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Section } from '@/components/ui/section'
import type { MissionWithObjectives, MissionProgress } from '@/types/mission'
import { getMissionObjectives } from '@/types/mission-helpers'
import { springSmooth, springSubtle, listContainerVariants, listItemVariants, buttonPrimaryVariants } from '@/lib/design-system'

export function MissionCard() {
  const [mission, setMission] = useState<MissionWithObjectives | null>(null)
  const [progress, setProgress] = useState<MissionProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    fetchMission()
  }, [])

  async function fetchMission() {
    try {
      setLoading(true)
      const response = await fetch('/api/learning/mission/today')
      const data = await response.json()

      if (data.success) {
        setMission(data.data.mission)
        setProgress(data.data.progress)
      }
    } catch (error) {
      console.error('Failed to fetch mission:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegenerate() {
    if (!mission) return

    try {
      setRegenerating(true)
      const response = await fetch(`/api/learning/mission/${mission.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()

      if (data.success) {
        setMission(data.data.mission)
        const objectives = getMissionObjectives(data.data.mission)
        const completed = objectives.filter((obj: any) => obj.completed).length
        setProgress({
          total: objectives.length,
          completed,
          percentage: Math.round((completed / objectives.length) * 100),
          estimatedMinutesRemaining: objectives
            .filter((obj: any) => !obj.completed)
            .reduce((sum: number, obj: any) => sum + obj.estimatedMinutes, 0),
          actualMinutesSpent: 0,
        })
      }
    } catch (error) {
      console.error('Failed to regenerate mission:', error)
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springSmooth}
      >
        <Card className="bg-muted shadow-none rounded-xl">
          <CardContent className="p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded-xl w-1/2" />
              <div className="h-4 bg-muted rounded-xl w-full" />
              <div className="h-4 bg-muted rounded-xl w-3/4" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (!mission || !progress) {
    return (
      <Card className="bg-muted shadow-none rounded-xl">
        <CardContent className="p-8">
          <p className="text-md font-semibold text-muted-foreground">No mission available for today.</p>
        </CardContent>
      </Card>
    )
  }

  const objectives = getMissionObjectives(mission)
  const nextObjective = objectives.find((obj) => !obj.completed)

  const formattedDate = new Date(mission.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSmooth}
      whileHover={{ y: -2, transition: springSubtle }}
    >
      <Card interactive="interactive" className="bg-transparent border-none shadow-none rounded-xl">
      <Section
        className="mb-2"
        title="Today's Mission"
        icon={<Zap className="size-5" />}
        aside={
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRegenerate}
            disabled={regenerating}
            aria-label="Regenerate mission"
            className="rounded-xl"
          >
            <RefreshCw className={`size-5 ${regenerating ? 'animate-spin' : ''}`} />
          </Button>
        }
      />

      <CardContent className="p-0 space-y-4">
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-md font-semibold text-muted-foreground">Your Progress</p>
            <motion.span
              className="text-md font-bold text-primary tabular-nums"
              key={`${progress.completed}-${progress.total}`}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springSubtle}
            >
              {progress.completed} / {progress.total} done
            </motion.span>
          </div>
          {progress.total > 0 && (
            <>
              <div className="py-1">
                <Progress value={progress.percentage} />
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {progress.estimatedMinutesRemaining} min to go
                </span>
                {mission.status === 'COMPLETED' && (
                  <span className="flex items-center gap-1.5 text-success font-semibold">
                    <CheckCircle2 className="size-4" />
                    All done!
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <motion.div
          className="space-y-3"
          variants={listContainerVariants}
          initial="initial"
          animate="animate"
        >
          {objectives.slice(0, 3).map((obj, idx) => (
            <motion.div
              key={obj.id}
              variants={listItemVariants}
              whileHover={{ scale: 1.01, x: 4 }}
              transition={springSubtle}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted cursor-pointer"
            >
              <div className={`flex-shrink-0 size-7 rounded-full flex items-center justify-center font-semibold text-base ${obj.completed ? 'bg-card text-success' : 'bg-card text-primary'}`}>
                {obj.completed ? <CheckCircle2 size={20} /> : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold leading-snug ${obj.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {obj.objective?.objective || 'Loading...'}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-muted-foreground font-medium">{obj.estimatedMinutes} min</span>
                  {obj.objective?.isHighYield && <Badge variant="secondary" className="text-xs">⭐ High-yield</Badge>}
                </div>
              </div>
            </motion.div>
          ))}
          {objectives.length > 3 && (
            <p className="text-sm text-center text-muted-foreground pt-2">
              + {objectives.length - 3} more objectives
            </p>
          )}
        </motion.div>

        {nextObjective ? (
          <div className="pt-4">
            <motion.div
              variants={buttonPrimaryVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Button size="md" className="w-full rounded-xl font-semibold text-base shadow-none" onClick={() => { window.location.href = `/study?missionId=${mission.id}` }}>
                Start Next Objective
                <ChevronRight className="size-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="pt-4 text-center">
            <p className="text-lg font-bold text-success">🎉 Mission complete. Great job!</p>
          </div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  )
}
