'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion, type HTMLMotionProps } from 'motion/react'
import { Check, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { buttonVariants as animationVariants, getAnimationConfig } from '@/lib/animation-variants'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        // Playful gamification variants
        success: 'bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/20',
        info: 'bg-info text-info-foreground hover:bg-info/90 focus-visible:ring-info/20',
        energy: 'bg-energy text-energy-foreground hover:bg-energy/90 focus-visible:ring-energy/20',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends Omit<
      React.ComponentProps<'button'>,
      | 'onAnimationStart'
      | 'onDragStart'
      | 'onDragEnd'
      | 'onDrag'
      | 'onDirectionLock'
      | 'onDragTransitionEnd'
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  success?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, success = false, disabled, children, ...props }, ref) => {
    // Extract any potential conflicting props to ensure they don't get spread
    const {
      onAnimationStart: _onAnimationStart,
      onDragStart: _onDragStart,
      onDragEnd: _onDragEnd,
      onDrag: _onDrag,
      ...safeProps
    } = props as any
    const [showSuccess, setShowSuccess] = React.useState(false)

    // Handle success state animation
    React.useEffect(() => {
      if (success) {
        setShowSuccess(true)
        const timer = setTimeout(() => setShowSuccess(false), 2000)
        return () => clearTimeout(timer)
      }
    }, [success])

    // Determine current state
    const isDisabled = disabled || loading
    const currentIcon = showSuccess ? <Check className="size-4" /> : loading ? <Loader2 className="size-4 animate-spin" /> : null

    // Motion animation props (only when not asChild)
    const motionProps = asChild
      ? {}
      : {
          whileHover: !isDisabled ? getAnimationConfig(animationVariants.hover) : undefined,
          whileTap: !isDisabled ? getAnimationConfig(animationVariants.tap) : undefined,
          animate: showSuccess
            ? getAnimationConfig(animationVariants.success)
            : loading
              ? getAnimationConfig(animationVariants.loading)
              : undefined,
        }

    if (asChild) {
      return (
        <Slot
          ref={ref}
          data-slot="button"
          className={cn(buttonVariants({ variant, size, className }))}
          {...safeProps}
        >
          {children}
        </Slot>
      )
    }

    return (
      <motion.button
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        {...motionProps}
        {...safeProps}
      >
        {currentIcon}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
