'use client'

import React from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AIChatFAB() {
  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
      onClick={() => {
        // Open AI chat interface
        window.location.href = '/chat'
      }}
      aria-label="Open AI Chat"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  )
}
