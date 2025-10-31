'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MockDataBadgeProps {
  className?: string
  label?: string
}

const MOCK_MODE_DISABLED_VALUES = new Set(['0', 'false', 'off'])

export function MockDataBadge({ className, label = 'Mock data' }: MockDataBadgeProps) {
  const flag = process.env.NEXT_PUBLIC_ANALYTICS_MOCK_MODE

  if (flag && MOCK_MODE_DISABLED_VALUES.has(flag.toLowerCase())) {
    return null
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'uppercase tracking-wide text-[10px] font-semibold border-dashed bg-muted/40 text-muted-foreground',
        'px-2 py-1 rounded-full',
        className,
      )}
      aria-label="Mock data indicator"
      data-testid="mock-data-badge"
    >
      {label}
    </Badge>
  )
}
