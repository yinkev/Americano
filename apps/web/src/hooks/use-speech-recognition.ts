"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseSpeechRecognitionOptions {
  onTranscriptChange?: (transcript: string) => void
  onEnd?: (finalTranscript: string) => void
  language?: string
  continuous?: boolean
  interimResults?: boolean
}

interface UseSpeechRecognitionReturn {
  isListening: boolean
  transcript: string
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  error: string | null
}

/**
 * useSpeechRecognition - Browser Speech Recognition API hook
 *
 * Features:
 * - Real-time speech-to-text using Web Speech API
 * - Auto-submit on speech end
 * - Fallback detection for unsupported browsers
 * - Interim results support for live feedback
 *
 * Browser Support:
 * - Chrome/Edge: Full support
 * - Safari: Supported on iOS 14.5+
 * - Firefox: Not supported (returns isSupported: false)
 */
export function useSpeechRecognition({
  onTranscriptChange,
  onEnd,
  language = "en-US",
  continuous = false,
  interimResults = true,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check browser support
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.maxAlternatives = 1

    // Handle results
    recognition.onresult = (event) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcriptText = result[0].transcript

        if (result.isFinal) {
          finalTranscript += transcriptText
        } else {
          interimTranscript += transcriptText
        }
      }

      const currentTranscript = finalTranscript || interimTranscript
      setTranscript(currentTranscript)
      onTranscriptChange?.(currentTranscript)
    }

    // Handle end of speech
    recognition.onend = () => {
      setIsListening(false)
      onEnd?.(transcript)
    }

    // Handle errors
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      setIsListening(false)

      const errorMessages: Record<string, string> = {
        "no-speech": "No speech detected. Please try again.",
        "audio-capture": "Microphone access denied or unavailable.",
        "not-allowed": "Microphone permission denied.",
        "network": "Network error. Please check your connection.",
        "aborted": "Speech recognition aborted.",
        "language-not-supported": "Language not supported.",
      }

      setError(errorMessages[event.error] || "Speech recognition failed. Please try again.")

      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000)
    }

    // Handle speech start
    recognition.onspeechstart = () => {
      setError(null)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [isSupported, language, continuous, interimResults, onTranscriptChange, onEnd, transcript])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.")
      return
    }

    if (recognitionRef.current && !isListening) {
      try {
        setTranscript("")
        setError(null)
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error("Error starting speech recognition:", err)
        setError("Failed to start speech recognition. Please try again.")
      }
    }
  }, [isSupported, isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    error,
  }
}

// Type declarations for browsers that support SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }

  interface SpeechRecognition extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    start(): void
    stop(): void
    abort(): void
    onresult: (event: SpeechRecognitionEvent) => void
    onerror: (event: SpeechRecognitionErrorEvent) => void
    onend: () => void
    onspeechstart: () => void
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number
    results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionResultList {
    readonly length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean
    readonly length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message?: string
  }
}
