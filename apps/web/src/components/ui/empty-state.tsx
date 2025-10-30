'use client'

import { motion } from 'framer-motion'
import { AlertCircle, Database, FileX, Inbox, Loader2, type LucideIcon, Search } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Empty state variants
 */
export type EmptyStateVariant =
  | 'no-data'
  | 'no-results'
  | 'error'
  | 'loading'
  | 'empty'
  | 'not-found'

/**
 * Props for the EmptyState component
 */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variant type
   */
  variant?: EmptyStateVariant
  /**
   * Title text
   */
  title?: string
  /**
   * Description text
   */
  description?: string
  /**
   * Custom icon (overrides default variant icon)
   */
  icon?: LucideIcon | React.ReactNode
  /**
   * Icon size
   */
  iconSize?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Call-to-action button config
   */
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  }
  /**
   * Secondary action button
   */
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  }
  /**
   * Whether to animate on mount
   */
  animate?: boolean
  /**
   * Whether to show in compact mode
   */
  compact?: boolean
}

const variantConfig: Record<
  EmptyStateVariant,
  {
    icon: LucideIcon
    defaultTitle: string
    defaultDescription: string
    iconColor: string
  }
> = {
  'no-data': {
    icon: Database,
    defaultTitle: 'No data available',
    defaultDescription:
      "There's no data to display at the moment. Try adjusting your filters or check back later.",
    iconColor: 'text-muted-foreground',
  },
  'no-results': {
    icon: Search,
    defaultTitle: 'No results found',
    defaultDescription:
      "We couldn't find anything matching your search. Try different keywords or filters.",
    iconColor: 'text-muted-foreground',
  },
  error: {
    icon: AlertCircle,
    defaultTitle: 'Something went wrong',
    defaultDescription: 'We encountered an error while loading your data. Please try again.',
    iconColor: 'text-destructive',
  },
  loading: {
    icon: Loader2,
    defaultTitle: 'Loading...',
    defaultDescription: 'Please wait while we fetch your data.',
    iconColor: 'text-primary',
  },
  empty: {
    icon: Inbox,
    defaultTitle: 'Nothing here yet',
    defaultDescription: 'Get started by creating your first item.',
    iconColor: 'text-muted-foreground',
  },
  'not-found': {
    icon: FileX,
    defaultTitle: 'Not found',
    defaultDescription: "The item you're looking for doesn't exist or has been removed.",
    iconColor: 'text-muted-foreground',
  },
}

const iconSizeStyles = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
}

/**
 * EmptyState - Display placeholder UI for empty, loading, or error states
 *
 * @example
 * ```tsx
 * <EmptyState
 *   variant="no-results"
 *   action={{
 *     label: "Clear filters",
 *     onClick: () => clearFilters()
 *   }}
 * />
 * ```
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      variant = 'no-data',
      title,
      description,
      icon: customIcon,
      iconSize = 'lg',
      action,
      secondaryAction,
      animate = true,
      compact = false,
      className,
      ...props
    },
    ref,
  ) => {
    const config = variantConfig[variant]
    const IconComponent = config.icon
    const isLoading = variant === 'loading'

    const iconElement = customIcon ? (
      typeof customIcon === 'function' ? (
        React.createElement(customIcon as LucideIcon, {
          className: cn(iconSizeStyles[iconSize], config.iconColor, isLoading && 'animate-spin'),
        })
      ) : (
        customIcon
      )
    ) : (
      <IconComponent
        className={cn(iconSizeStyles[iconSize], config.iconColor, isLoading && 'animate-spin')}
        aria-hidden="true"
      />
    )

    const content = (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center',
          compact ? 'gap-3 py-8' : 'gap-4 py-12',
          className,
        )}
        role={isLoading ? 'status' : variant === 'error' ? 'alert' : 'status'}
        aria-live={isLoading ? 'polite' : variant === 'error' ? 'assertive' : 'polite'}
        aria-busy={isLoading}
        {...props}
      >
        {/* Icon */}
        <div className="shrink-0">{iconElement}</div>

        {/* Text content */}
        <div className={cn('max-w-md space-y-2', compact && 'max-w-sm')}>
          <h3 className={cn('font-semibold tracking-tight', compact ? 'text-base' : 'text-lg')}>
            {title || config.defaultTitle}
          </h3>
          <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
            {description || config.defaultDescription}
          </p>
        </div>

        {/* Actions */}
        {(action || secondaryAction) && !isLoading && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {action && (
              <Button
                variant={action.variant || 'default'}
                onClick={action.onClick}
                size={compact ? 'sm' : 'default'}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || 'outline'}
                onClick={secondaryAction.onClick}
                size={compact ? 'sm' : 'default'}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    )

    if (!animate || isLoading) {
      return content
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {content}
      </motion.div>
    )
  },
)

EmptyState.displayName = 'EmptyState'
