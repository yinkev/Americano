'use client'

import { Loader2, Mic, MicOff, Search, X } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { cn } from '@/lib/utils'

interface SearchBarMobileProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (value: string) => void
  isLoading?: boolean
  placeholder?: string
  className?: string
  autoFocus?: boolean
  enableVoiceSearch?: boolean
}

/**
 * SearchBarMobile - Mobile-optimized search input with voice search
 *
 * Features:
 * - Full-width layout optimized for mobile screens
 * - Large touch targets (min 44px) for better mobile UX
 * - Voice search integration using Browser Speech API
 * - Pull-to-refresh compatible
 * - Accessible with ARIA labels
 */
export function SearchBarMobile({
  value,
  onChange,
  onSearch,
  isLoading = false,
  placeholder = 'Search lectures, concepts...',
  className,
  autoFocus = false,
  enableVoiceSearch = true,
}: SearchBarMobileProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    error: speechError,
  } = useSpeechRecognition({
    onTranscriptChange: (text) => {
      onChange(text)
    },
    onEnd: (finalTranscript) => {
      if (finalTranscript) {
        onSearch?.(finalTranscript)
      }
    },
  })

  // Auto-focus on mount (mobile-friendly)
  React.useEffect(() => {
    if (autoFocus && inputRef.current && window.innerWidth >= 768) {
      // Only auto-focus on tablets and larger to avoid unwanted keyboard pop-up on phones
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Update input value with voice transcript
  React.useEffect(() => {
    if (transcript && isListening) {
      onChange(transcript)
    }
  }, [transcript, isListening, onChange])

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onSearch?.(value)
      inputRef.current?.blur() // Hide keyboard on mobile after search
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full', className)}>
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute left-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="size-5 text-muted-foreground animate-spin" aria-label="Loading" />
          ) : (
            <Search className="size-5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        {/* Input Field - Mobile Optimized */}
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Search medical content"
          aria-describedby={isListening ? 'voice-search-active' : undefined}
          className={cn(
            // Mobile-first sizing: min 44px height for touch targets
            'h-14 pl-12 pr-24 rounded-2xl text-base',
            'bg-white/90 backdrop-blur-md border-2 border-white/60',
            'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50',
            'placeholder:text-muted-foreground/70',
            // Prevent zoom on focus (iOS)
            'text-[16px] md:text-base',
            // Voice search active state
            isListening && 'ring-2 ring-primary/50 border-primary/70 animate-pulse',
          )}
        />

        {/* Action Buttons - Right Side */}
        <div className="absolute right-2 flex items-center gap-1">
          {/* Voice Search Button */}
          {enableVoiceSearch && isSupported && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleVoiceToggle}
              aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
              aria-pressed={isListening}
              className={cn(
                // Min 44px touch target
                'h-11 w-11 rounded-xl transition-colors',
                isListening
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'hover:bg-white/80',
              )}
            >
              {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </Button>
          )}

          {/* Clear Button */}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              aria-label="Clear search"
              className="h-11 w-11 rounded-xl hover:bg-white/80"
            >
              <X className="size-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Voice Search Status */}
      {isListening && (
        <div
          id="voice-search-active"
          className="mt-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium"
          role="status"
          aria-live="polite"
        >
          Listening... Speak your search query
        </div>
      )}

      {/* Voice Search Error */}
      {speechError && (
        <div
          className="mt-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-sm"
          role="alert"
        >
          {speechError}
        </div>
      )}
    </form>
  )
}
