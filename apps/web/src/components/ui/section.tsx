'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type SectionProps = {
  title?: React.ReactNode
  icon?: React.ReactNode
  aside?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function Section({ title, icon, aside, children, className }: SectionProps) {
  return (
    <section className={cn('rounded-xl', className)}>
      {(title || aside) && (
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span className="inline-flex items-center justify-center size-7 rounded-lg bg-muted text-primary">{icon}</span>}
            {title && <h3 className="text-base font-heading font-bold tracking-tight text-foreground">{title}</h3>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}

