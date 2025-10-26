'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion } from 'motion/react'
import { buttonIconVariants, springResponsive } from '@/lib/design-system'

/**
 * ThemeToggle Component
 *
 * Apple-style theme switcher with smooth icon transitions
 * - Respects system preference by default
 * - Accessible (ARIA labels, keyboard navigation)
 * - Subtle hover/tap effects using design system animations
 *
 * Usage:
 * ```tsx
 * import { ThemeToggle } from '@/components/theme-toggle'
 *
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder with same dimensions to prevent layout shift
    return (
      <div className="size-10 rounded-xl" aria-hidden="true" />
    )
  }

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative flex items-center justify-center size-10 rounded-xl bg-card  border border-border/50 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      variants={buttonIconVariants}
    >
      {/* Sun Icon (Light Mode) */}
      <motion.div
        initial={false}
        animate={{
          scale: isDark ? 0 : 1,
          rotate: isDark ? 90 : 0,
          opacity: isDark ? 0 : 1,
        }}
        transition={springResponsive}
        className="absolute"
      >
        <Sun className="size-5 text-foreground" />
      </motion.div>

      {/* Moon Icon (Dark Mode) */}
      <motion.div
        initial={false}
        animate={{
          scale: isDark ? 1 : 0,
          rotate: isDark ? 0 : -90,
          opacity: isDark ? 1 : 0,
        }}
        transition={springResponsive}
        className="absolute"
      >
        <Moon className="size-5 text-foreground" />
      </motion.div>
    </motion.button>
  )
}
