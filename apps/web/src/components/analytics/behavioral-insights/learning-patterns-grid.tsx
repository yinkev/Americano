'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Timer, FileText, TrendingUp, Activity, Brain, AlertCircle } from 'lucide-react'

// This is a placeholder for the new component.
// The actual implementation will be done in the next steps.

export function LearningPatternsGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
                <CardHeader className="flex items-center gap-4">
                    <div className="p-3 bg-card rounded-xl">
                        <Clock className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-heading font-bold">Optimal Study Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground mb-4">You learn best in the morning.</p>
                    <Button variant="link" className="text-lg">View Details</Button>
                </CardContent>
            </Card>
            <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
                <CardHeader className="flex items-center gap-4">
                    <div className="p-3 bg-card rounded-xl">
                        <Timer className="w-8 h-8 text-secondary" />
                    </div>
                    <CardTitle className="text-2xl font-heading font-bold">Session Duration</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground mb-4">Your ideal session length is 45 minutes.</p>
                    <Button variant="link" className="text-lg">View Details</Button>
                </CardContent>
            </Card>
        </div>
    )
}
