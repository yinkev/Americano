'use client'

import React, { useEffect } from 'react'

export function KeyboardShortcuts() {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Trigger command palette
      }

      // Cmd/Ctrl + /: Open keyboard shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        // Show shortcuts modal
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  return null
}
