'use client'

import * as React from 'react'
import { motion } from 'motion/react'

import { cn } from '@/lib/utils'
import { cardVariants as animationVariants, getAnimationConfig } from '@/lib/animation-variants'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Interactive cards have hover lift + scale effect (for clickable cards)
   * Static cards have subtle shadow-only effect (for info cards)
   * Glow cards have OKLCH-based glow effect
   */
  interactive?: 'interactive' | 'static' | 'glow' | false
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, onClick, ...props }, ref) => {
    // Determine if card should be interactive
    const isInteractive = interactive !== false || !!onClick

    // Select animation variant
    const variant = interactive === 'glow'
      ? animationVariants.glow
      : interactive === 'static'
        ? animationVariants.static
        : interactive === 'interactive' || isInteractive
          ? animationVariants.interactive
          : null

    if (!variant) {
      // No animation - static card
      return (
        <div
          ref={ref}
          className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}
          onClick={onClick}
          {...props}
        />
      )
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl border bg-card text-card-foreground shadow',
          isInteractive && 'cursor-pointer',
          className
        )}
        onClick={onClick}
        initial="rest"
        whileHover="hover"
        variants={{
          rest: getAnimationConfig(variant.rest),
          hover: getAnimationConfig(variant.hover),
        }}
        {...props}
      />
    )
  },
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ),
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
