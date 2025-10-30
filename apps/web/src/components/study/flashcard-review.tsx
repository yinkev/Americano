'use client'

import { Eye, Minus, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
        className="p-8 backdrop-blur-xl border-0 text-center"
        style={{
          background: 'oklch(1 0 0 / 0.95)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
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
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <Badge variant="outline" style={{ background: 'oklch(0.55 0.2 250 / 0.15)' }}>
          Card {currentIndex + 1} of {cards.length}
        </Badge>
        <span style={{ color: 'oklch(0.5 0.1 250)' }}>
          {cards.length - currentIndex - 1} remaining
        </span>
      </div>

      {/* Card Display */}
      <Card
        className="p-8 min-h-[300px] backdrop-blur-xl border-0 flex flex-col justify-center"
        style={{
          background: 'oklch(1 0 0 / 0.95)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
        }}
      >
        <div className="space-y-6">
          {/* Front */}
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'oklch(0.5 0.1 250)' }}>
              Question:
            </p>
            <p className="text-lg" style={{ color: 'oklch(0.3 0.15 250)' }}>
              {currentCard.front}
            </p>
          </div>

          {/* Back (revealed) */}
          {showBack && (
            <div className="pt-6 border-t">
              <p className="text-sm font-medium mb-2" style={{ color: 'oklch(0.5 0.1 250)' }}>
                Answer:
              </p>
              <p className="text-lg" style={{ color: 'oklch(0.3 0.15 250)' }}>
                {currentCard.back}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        {!showBack ? (
          <Button
            onClick={() => setShowBack(true)}
            className="w-full min-h-[44px]"
            size="lg"
            style={{
              background: 'oklch(0.55 0.2 250)',
              color: 'oklch(1 0 0)',
            }}
          >
            <Eye className="mr-2 h-5 w-5" />
            Reveal Answer
          </Button>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => handleRating('AGAIN')}
              disabled={reviewing}
              variant="outline"
              className="min-h-[44px]"
              style={{
                borderColor: 'oklch(0.5 0.2 0)',
                color: 'oklch(0.5 0.2 0)',
              }}
            >
              <ThumbsDown className="mr-1 h-4 w-4" />
              Again
            </Button>
            <Button
              onClick={() => handleRating('HARD')}
              disabled={reviewing}
              variant="outline"
              className="min-h-[44px]"
              style={{
                borderColor: 'oklch(0.65 0.15 40)',
                color: 'oklch(0.65 0.15 40)',
              }}
            >
              <Minus className="mr-1 h-4 w-4" />
              Hard
            </Button>
            <Button
              onClick={() => handleRating('GOOD')}
              disabled={reviewing}
              variant="outline"
              className="min-h-[44px]"
              style={{
                borderColor: 'oklch(0.65 0.2 140)',
                color: 'oklch(0.65 0.2 140)',
              }}
            >
              <ThumbsUp className="mr-1 h-4 w-4" />
              Good
            </Button>
            <Button
              onClick={() => handleRating('EASY')}
              disabled={reviewing}
              variant="outline"
              className="min-h-[44px]"
              style={{
                borderColor: 'oklch(0.55 0.2 250)',
                color: 'oklch(0.55 0.2 250)',
              }}
            >
              <Sparkles className="mr-1 h-4 w-4" />
              Easy
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
