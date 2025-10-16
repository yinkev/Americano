/**
 * Priorities Page
 * Story 2.3: Intelligent Content Prioritization Algorithm
 *
 * Displays prioritized learning objectives using the PrioritizationEngine
 */

import { Sparkles } from 'lucide-react'
import { PrioritiesClient } from './priorities-client'

interface PriorityObjective {
  id: string
  title: string
  description: string
  complexity: string
  estimatedMinutes: number
  courseId: string
  course: {
    id: string
    name: string
    code: string
  }
  priorityScore: number
  priorityExplanation: {
    objectiveId: string
    priorityScore: number
    factors: Array<{
      name: string
      value: number
      weight: number
      contribution: number
      explanation: string
    }>
    reasoning: string
    recommendations: string[]
    visualIndicator: string
  }
}

async function getPriorities(): Promise<PriorityObjective[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/priorities?limit=20`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error('Failed to fetch priorities')
    }

    const data = await res.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching priorities:', error)
    return []
  }
}

export default async function PrioritiesPage() {
  const priorities = await getPriorities()

  return (
    <div className="min-h-screen bg-white/50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/60 rounded-xl">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Priority Learning</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Focus on what matters most. These learning objectives are prioritized based on exam urgency,
            your weak areas, high-yield content, prerequisites, and study recency.
          </p>
        </div>

        {/* Client Component for Interactive List */}
        <PrioritiesClient priorities={priorities} />
      </div>
    </div>
  )
}
