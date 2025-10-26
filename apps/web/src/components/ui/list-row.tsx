'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type ListRowProps = {
  dotColor?: string
  label: React.ReactNode
  value?: React.ReactNode
  sublabel?: React.ReactNode
  href?: string
  className?: string
}

export function ListRow({ dotColor, label, value, sublabel, href, className }: ListRowProps) {
  const Row = (
    <div className={cn('group flex items-start justify-between rounded-xl px-3 py-2.5 hover:bg-muted transition-colors', className)}>
      <div className="flex items-start gap-2 min-w-0">
        {dotColor && <span className="mt-1 size-2 rounded-full" style={{ background: dotColor }} />}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{label}</div>
          {sublabel && <div className="text-xs text-muted-foreground truncate">{sublabel}</div>}
        </div>
      </div>
      {value && <div className="ml-3 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground group-hover:text-foreground">{value}</div>}
    </div>
  )

  if (href) return <Link href={href} className="block">{Row}</Link>
  return Row
}
