'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb } from 'lucide-react'

// This is a placeholder for the new component.
// The actual implementation will be done in the next steps.

const mockRecommendations = [
    { id: '1', title: 'Try shorter, more frequent study sessions', description: 'Your attention seems to wane after 30 minutes. Try 25-minute sessions with 5-minute breaks.' },
    { id: '2', title: 'Incorporate more visual aids', description: 'You seem to learn better with diagrams and charts. Try to find or create visual summaries of your lectures.' },
    { id: '3', title: 'Review flashcards in the morning', description: 'Your recall is strongest in the morning. Use this to your advantage by reviewing flashcards before noon.' },
]

export function RecommendationsPanel() {
    return (
        <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
            <CardHeader className="flex items-center gap-4">
                <div className="p-3 bg-card rounded-xl">
                    <Lightbulb className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-heading font-bold">Personalized Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {mockRecommendations.map(rec => (
                    <div key={rec.id} className="p-4 rounded-xl bg-card">
                        <h4 className="text-lg font-semibold mb-1">{rec.title}</h4>
                        <p className="text-md text-muted-foreground">{rec.description}</p>
                        <Button variant="link" className="text-lg p-0 h-auto mt-2">Learn More</Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
