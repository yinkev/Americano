/**
 * Mission utility functions for data processing, calculations, and exports
 */

export interface MissionObjective {
  objectiveId: string
  objective?: {
    objective: string
    complexity: string
    isHighYield: boolean
  }
  estimatedMinutes: number
  completed: boolean
  completedAt?: string
  notes?: string
}

export interface Mission {
  id: string
  date: Date | string
  status: 'COMPLETED' | 'SKIPPED' | 'PENDING' | 'IN_PROGRESS'
  estimatedMinutes: number
  actualMinutes?: number | null
  completedObjectivesCount: number
  objectives: MissionObjective[] | string
  successScore?: number | null
  difficultyRating?: number | null
}

/**
 * Parse objectives from string or return as-is if already parsed
 */
export function parseObjectives(objectives: MissionObjective[] | string): MissionObjective[] {
  if (typeof objectives === 'string') {
    try {
      const parsed = JSON.parse(objectives)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return Array.isArray(objectives) ? objectives : []
}

/**
 * Calculate mission statistics from array of missions
 */
export function calculateMissionStats(missions: Mission[]) {
  const totalMissions = missions.length
  const completedMissions = missions.filter((m) => m.status === 'COMPLETED').length
  const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0

  const avgObjectives =
    totalMissions > 0
      ? missions.reduce((sum, m) => {
          const objs = parseObjectives(m.objectives)
          return sum + objs.length
        }, 0) / totalMissions
      : 0

  const avgTimeEstimate =
    totalMissions > 0 ? missions.reduce((sum, m) => sum + m.estimatedMinutes, 0) / totalMissions : 0

  const missionsWithActualTime = missions.filter((m) => m.actualMinutes != null)
  const avgTimeActual =
    missionsWithActualTime.length > 0
      ? missionsWithActualTime.reduce((sum, m) => sum + (m.actualMinutes || 0), 0) /
        missionsWithActualTime.length
      : undefined

  const missionsWithScore = missions.filter((m) => m.successScore != null)
  const avgSuccessScore =
    missionsWithScore.length > 0
      ? missionsWithScore.reduce((sum, m) => sum + (m.successScore || 0), 0) /
        missionsWithScore.length
      : undefined

  return {
    totalMissions,
    completedMissions,
    completionRate,
    avgObjectives,
    avgTimeEstimate,
    avgTimeActual,
    avgSuccessScore,
  }
}

/**
 * Calculate completion rate for a mission
 */
export function calculateCompletionRate(mission: Mission): number {
  const objectives = parseObjectives(mission.objectives)
  if (objectives.length === 0) return 0
  const completed = mission.completedObjectivesCount || objectives.filter((o) => o.completed).length
  return (completed / objectives.length) * 100
}

/**
 * Calculate time accuracy percentage
 */
export function calculateTimeAccuracy(
  estimatedMinutes: number,
  actualMinutes?: number | null,
): number | null {
  if (!actualMinutes || estimatedMinutes === 0) return null
  return 100 - Math.abs(((actualMinutes - estimatedMinutes) / estimatedMinutes) * 100)
}

/**
 * Get success rating based on success score
 */
export function getSuccessRating(score?: number | null): {
  label: string
  color: string
  value: number
} {
  if (!score) return { label: 'N/A', color: 'text-gray-500', value: 0 }

  const percentage = score * 100

  if (percentage >= 90) return { label: 'Excellent', color: 'text-green-600', value: percentage }
  if (percentage >= 80) return { label: 'Very Good', color: 'text-green-500', value: percentage }
  if (percentage >= 70) return { label: 'Good', color: 'text-blue-600', value: percentage }
  if (percentage >= 60) return { label: 'Fair', color: 'text-yellow-600', value: percentage }
  if (percentage >= 50)
    return { label: 'Needs Improvement', color: 'text-orange-600', value: percentage }

  return { label: 'Poor', color: 'text-red-600', value: percentage }
}

/**
 * Export missions to CSV format
 */
export function exportMissionsToCSV(missions: Mission[]): string {
  const headers = [
    'Date',
    'Status',
    'Objectives Total',
    'Objectives Completed',
    'Completion Rate (%)',
    'Estimated Time (min)',
    'Actual Time (min)',
    'Time Accuracy (%)',
    'Success Score (%)',
    'Difficulty Rating',
  ]

  const rows = missions.map((mission) => {
    const date = mission.date instanceof Date ? mission.date : new Date(mission.date)
    const objectives = parseObjectives(mission.objectives)
    const completionRate = calculateCompletionRate(mission)
    const timeAccuracy = calculateTimeAccuracy(mission.estimatedMinutes, mission.actualMinutes)

    return [
      date.toLocaleDateString(),
      mission.status,
      objectives.length,
      mission.completedObjectivesCount,
      completionRate.toFixed(1),
      mission.estimatedMinutes,
      mission.actualMinutes || '',
      timeAccuracy !== null ? timeAccuracy.toFixed(1) : '',
      mission.successScore ? (mission.successScore * 100).toFixed(1) : '',
      mission.difficultyRating || '',
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Filter missions based on criteria
 */
export function filterMissions(
  missions: Mission[],
  filters: {
    statuses?: string[]
    searchQuery?: string
    dateRange?: { start: Date | null; end: Date | null }
  },
): Mission[] {
  return missions.filter((mission) => {
    // Status filter
    if (filters.statuses && filters.statuses.length > 0) {
      if (!filters.statuses.includes(mission.status)) return false
    }

    // Search filter
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase()
      const objectives = parseObjectives(mission.objectives)
      const matchesObjective = objectives.some((obj) =>
        obj.objective?.objective.toLowerCase().includes(query),
      )
      if (!matchesObjective) return false
    }

    // Date range filter
    if (filters.dateRange) {
      const missionDate = mission.date instanceof Date ? mission.date : new Date(mission.date)
      if (filters.dateRange.start && missionDate < filters.dateRange.start) return false
      if (filters.dateRange.end && missionDate > filters.dateRange.end) return false
    }

    return true
  })
}

/**
 * Sort missions by various criteria
 */
export function sortMissions(
  missions: Mission[],
  sortBy: 'date' | 'completion' | 'status' | 'time',
  direction: 'asc' | 'desc' = 'desc',
): Mission[] {
  const sorted = [...missions].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'date': {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date)
        const dateB = b.date instanceof Date ? b.date : new Date(b.date)
        comparison = dateA.getTime() - dateB.getTime()
        break
      }
      case 'completion': {
        const rateA = calculateCompletionRate(a)
        const rateB = calculateCompletionRate(b)
        comparison = rateA - rateB
        break
      }
      case 'status': {
        const statusOrder = { PENDING: 0, IN_PROGRESS: 1, COMPLETED: 2, SKIPPED: 3 }
        comparison = statusOrder[a.status] - statusOrder[b.status]
        break
      }
      case 'time': {
        comparison =
          (a.actualMinutes || a.estimatedMinutes) - (b.actualMinutes || b.estimatedMinutes)
        break
      }
    }

    return direction === 'asc' ? comparison : -comparison
  })

  return sorted
}
