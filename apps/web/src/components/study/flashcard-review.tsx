'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, ThumbsDown, Meh, ThumbsUp, Sparkles } from 'lucide-react'

export interface FlashCard {
  id: string
  front: string
  back: string
  cardType: 'BASIC' | 'CLOZE' | 'CLINICAL_REASONING'
}

interface FlashcardReviewProps {
  cards: FlashCard[]
  onReview: (cardId: string, rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => void
  onComplete: () => void
}

export function FlashcardReview({ cards, onReview, onComplete }: FlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)

  if (cards.length === 0) {
    return (
        <div className="text-center p-8">
            <p className="text-lg font-semibold text-muted-foreground">No cards to review for this objective.</p>
            <Button onClick={onComplete} className="mt-4 rounded-full text-lg px-6 py-3">Continue</Button>
        </div>
    )
  }

  const currentCard = cards[currentIndex]

  const handleRating = (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    onReview(currentCard.id, rating)
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowBack(false)
    } else {
      onComplete()
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-2xl font-heading font-bold">Flashcard Review</h3>
            <Badge className="text-lg font-bold px-4 py-2 rounded-full bg-card text-primary border-2 border-primary/20">
                {currentIndex + 1} / {cards.length}
            </Badge>
        </div>

        {/* I would add a motion.div here for a flip animation */}
        <Card className={`p-8 rounded-xl shadow-none min-h-[300px] flex flex-col justify-center items-center text-center transition-all duration-500 ${showBack ? 'bg-card' : 'bg-card'}`}>
            <p className="text-3xl font-bold">{showBack ? currentCard.back : currentCard.front}</p>
        </Card>

        {!showBack ? (
            <Button onClick={() => setShowBack(true)} className="w-full rounded-full text-xl py-8 gap-3 shadow-none">
                <Eye className="w-6 h-6" />
                Reveal Answer
            </Button>
        ) : (
            <div className="grid grid-cols-4 gap-4">
                <Button onClick={() => handleRating('AGAIN')} variant="outline" className="rounded-full text-lg py-8 gap-2 hover:bg-card hover:text-red-500"><ThumbsDown /> Again</Button>
                <Button onClick={() => handleRating('HARD')} variant="outline" className="rounded-full text-lg py-8 gap-2 hover:bg-card hover:text-amber-500"><Meh /> Hard</Button>
                <Button onClick={() => handleRating('GOOD')} variant="outline" className="rounded-full text-lg py-8 gap-2 hover:bg-card hover:text-green-500"><ThumbsUp /> Good</Button>
                <Button onClick={() => handleRating('EASY')} variant="outline" className="rounded-full text-lg py-8 gap-2 hover:bg-card hover:text-sky-500"><Sparkles /> Easy</Button>
            </div>
        )}
    </div>
  )
}
