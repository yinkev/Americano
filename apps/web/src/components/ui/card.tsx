'use client'

import { motion } from 'motion/react'
import * as React from 'react'
import { cardVariants as animationVariants, getAnimationConfig } from '@/lib/animation-variants'
import { cn } from '@/lib/utils'

export interface CardProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    | 'onAnimationStart'
    | 'onDragStart'
    | 'onDragEnd'
    | 'onDrag'
    | 'onDirectionLock'
    | 'onDragTransitionEnd'
  > {
  /**
   * Interactive cards have hover lift + scale effect (for clickable cards)
   * Static cards have subtle shadow-only effect (for info cards)
   * Glow cards have OKLCH-based glow effect
   */
  interactive?: 'interactive' | 'static' | 'glow' | false
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, onClick, ...props }, ref) => {
    // Extract any potential conflicting props to ensure they don't get spread
    const {
      onAnimationStart: _onAnimationStart,
      onDragStart: _onDragStart,
      onDragEnd: _onDragEnd,
      onDrag: _onDrag,
      ...safeProps
    } = props as any

    // Determine if card should be interactive
    const isInteractive = interactive !== false || !!onClick

    // Select animation variant
    const variant =
      interactive === 'glow'
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
          className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
          onClick={onClick}
          {...safeProps}
        />
      )
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md',
          isInteractive && 'cursor-pointer',
          className,
        )}
        onClick={onClick}
        initial="rest"
        whileHover="hover"
        variants={{
          rest: getAnimationConfig(variant.rest),
          hover: getAnimationConfig(variant.hover),
        }}
        {...safeProps}
      />
    )
  },
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-4', className)} {...props} />
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
    <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-4 pt-0', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
