'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

type ProgressVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'

type ProgressProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
  className?: string
  value?: number
  variant?: ProgressVariant
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, variant, ...props }, ref) => {
  const autoVariant: ProgressVariant = value >= 80 ? 'success' : value >= 50 ? 'warning' : 'danger'
  const v = variant ?? autoVariant
  const color =
    v === 'success'
      ? 'bg-success'
      : v === 'warning'
      ? 'bg-warning'
      : v === 'danger'
      ? 'bg-destructive'
      : v === 'info'
      ? 'bg-info'
      : v === 'secondary'
      ? 'bg-secondary'
      : 'bg-primary'

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full w-full flex-1 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out motion-reduce:transition-none', color)}
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
