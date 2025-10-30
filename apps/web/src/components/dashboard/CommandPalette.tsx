'use client'

import { Command } from 'lucide-react'
import React, { useEffect, useState } from 'react'

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg">
        <input
          type="text"
          placeholder="Search commands..."
          className="w-full px-4 py-3 border-b border-border bg-transparent focus:outline-none"
          autoFocus
        />
        <div className="p-2">
          {/* Command items would go here */}
          <p className="text-sm text-muted-foreground p-2">No commands found</p>
        </div>
      </div>
    </div>
  )
}
