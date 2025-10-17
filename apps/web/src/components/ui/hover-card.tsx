/**
 * Hover Card Component
 * A floating card that appears on hover
 */

'use client'

import * as React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface HoverCardProps {
  children: React.ReactNode
  className?: string
}

interface HoverCardContentProps {
  children: React.ReactNode
  className?: string
}

interface HoverCardTriggerProps {
  asChild?: boolean
}

export const HoverCard = React.forwardRef<HTMLDivElement, HoverCardProps>(
  ({ children, className, ...props }: HoverCardProps, ref) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
    <div
      ref={ref}
      className={cn(
        'relative inline-block',
        'transition-all duration-200',
        isOpen ? 'opacity-100' : 'opacity-0 invisible hover:opacity-100',
        className
      )}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      {...props}
    >
      {children}
    </div>
  )
})
HoverCard.displayName = 'HoverCard'

export const HoverCardTrigger = React.forwardRef<HTMLButtonElement, HoverCardTriggerProps & { children?: React.ReactNode }>(
  ({ asChild, children, ...props }, ref) => {
    const Component = asChild ? 'span' : 'button'
    return (
      <Component ref={ref as any} {...props}>
        {children}
      </Component>
    )
  }
)
HoverCardTrigger.displayName = 'HoverCardTrigger'

HoverCard.Trigger = HoverCardTrigger

export const HoverCardContent = React.forwardRef<
  HTMLDivElement,
  HoverCardContentProps
>(({ children, className, ...props }: HoverCardContentProps, ref) => {
    return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50',
        'bg-white/95 backdrop-blur-xl',
        'border border-white/20 rounded-lg shadow-xl',
        'p-4',
        'min-w-[200px]',
        'invisible opacity-0 transition-all duration-200',
        'hover:opacity-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
    )
})
HoverCardContent.displayName = 'HoverCardContent'

HoverCard.Content = HoverCardContent

export default HoverCard