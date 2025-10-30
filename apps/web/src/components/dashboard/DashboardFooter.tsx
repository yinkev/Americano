'use client'

import { Heart } from 'lucide-react'
import React from 'react'

/**
 * Dashboard Footer
 *
 * Simple footer with branding and credits
 */
export function DashboardFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-8 py-6 border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 max-w-[1600px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>for medical students</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="/about" className="hover:text-foreground transition-colors">
              About
            </a>
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="/support" className="hover:text-foreground transition-colors">
              Support
            </a>
          </div>

          <div>
            <span>&copy; {currentYear} Americano. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
