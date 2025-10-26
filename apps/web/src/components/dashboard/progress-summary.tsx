'use client'

import { motion } from 'motion/react'
import { Flame, Brain, TrendingUp, Award, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Section } from '@/components/ui/section'
import { ListRow } from '@/components/ui/list-row'
import { springSmooth, springSubtle, gridContainerVariants, gridItemVariants } from '@/lib/design-system'
import { Progress } from '@/components/ui/progress'

const stats = [
  {
    id: 'streak',
    label: 'Day Streak',
    value: '7',
    icon: Flame,
    color: 'oklch(0.78 0.13 340)', // Accent Pink
  },
  {
    id: 'cards-reviewed',
    label: 'Cards Reviewed',
    value: '142',
    icon: Brain,
    color: 'oklch(0.75 0.12 240)', // Primary Blue
  },
  {
    id: 'accuracy',
    label: 'Accuracy',
    value: '87%',
    icon: TrendingUp,
    color: 'oklch(0.70 0.15 150)', // Secondary Green
  },
  {
    id: 'points',
    label: 'Points',
    value: '1,240',
    icon: Star,
    color: 'oklch(0.8 0.15 90)', // Warning Yellow
  },
]

export function ProgressSummary() {
  const items = [
    { id: 'streak', label: 'Day Streak', value: 7, color: 'oklch(0.72 0.15 165)' },
    { id: 'cards', label: 'Cards Reviewed', value: 142, color: 'oklch(0.66 0.13 240)' },
    { id: 'accuracy', label: 'Accuracy', value: '87%', color: 'oklch(0.72 0.15 165)' },
    { id: 'points', label: 'Points', value: '1,240', color: 'oklch(0.8 0.15 90)' },
  ]
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springSmooth, delay: 0.1 }}>
      <Section title="Your Progress">
        <div className="space-y-1.5">
          {items.map((s) => (
            <div key={s.id} className="rounded-xl bg-muted p-2">
              <ListRow dotColor={s.color} label={s.label} value={s.value} />
              <Progress className="h-1.5" value={s.id === 'accuracy' ? parseInt(String(87)) : 100} />
            </div>
          ))}
        </div>
      </Section>
    </motion.div>
  )
}
