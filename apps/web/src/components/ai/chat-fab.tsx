'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X, Minimize2, Maximize2, Send } from 'lucide-react'

export function ChatFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState('')

  // Keyboard shortcut: Ctrl+/ or Cmd+/ to toggle chat
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [isOpen])

  return (
    <>
      {/* Floating Action Button - Bottom-right desktop, bottom-center mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-50 rounded-full shadow-lg transition-all duration-200
                   ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                   bg-[oklch(0.7_0.15_230)] text-white
                   hover:bg-[oklch(0.65_0.15_230)] hover:shadow-xl hover:scale-110
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white
                   bottom-6 right-6 md:bottom-8 md:right-8 lg:bottom-10 lg:right-10
                   size-14 md:size-16`}
        aria-label="Open AI Chat (Ctrl+/)"
        type="button"
      >
        <MessageCircle className="size-6 md:size-7 mx-auto" />
      </button>

      {/* Chat Panel - Slide-out from bottom-right */}
      <div
        className={`fixed z-50 transition-all duration-300 ease-out
                   ${isOpen ? 'translate-x-0 translate-y-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
                   bottom-6 right-6 md:bottom-8 md:right-8 lg:bottom-10 lg:right-10
                   ${isMinimized ? 'h-16' : 'h-[500px]'}
                   w-[calc(100vw-3rem)] md:w-96
                   rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_12px_48px_rgba(31,38,135,0.2)]
                   flex flex-col overflow-hidden`}
        role="dialog"
        aria-label="AI Chat Assistant"
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-[oklch(0.922_0_0)] bg-white/60">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-2">
              <MessageCircle className="size-5 text-[oklch(0.7_0.15_230)]" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-semibold text-[oklch(0.145_0_0)]">
                AI Assistant
              </h3>
              <p className="text-xs text-[oklch(0.556_0_0)]">
                Ask me anything
              </p>
            </div>
          </div>

          {/* Header Actions - Min 44px touch targets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="size-9 flex items-center justify-center rounded-lg
                         text-[oklch(0.556_0_0)] hover:text-[oklch(0.145_0_0)] hover:bg-white/80
                         transition-colors duration-200
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]"
              aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}
              type="button"
            >
              {isMinimized ? <Maximize2 className="size-4" /> : <Minimize2 className="size-4" />}
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="size-9 flex items-center justify-center rounded-lg
                         text-[oklch(0.556_0_0)] hover:text-[oklch(0.7_0.15_15)] hover:bg-[oklch(0.7_0.15_15)]/10
                         transition-colors duration-200
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]"
              aria-label="Close chat"
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Chat Content - Hidden when minimized */}
        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Welcome Message */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 size-8 rounded-full bg-[oklch(0.7_0.15_230)]/10 flex items-center justify-center">
                  <MessageCircle className="size-4 text-[oklch(0.7_0.15_230)]" />
                </div>
                <div className="flex-1 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40 p-3">
                  <p className="text-sm text-[oklch(0.145_0_0)] leading-relaxed">
                    Hi! I'm your AI study assistant. I can help you with:
                  </p>
                  <ul className="text-sm text-[oklch(0.556_0_0)] mt-2 space-y-1 list-disc list-inside">
                    <li>Explaining medical concepts</li>
                    <li>Creating flashcards</li>
                    <li>Answering questions about your lectures</li>
                    <li>Study tips and strategies</li>
                  </ul>
                </div>
              </div>

              {/* Placeholder for future messages */}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-[oklch(0.922_0_0)] bg-white/60">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  // TODO: Handle message send
                  console.log('Message:', message)
                  setMessage('')
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 rounded-lg border border-[oklch(0.922_0_0)]
                             bg-white text-[oklch(0.145_0_0)] placeholder:text-[oklch(0.556_0_0)]
                             focus:outline-none focus:ring-2 focus:ring-[oklch(0.7_0.15_230)] focus:border-transparent
                             min-h-[44px]"
                  aria-label="Chat message"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="size-11 flex items-center justify-center rounded-lg
                             bg-[oklch(0.7_0.15_230)] text-white
                             hover:bg-[oklch(0.65_0.15_230)] disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors duration-200
                             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label="Send message"
                >
                  <Send className="size-5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  )
}
