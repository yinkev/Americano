'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Props for the DashboardLayout component
 */
export interface DashboardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Sidebar content
   */
  sidebar?: React.ReactNode
  /**
   * Header content
   */
  header?: React.ReactNode
  /**
   * Main content
   */
  children: React.ReactNode
  /**
   * Whether sidebar is open on mobile
   */
  sidebarOpen?: boolean
  /**
   * Sidebar toggle handler
   */
  onSidebarToggle?: (open: boolean) => void
  /**
   * Whether sidebar is collapsible on desktop
   */
  collapsibleSidebar?: boolean
  /**
   * Default sidebar state on desktop
   */
  defaultSidebarOpen?: boolean
  /**
   * Loading state (shows skeleton)
   */
  loading?: boolean
  /**
   * Sidebar width (desktop)
   */
  sidebarWidth?: string
  /**
   * Whether to show mobile menu button
   */
  showMobileMenu?: boolean
  /**
   * Maximum content width
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

const maxWidthStyles = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
}

/**
 * DashboardLayoutSkeleton - Loading skeleton for dashboard layout
 */
const DashboardLayoutSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen flex-col">
      {/* Header skeleton */}
      <div className="border-b bg-background p-4">
        <div className="container flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <aside className="hidden w-64 border-r bg-background p-4 lg:block">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </aside>

        {/* Main content skeleton */}
        <main className="flex-1 overflow-auto p-6">
          <div className="container space-y-6">
            {/* Grid skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * DashboardLayout - Responsive dashboard layout with sidebar and header
 *
 * @example
 * ```tsx
 * <DashboardLayout
 *   sidebar={<AppSidebar />}
 *   header={<FilterBar />}
 * >
 *   <MetricGrid>
 *     <MetricCard title="Users" value={1234} />
 *   </MetricGrid>
 * </DashboardLayout>
 * ```
 */
export const DashboardLayout = React.forwardRef<HTMLDivElement, DashboardLayoutProps>(
  (
    {
      sidebar,
      header,
      children,
      sidebarOpen: controlledSidebarOpen,
      onSidebarToggle,
      collapsibleSidebar = false,
      defaultSidebarOpen = true,
      loading = false,
      sidebarWidth = '16rem',
      showMobileMenu = true,
      maxWidth = 'full',
      className,
      ...props
    },
    ref,
  ) => {
    // Manage sidebar state
    const [internalSidebarOpen, setInternalSidebarOpen] = React.useState(defaultSidebarOpen)
    const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

    const isSidebarOpen =
      controlledSidebarOpen !== undefined ? controlledSidebarOpen : internalSidebarOpen

    const handleSidebarToggle = React.useCallback(
      (open: boolean) => {
        if (onSidebarToggle) {
          onSidebarToggle(open)
        } else {
          setInternalSidebarOpen(open)
        }
      },
      [onSidebarToggle],
    )

    const handleMobileSidebarToggle = React.useCallback(() => {
      setMobileSidebarOpen((prev) => !prev)
    }, [])

    // Close mobile sidebar on escape
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && mobileSidebarOpen) {
          setMobileSidebarOpen(false)
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [mobileSidebarOpen])

    // Show loading skeleton
    if (loading) {
      return <DashboardLayoutSkeleton />
    }

    return (
      <div ref={ref} className={cn('flex h-screen flex-col overflow-hidden', className)} {...props}>
        {/* Header */}
        {header && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-20 border-b bg-background"
          >
            <div className="flex items-center gap-4 px-4 py-3 lg:px-6">
              {/* Mobile menu button */}
              {showMobileMenu && sidebar && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={handleMobileSidebarToggle}
                  aria-label="Toggle menu"
                  aria-expanded={mobileSidebarOpen}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}

              {/* Desktop sidebar toggle */}
              {collapsibleSidebar && sidebar && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden lg:flex"
                  onClick={() => handleSidebarToggle(!isSidebarOpen)}
                  aria-label="Toggle sidebar"
                  aria-expanded={isSidebarOpen}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}

              {/* Header content */}
              <div className="min-w-0 flex-1">{header}</div>
            </div>
          </motion.header>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop sidebar */}
          {sidebar && (
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.aside
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="hidden border-r bg-background lg:block"
                  style={{ width: sidebarWidth }}
                  role="complementary"
                  aria-label="Sidebar navigation"
                >
                  <div className="h-full overflow-auto p-4">{sidebar}</div>
                </motion.aside>
              )}
            </AnimatePresence>
          )}

          {/* Mobile sidebar overlay */}
          <AnimatePresence>
            {mobileSidebarOpen && sidebar && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-hidden="true"
                />

                {/* Mobile sidebar */}
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="fixed inset-y-0 left-0 z-50 w-72 border-r bg-background lg:hidden"
                  role="dialog"
                  aria-label="Mobile navigation menu"
                  aria-modal="true"
                >
                  <div className="flex h-full flex-col">
                    {/* Close button */}
                    <div className="flex items-center justify-between border-b p-4">
                      <h2 className="text-lg font-semibold">Menu</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMobileSidebarOpen(false)}
                        aria-label="Close menu"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Sidebar content */}
                    <div className="flex-1 overflow-auto p-4">{sidebar}</div>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main content */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 overflow-auto"
            role="main"
          >
            <div className={cn('mx-auto p-6', maxWidthStyles[maxWidth])}>{children}</div>
          </motion.main>
        </div>
      </div>
    )
  },
)

DashboardLayout.displayName = 'DashboardLayout'
