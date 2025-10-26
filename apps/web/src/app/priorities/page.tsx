'use client'

import { Sparkles } from 'lucide-react'

// Priorities client component
import { PrioritiesClient } from './priorities-client'

export default function PrioritiesPage() {

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <Sparkles className="w-10 h-10 text-primary" />
            <div>
                <h1 className="text-4xl font-heading font-bold">Your Priorities</h1>
                <p className="text-lg text-muted-foreground">What to focus on next for maximum impact.</p>
            </div>
        </div>
      </div>

      <PrioritiesClient />
    </div>
  )
}
