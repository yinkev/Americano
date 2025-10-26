'use client'

import { motion } from 'motion/react'
import { Activity, Clock, Target } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { ListRow } from '@/components/ui/list-row'
import { springSubtle, listContainerVariants } from '@/lib/design-system'

interface StudySession {
  id: string
  title: string
  date: string
  cardsReviewed: number
  accuracy: number
  timeSpent: number
  type: 'flashcards' | 'clinical-case' | 'validation' | 'quiz'
}

interface RecentActivityProps {
  sessions: StudySession[]
}

const typeColors: Record<StudySession['type'], string> = {
  flashcards: 'var(--info)',
  'clinical-case': 'var(--accent)',
  validation: 'var(--success)',
  quiz: 'var(--warning)',
}

const typeLabels: Record<StudySession['type'], string> = {
  flashcards: 'Flashcards',
  'clinical-case': 'Clinical Case',
  validation: 'Validation',
  quiz: 'Quiz',
}

export function RecentActivity({ sessions }: RecentActivityProps) {
  return (
    <div className="rounded-xl">
      <Section title="Recent Activity" icon={<Activity className="size-5" />} />

      <motion.div
        className="space-y-1"
        variants={listContainerVariants}
        initial="initial"
        animate="animate"
      >
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[oklch(0.556_0_0)] font-medium">
              No study sessions yet. Start learning to see your activity here!
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <ListRow
              key={session.id}
              dotColor={typeColors[session.type]}
              label={session.title}
              sublabel={
                <span className="flex items-center gap-3">
                  <span style={{ color: typeColors[session.type] }} className="font-medium">
                    {typeLabels[session.type]}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Target className="size-4" /> {session.cardsReviewed} cards
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-4" /> {session.timeSpent}m
                  </span>
                  <span className="text-muted-foreground">{session.date}</span>
                </span>
              }
              value={
                <span className="inline-flex items-center gap-1 text-foreground">
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      background:
                        session.accuracy >= 80
                          ? 'var(--success)'
                          : session.accuracy >= 60
                          ? 'var(--warning)'
                          : 'var(--accent)',
                    }}
                  />
                  {session.accuracy}%
                </span>
              }
            />
          ))
        )}
      </motion.div>
    </div>
  )
}
