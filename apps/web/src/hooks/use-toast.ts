/**
<<<<<<< HEAD
 * Toast Hook
 * Simple toast notification hook for user feedback
 */

'use client'

import { toast as sonnerToast } from 'sonner'

interface ToastProps {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    if (variant === 'destructive') {
      sonnerToast.error(title, {
        description,
      })
    } else {
      sonnerToast.success(title, {
        description,
      })
    }
  }

  return { toast }
=======
 * Temporary stub for useToast hook
 * TODO: Install shadcn/ui toast component: npx shadcn@latest add toast
 */

export function useToast() {
  return {
    toast: (options: {
      title?: string
      description?: string
      variant?: "default" | "destructive"
    }) => {
      // Stub implementation - just log for now
      console.log('[Toast]', options.title, options.description)
    }
  }
>>>>>>> origin/main
}
