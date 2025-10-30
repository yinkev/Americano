/**
 * GraphUpdateNotification - Real-time update notification banner
 *
 * Story 3.2 Task 8.3: Real-time graph updates notification
 *
 * Features:
 * - Displays when new graph data is available (polling detection)
 * - "Refresh" button to load new data
 * - Dismiss button to hide notification
 * - Smooth slide-in animation
 * - Glassmorphism design matching platform aesthetics
 *
 * Usage:
 * ```tsx
 * {showNotification && (
 *   <GraphUpdateNotification
 *     onRefresh={handleRefresh}
 *     onDismiss={handleDismiss}
 *   />
 * )}
 * ```
 */

'use client'

import { useEffect, useState } from 'react'

export interface GraphUpdateNotificationProps {
  onRefresh: () => void
  onDismiss: () => void
}

export default function GraphUpdateNotification({
  onRefresh,
  onDismiss,
}: GraphUpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Slide in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for slide-out animation
  }

  const handleRefresh = () => {
    setIsVisible(false)
    setTimeout(onRefresh, 300) // Wait for slide-out animation
  }

  return (
    <div
      className={`
        w-full px-6 py-4 border-b transition-all duration-300
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
      `}
      style={{
        backgroundColor: 'oklch(0.95 0.1 120)',
        borderColor: 'oklch(0.8 0.15 120)',
      }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Message */}
        <div className="flex items-center gap-3">
          {/* Icon */}
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: 'oklch(0.5 0.15 120)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          {/* Text */}
          <div>
            <div className="font-semibold text-sm" style={{ color: 'oklch(0.3 0.1 120)' }}>
              New concepts available
            </div>
            <div className="text-xs" style={{ color: 'oklch(0.4 0.08 120)' }}>
              The knowledge graph has been updated with new content
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
            style={{
              backgroundColor: 'oklch(0.6 0.15 120)',
              color: 'white',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.5 0.15 120)'
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.6 0.15 120)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Graph
          </button>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'oklch(0.5 0.08 120)' }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.9 0.1 120)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="Dismiss notification"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
