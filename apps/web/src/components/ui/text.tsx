import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Typography System Component
 *
 * Standardized typography following 8px grid and design system tokens.
 * Based on research: Linear, Notion, Stripe design systems.
 *
 * Variants:
 * - h1: Large heading (4xl, 36px) for page titles
 * - h2: Medium heading (2xl, 24px) for section titles
 * - h3: Small heading (xl, 20px) for subsections
 * - body: Body text (base, 16px) for main content
 * - caption: Small text (sm, 14px) for labels and hints
 */

const textVariants = cva('', {
  variants: {
    variant: {
      h1: 'text-4xl font-heading font-bold leading-tight tracking-tight',
      h2: 'text-2xl font-heading font-bold leading-tight',
      h3: 'text-xl font-heading font-semibold leading-snug',
      body: 'text-base font-sans leading-relaxed',
      caption: 'text-sm font-sans leading-normal',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
})

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div'
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, variant, as, ...props }, ref) => {
    // Map variant to semantic HTML element if 'as' not specified
    const Component = as || (variant?.startsWith('h') ? (variant as 'h1' | 'h2' | 'h3') : 'p')

    return React.createElement(Component, {
      className: cn(textVariants({ variant }), className),
      ref,
      ...props,
    })
  }
)

Text.displayName = 'Text'

export { Text, textVariants }
