'use client'

import React from 'react'
import { CheckCircle } from 'lucide-react'

interface CelebrationToastProps {
  message: string
  onClose: () => void
}

export function CelebrationToast({ message, onClose }: CelebrationToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 bg-success text-success-foreground rounded-lg shadow-lg p-4 flex items-center gap-3 animate-in slide-in-from-top">
      <CheckCircle className="h-5 w-5" />
      <p className="font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-auto hover:opacity-70 transition-opacity"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  )
}

/**
 * Helper function to show a celebration toast
 * Note: This is a placeholder - full toast system should use react-hot-toast or similar
 */
export function showCelebration(title: string, message?: string) {
  // For now, just log to console
  // TODO: Integrate with proper toast library (react-hot-toast, sonner, etc.)
  console.log(`🎉 ${title}${message ? ': ' + message : ''}`)
}
