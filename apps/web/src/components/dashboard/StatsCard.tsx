'use client'

import React from 'react'
import { motion } from 'motion/react'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type StatsVariant = 'xp' | 'mastery' | 'study'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  subtext?: string
  variant: StatsVariant
  delay?: number
  badge?: string
}

const variantStyles = {
  xp: {
    text: 'text-[var(--xp-purple)]',
    bg: 'bg-[var(--xp-purple)]/10',
    border: 'border-[var(--xp-purple)]/25',
  },
  mastery: {
    text: 'text-[var(--mastery-green)]',
    bg: 'bg-[var(--mastery-green)]/10',
    border: 'border-[var(--mastery-green)]/25',
  },
  study: {
    text: 'text-[var(--clinical)]',
    bg: 'bg-[var(--clinical)]/10',
    border: 'border-[var(--clinical)]/25',
  },
}

/**
 * Stats Card Component
 *
 * Displays a single metric with icon and optional badge
 * Uses design tokens from globals.css - NO HARDCODED COLORS
 */
export function StatsCard({
  icon: Icon,
  label,
  value,
  subtext,
  variant,
  delay = 0,
  badge,
}: StatsCardProps) {
  const styles = variantStyles[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="bg-card/80 backdrop-blur-sm border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <p className="text-xs font-medium text-muted-foreground leading-tight">{label}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className={`text-lg font-bold ${styles.text} leading-none`}>
                  {value}
                </p>
                {subtext && (
                  <span className="text-xs text-muted-foreground">{subtext}</span>
                )}
              </div>
              {badge && (
                <Badge
                  variant="secondary"
                  className={`text-xs px-2 py-0.5 h-auto mt-1 ${styles.text} ${styles.bg} ${styles.border} border`}
                >
                  {badge}
                </Badge>
              )}
            </div>

            <motion.div
              className={`rounded-full p-1.5 ${styles.bg}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className={`h-4 w-4 ${styles.text}`} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
