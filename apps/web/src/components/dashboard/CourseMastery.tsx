'use client'

import { BookOpen } from 'lucide-react'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function CourseMastery() {
  const courses = [
    { name: 'Pathology', progress: 78 },
    { name: 'Pharmacology', progress: 65 },
    { name: 'Biochemistry', progress: 52 },
  ]

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          Course Mastery
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {courses.map((course) => (
          <div key={course.name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{course.name}</span>
              <span className="font-semibold">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
