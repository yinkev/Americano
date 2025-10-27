'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock } from 'lucide-react'

export function ExamCountdown() {
  // Mock exam date - 90 days from now
  const examDate = new Date()
  examDate.setDate(examDate.getDate() + 90)
  const daysRemaining = 90

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          Exam Countdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-center space-y-4">
        <div>
          <div className="text-3xl font-bold text-primary">{daysRemaining}</div>
          <p className="text-sm text-muted-foreground mt-1">Days Until USMLE Step 1</p>
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {examDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
