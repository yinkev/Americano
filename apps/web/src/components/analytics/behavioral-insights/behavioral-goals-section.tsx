'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Target, Plus } from 'lucide-react'

// This is a placeholder for the new component.
// The actual implementation will be done in the next steps.

const mockGoals = [
    { id: '1', title: 'Increase Retention to 85%', progress: 75, color: 'oklch(0.75 0.12 240)' },
    { id: '2', title: 'Study for 5 hours this week', progress: 40, color: 'oklch(0.70 0.15 150)' },
    { id: '3', title: 'Complete 3 missions in a row', progress: 66, color: 'oklch(0.78 0.13 340)' },
]

export function BehavioralGoalsSection() {
    return (
        <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-card rounded-xl">
                        <Target className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-heading font-bold">Your Goals</CardTitle>
                </div>
                <Button size="lg" className="rounded-full font-bold text-lg shadow-none gap-2"><Plus /> New Goal</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {mockGoals.map(goal => (
                    <div key={goal.id} className="p-4 rounded-xl bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-lg font-semibold">{goal.title}</p>
                            <p className="text-lg font-bold" style={{color: goal.color}}>{goal.progress}%</p>
                        </div>
                        <Progress value={goal.progress} style={{backgroundColor: goal.color, '--progress-background': goal.color}} />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
