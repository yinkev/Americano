'use client'

/**
 * AppShell - Main Layout Wrapper
 * Apple "Think Different" aesthetic with clean, minimal layout
 *
 * Features:
 * - Responsive sidebar (collapsible on mobile)
 * - Optional top header
 * - Smooth page transitions
 * - Design system spacing and animations
 */

import { motion, AnimatePresence } from 'motion/react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { TopHeader } from './top-header'
import { springSubtle, pageFadeVariants, spacing } from '@/lib/design-system'
import { Toaster } from '@/components/ui/sonner'
import { ChatFAB } from '@/components/ai/chat-fab'

export interface AppShellProps {
  children: React.ReactNode
  showSidebar?: boolean
  showHeader?: boolean
  className?: string
}

export function AppShell({
  children,
  showSidebar = true,
  showHeader = true,
  className = '',
}: AppShellProps) {
  return (
    <SidebarProvider>
      {showSidebar && <AppSidebar />}

      <SidebarInset className={className}>
        <div className="flex min-h-screen flex-col">
          {/* Optional Top Header */}
          <AnimatePresence mode="wait">
            {showHeader && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', ...springSubtle }}
              >
                <TopHeader />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <motion.main
            className="flex-1"
            style={{
              padding: spacing[8],
              paddingTop: showHeader ? spacing[4] : spacing[8],
            }}
            variants={pageFadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </motion.main>
        </div>
      </SidebarInset>

      {/* Global UI Elements */}
      <ChatFAB />
      <Toaster />
    </SidebarProvider>
  )
}
