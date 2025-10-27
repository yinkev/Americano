'use client'

import React, { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Sound effect URLs (these would be hosted assets)
const SOUNDS = {
  achievement: '/sounds/achievement.mp3',
  streak: '/sounds/streak.mp3',
  complete: '/sounds/complete.mp3',
  level_up: '/sounds/level-up.mp3',
  notification: '/sounds/notification.mp3',
}

// Global sound player
let audioContext: AudioContext | null = null
let soundEnabled = true

/**
 * Play a sound effect
 */
export function playSoundEffect(soundType: keyof typeof SOUNDS) {
  if (!soundEnabled) return

  try {
    const audio = new Audio(SOUNDS[soundType])
    audio.volume = 0.3
    audio.play().catch(() => {
      // Silently fail if audio playback is blocked
    })
  } catch (error) {
    // Silently fail
  }
}

/**
 * Sound Toggle Component
 *
 * Floating action button to toggle sound effects on/off
 */
export function SoundToggle() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    // Load sound preference from localStorage
    const saved = localStorage.getItem('sound-enabled')
    if (saved !== null) {
      const isEnabled = saved === 'true'
      setEnabled(isEnabled)
      soundEnabled = isEnabled
    }
  }, [])

  const toggleSound = () => {
    const newState = !enabled
    setEnabled(newState)
    soundEnabled = newState
    localStorage.setItem('sound-enabled', String(newState))

    // Play a test sound when enabling
    if (newState) {
      playSoundEffect('notification')
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSound}
      className="fixed bottom-20 right-6 z-40 rounded-full h-12 w-12 shadow-lg bg-background/80 backdrop-blur-md border border-border/50 hover:bg-background/90"
      aria-label={enabled ? 'Disable sound effects' : 'Enable sound effects'}
    >
      {enabled ? (
        <Volume2 className="h-5 w-5" />
      ) : (
        <VolumeX className="h-5 w-5" />
      )}
    </Button>
  )
}
