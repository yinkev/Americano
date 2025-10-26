'use client'

import { motion } from 'motion/react'
import { Clock, Layers, ArrowRight } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { ListRow } from '@/components/ui/list-row'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { springSmooth, springSubtle, listContainerVariants, listItemVariants } from '@/lib/design-system'

const upcomingCards = [
  {
    id: 1,
    title: 'Cardiovascular System',
    course: 'Gross Anatomy',
    dueIn: 'Due now',
    priority: 'high',
    count: 8,
  },
  {
    id: 2,
    title: 'Drug Absorption Mechanisms',
    course: 'Pharmacology',
    dueIn: 'Due in 30 min',
    priority: 'medium',
    count: 12,
  },
  {
    id: 3,
    title: 'Biochemical Pathways',
    course: 'SciFOM',
    dueIn: 'Due in 2 hours',
    priority: 'low',
    count: 5,
  },
]

const priorityColors: Record<string, string> = {
  high: 'oklch(0.78 0.13 340)', // Accent Pink
  medium: 'oklch(0.8 0.15 90)', // Warning Yellow
  low: 'oklch(0.70 0.15 150)', // Secondary Green
}

export function UpcomingReviews() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springSmooth, delay: 0.2 }}>
      <Section title="Upcoming Reviews" aside={<Link href="/study" className="text-sm font-semibold text-primary">View All</Link>}>
        <motion.div variants={listContainerVariants} initial="initial" animate="animate" className="space-y-1.5">
          {upcomingCards.map((card) => (
            <motion.div key={card.id} variants={listItemVariants}>
              <ListRow
                dotColor={priorityColors[card.priority]}
                label={card.title}
                sublabel={`${card.course} • ${card.count} cards`}
                value={card.dueIn}
              />
            </motion.div>
          ))}
        </motion.div>
      </Section>
    </motion.div>
  )
}
