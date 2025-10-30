'use client'

import React, { useEffect, useState } from 'react'

export function WelcomeTour() {
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('has-seen-tour')
    if (!hasSeenTour) {
      setShowTour(true)
    }
  }, [])

  const completeTour = () => {
    localStorage.setItem('has-seen-tour', 'true')
    setShowTour(false)
  }

  if (!showTour) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md p-6 space-y-4">
        <h2 className="text-2xl font-bold">Welcome to Americano!</h2>
        <p className="text-muted-foreground">
          Let's take a quick tour of your adaptive learning dashboard.
        </p>
        <button
          onClick={completeTour}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Start Tour
        </button>
      </div>
    </div>
  )
}
