'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, type LucideIcon, X } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Priority levels for insights
 */
export type InsightPriority = 'info' | 'warning' | 'critical' | 'success'

/**
 * Props for the InsightCard component
 */
export interface InsightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Insight title
   */
  title: string
  /**
   * Insight description or message
   */
  description: string
  /**
   * Priority level
   */
  priority?: InsightPriority
  /**
   * Custom icon (overrides default priority icon)
   */
  icon?: LucideIcon | React.ReactNode
  /**
   * Action buttons
   */
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  }>
  /**
   * Whether to show dismiss button
   */
  dismissible?: boolean
  /**
   * Dismiss handler
   */
  onDismiss?: () => void
  /**
   * Whether the card has been dismissed
   */
  dismissed?: boolean
  /**
   * Timestamp or date string
   */
  timestamp?: string
  /**
   * Badge or label
   */
  badge?: string
  /**
   * Whether to show entrance animation
   */
  animate?: boolean
}

const priorityConfig: Record<
  InsightPriority,
  {
    icon: LucideIcon
    iconColor: string
    borderColor: string
    bgColor: string
  }
> = {
  info: {
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/20',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-50/50 dark:bg-amber-950/20',
  },
  critical: {
    icon: AlertCircle,
    iconColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50/50 dark:bg-red-950/20',
  },
  success: {
    icon: CheckCircle2,
    iconColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-l-green-500',
    bgColor: 'bg-green-50/50 dark:bg-green-950/20',
  },
}

/**
 * InsightCard - Display actionable insights with priority levels
 *
 * @example
 * ```tsx
 * <InsightCard
 *   title="Performance Improvement"
 *   description="Your response time has improved by 20% this week!"
 *   priority="success"
 *   actions={[
 *     { label: "View Details", onClick: () => {} },
 *     { label: "Share", onClick: () => {}, variant: "outline" }
 *   ]}
 *   dismissible
 * />
 * ```
 */
export const InsightCard = React.forwardRef<HTMLDivElement, InsightCardProps>(
  (
    {
      title,
      description,
      priority = 'info',
      icon: customIcon,
      actions,
      dismissible = false,
      onDismiss,
      dismissed = false,
      timestamp,
      badge,
      animate = true,
      className,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(!dismissed)
    const config = priorityConfig[priority]
    const IconComponent = config.icon

    const handleDismiss = React.useCallback(() => {
      setIsVisible(false)
      // Wait for exit animation to complete before calling onDismiss
      setTimeout(() => {
        onDismiss?.()
      }, 300)
    }, [onDismiss])

    // Keyboard accessibility for dismiss button
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (dismissible && (e.key === 'Escape' || e.key === 'Esc')) {
          handleDismiss()
        }
      },
      [dismissible, handleDismiss],
    )

    const cardContent = (
      <Card
        ref={ref}
        className={cn(
          'relative overflow-hidden border-l-4 transition-shadow hover:shadow-md',
          config.borderColor,
          config.bgColor,
          className,
        )}
        onKeyDown={handleKeyDown}
        tabIndex={dismissible ? 0 : undefined}
        role="article"
        aria-labelledby={`insight-title-${title}`}
        aria-describedby={`insight-desc-${title}`}
        {...props}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className={cn('mt-0.5 shrink-0', config.iconColor)} aria-hidden="true">
              {customIcon ? (
                typeof customIcon === 'function' ? (
                  React.createElement(customIcon as LucideIcon, {
                    className: 'h-5 w-5',
                  })
                ) : (
                  customIcon
                )
              ) : (
                <IconComponent className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <CardTitle
                  id={`insight-title-${title}`}
                  className="text-base font-semibold leading-tight"
                >
                  {title}
                </CardTitle>
                {dismissible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 shrink-0 p-0 hover:bg-background/80"
                    onClick={handleDismiss}
                    aria-label="Dismiss insight"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {badge && (
                <span
                  className="inline-flex items-center rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium"
                  role="status"
                >
                  {badge}
                </span>
              )}
            </div>
          </div>

          <CardDescription id={`insight-desc-${title}`} className="ml-8 text-sm leading-relaxed">
            {description}
          </CardDescription>

          {timestamp && (
            <time className="ml-8 text-xs text-muted-foreground" dateTime={timestamp}>
              {timestamp}
            </time>
          )}
        </CardHeader>

        {actions && actions.length > 0 && (
          <CardContent className="ml-8 pb-4 pt-0">
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  size="sm"
                  onClick={action.onClick}
                  className="h-8"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    )

    if (!animate) {
      return isVisible ? cardContent : null
    }

    return (
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, x: 100 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            layout
          >
            {cardContent}
          </motion.div>
        )}
      </AnimatePresence>
    )
  },
)

InsightCard.displayName = 'InsightCard'
