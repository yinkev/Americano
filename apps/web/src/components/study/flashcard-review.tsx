'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, ThumbsDown, Minus, ThumbsUp, Sparkles } from 'lucide-react'
import { typography, colors } from '@/lib/design-tokens'

export interface FlashCard {
  id: string
  front: string
  back: string
  cardType: 'BASIC' | 'CLOZE' | 'CLINICAL_REASONING'
}

interface FlashcardReviewProps {
  cards: FlashCard[]
  onReview: (
    cardId: string,
    rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY',
    timeSpentMs: number,
  ) => Promise<void>
  onComplete: () => void
}

export function FlashcardReview({ cards, onReview, onComplete }: FlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [startTime] = useState(Date.now())

  if (cards.length === 0) {
    return (
      <Card
        className="p-8 border border-border rounded-xl shadow-sm text-center"
        style={{
          background: 'oklch(1 0 0 / 0.95)',
        }}
      >
        <p style={{ color: 'oklch(0.5 0.1 250)' }}>No cards available for review</p>
        <Button onClick={onComplete} className="mt-4 min-h-[44px]">
          Continue
        </Button>
      </Card>
    )
  }

  const currentCard = cards[currentIndex]

  const handleRating = async (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    setReviewing(true)
    const timeSpentMs = Date.now() - startTime

    try {
      await onReview(currentCard.id, rating, timeSpentMs)

      // Move to next card or complete
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowBack(false)
      } else {
        onComplete()
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
    } finally {
      setReviewing(false)
    }
  }

  return (
    <Card className="bg-card p-6 border border-border rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline">Card {currentIndex + 1} of {cards.length}</Badge>
        <span className={`${typography.body.small} text-muted-foreground`}>
          {cards.length - currentIndex - 1} remaining
        </span>
      </div>

      <div className="min-h-[200px] flex flex-col justify-center mb-4">
        <p className={`${typography.body.base} text-muted-foreground mb-2`}>Question:</p>
        <p className={`${typography.heading.h3} text-foreground`}>{currentCard.front}</p>
        {showBack && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className={`${typography.body.base} text-muted-foreground mb-2`}>Answer:</p>
            <p className={`${typography.heading.h3} text-foreground`}>{currentCard.back}</p>
          </div>
        )}
      </div>

      {!showBack ? (
        <Button
          onClick={() => setShowBack(true)}
          className="w-full compact-button"
        >
          <Eye className="mr-2 h-4 w-4" />
          Reveal Answer
        </Button>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            onClick={() => handleRating('AGAIN')}
            disabled={reviewing}
            variant="outline"
            className="compact-button"
          >
            <ThumbsDown className="mr-1 h-4 w-4" />
            Again
          </Button>
          <Button
            onClick={() => handleRating('HARD')}
            disabled={reviewing}
            variant="outline"
            className="compact-button"
          >
            <Minus className="mr-1 h-4 w-4" />
            Hard
          </Button>
          <Button
            onClick={() => handleRating('GOOD')}
            disabled={reviewing}
            variant="outline"
            className="compact-button"
          >
            <ThumbsUp className="mr-1 h-4 w-4" />
            Good
          </Button>
          <Button
            onClick={() => handleRating('EASY')}
            disabled={reviewing}
            variant="outline"
            className="compact-button"
          >
            <Sparkles className="mr-1 h-4 w-4" />
            Easy
          </Button>
        </div>
      )}
    </Card>
  )
