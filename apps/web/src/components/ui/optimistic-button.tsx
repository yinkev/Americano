/**
 * Optimistic Button Component
 * Wave 2: Optimistic Updates
 *
 * Button with built-in optimistic update support using React 19 useTransition
 * Provides instant feedback with loading states and automatic rollback
 */

'use client'

import { Loader2 } from 'lucide-react'
import { type ComponentProps, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OptimisticButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  onClick: () => Promise<void> | void
  loadingText?: string
  showSpinner?: boolean
}

/**
 * Button that uses React 19 useTransition for non-blocking updates
 *
 * @example
 * ```tsx
 * <OptimisticButton
 *   onClick={async () => {
 *     await acknowledgeInsight(id)
 *   }}
 *   loadingText="Acknowledging..."
 * >
 *   Acknowledge Insight
 * </OptimisticButton>
 * ```
 */
export function OptimisticButton({
  onClick,
  loadingText,
  showSpinner = true,
  children,
  disabled,
  className,
  ...props
}: OptimisticButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      await onClick()
    })
  }

  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={disabled || isPending}
      className={cn(isPending && 'opacity-70', className)}
    >
      {isPending && showSpinner && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending && loadingText ? loadingText : children}
    </Button>
  )
}
