'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { Calendar, Filter, Search, ArrowUpDown, X, List, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MissionTimeline } from '@/components/missions/mission-timeline'
import Link from 'next/link'

interface MissionObjective {
  objectiveId: string
  objective: {
    objective: string
    complexity: string
    isHighYield: boolean
  }
  estimatedMinutes: number
  completed: boolean
  completedAt?: string
  notes?: string
}

interface Mission {
  id: string
  date: string
  status: 'COMPLETED' | 'SKIPPED' | 'PENDING' | 'IN_PROGRESS'
  estimatedMinutes: number
  actualMinutes?: number
  completedObjectivesCount: number
  objectives: MissionObjective[]
  successScore?: number
  difficultyRating?: number
}

type SortField = 'date' | 'completionRate' | 'successScore' | 'duration'
type SortOrder = 'asc' | 'desc'

export default function MissionHistoryPage() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedMissions, setSelectedMissions] = useState<string[]>([])

  // Fetch missions
  useEffect(() => {
    fetchMissions()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    applyFiltersAndSort()
  }, [missions, searchQuery, statusFilter, dateRange, sortField, sortOrder])

  async function fetchMissions() {
    try {
      setLoading(true)
      const response = await fetch('/api/missions/history', {
        headers: {
          'X-User-Email': 'kevy@americano.dev',
        },
      })
      const data = await response.json()

      if (data.success) {
        setMissions(data.data.missions)
      }
    } catch (error) {
      console.error('Failed to fetch mission history:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFiltersAndSort() {
    let result = [...missions]

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter)
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date()
      const cutoffDate = new Date()

      switch (dateRange) {
        case '7d':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case '30d':
          cutoffDate.setDate(now.getDate() - 30)
          break
        case '90d':
          cutoffDate.setDate(now.getDate() - 90)
          break
      }

      result = result.filter((m) => new Date(m.date) >= cutoffDate)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((m) =>
        m.objectives.some((obj) => obj.objective.objective.toLowerCase().includes(query)),
      )
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'completionRate': {
          const aRate =
            a.objectives.length > 0 ? a.completedObjectivesCount / a.objectives.length : 0
          const bRate =
            b.objectives.length > 0 ? b.completedObjectivesCount / b.objectives.length : 0
          comparison = aRate - bRate
          break
        }
        case 'successScore':
          comparison = (a.successScore ?? 0) - (b.successScore ?? 0)
          break
        case 'duration':
          comparison = (a.actualMinutes ?? 0) - (b.actualMinutes ?? 0)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredMissions(result)
  }

  function toggleMissionSelection(missionId: string) {
    setSelectedMissions((prev) =>
      prev.includes(missionId) ? prev.filter((id) => id !== missionId) : [...prev, missionId],
    )
  }

  function clearFilters() {
    setSearchQuery('')
    setStatusFilter('all')
    setDateRange('all')
    setSortField('date')
    setSortOrder('desc')
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'COMPLETED':
        return 'bg-[oklch(0.75_0.15_160)]/10 text-[oklch(0.75_0.15_160)] border-[oklch(0.75_0.15_160)]/20'
      case 'SKIPPED':
        return 'bg-[oklch(0.556_0_0)]/10 text-[oklch(0.556_0_0)] border-[oklch(0.556_0_0)]/20'
      case 'IN_PROGRESS':
        return 'bg-[oklch(0.7_0.15_50)]/10 text-[oklch(0.7_0.15_50)] border-[oklch(0.7_0.15_50)]/20'
      default:
        return 'bg-[oklch(0.922_0_0)] text-[oklch(0.556_0_0)] border-[oklch(0.922_0_0)]'
    }
  }

  function getSuccessRating(score?: number) {
    if (!score) return { label: 'N/A', color: 'text-[oklch(0.556_0_0)]' }
    if (score >= 0.8) return { label: 'Excellent', color: 'text-[oklch(0.75_0.15_160)]' }
    if (score >= 0.6) return { label: 'Good', color: 'text-[oklch(0.7_0.15_230)]' }
    if (score >= 0.4) return { label: 'Fair', color: 'text-[oklch(0.7_0.15_50)]' }
    return { label: 'Needs Improvement', color: 'text-[oklch(0.65_0.15_10)]' }
  }

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[oklch(0.922_0_0)] rounded w-1/3" />
          <div className="h-64 bg-[oklch(0.922_0_0)] rounded" />
        </div>
      </div>
    )
  }

  const hasFilters = searchQuery || statusFilter !== 'all' || dateRange !== 'all'

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold text-[oklch(0.145_0_0)]">Mission History</h1>
        <p className="text-[oklch(0.556_0_0)]">
          Browse and analyze your past missions. Compare missions to track your improvement over
          time.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="rounded-xl bg-card  border border-border shadow-none p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[oklch(0.556_0_0)]" />
              <Input
                type="text"
                placeholder="Search by objective name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border focus:border-[oklch(0.7_0.15_230)] focus:ring-[oklch(0.7_0.15_230)]/20"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="SKIPPED">Skipped</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="w-full lg:w-48">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="w-full lg:w-48">
            <Select
              value={`${sortField}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split('-') as [SortField, SortOrder]
                setSortField(field)
                setSortOrder(order)
              }}
            >
              <SelectTrigger className="bg-card border-border">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="size-4" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="completionRate-desc">Completion (High)</SelectItem>
                <SelectItem value="completionRate-asc">Completion (Low)</SelectItem>
                <SelectItem value="successScore-desc">Success (High)</SelectItem>
                <SelectItem value="successScore-asc">Success (Low)</SelectItem>
                <SelectItem value="duration-desc">Duration (Long)</SelectItem>
                <SelectItem value="duration-asc">Duration (Short)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full lg:w-auto border-border hover:bg-card"
            >
              <X className="size-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Selected Missions Actions */}
        {selectedMissions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-[oklch(0.556_0_0)]">
              {selectedMissions.length} mission{selectedMissions.length !== 1 ? 's' : ''} selected
            </p>
            <Link href={`/missions/compare?ids=${selectedMissions.join(',')}`}>
              <Button
                disabled={selectedMissions.length < 2}
                className="bg-[oklch(0.7_0.15_230)] hover:bg-[oklch(0.65_0.15_230)] text-white"
              >
                Compare Missions
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* View Toggle and Results Summary */}
      <Tabs defaultValue="list" className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[oklch(0.556_0_0)]">
            Showing {filteredMissions.length} of {missions.length} missions
          </p>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="list" className="gap-2">
              <List className="size-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <LayoutGrid className="size-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </div>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          {filteredMissions.length === 0 ? (
            <div className="rounded-xl bg-card  border border-border shadow-none p-12 text-center">
              <Calendar className="size-12 mx-auto mb-4 text-[oklch(0.556_0_0)]" />
              <p className="text-lg font-medium text-[oklch(0.145_0_0)] mb-2">No missions found</p>
              <p className="text-sm text-[oklch(0.556_0_0)]">
                {hasFilters
                  ? 'Try adjusting your filters to see more results.'
                  : 'Start completing missions to see your history here.'}
              </p>
            </div>
          ) : (
            filteredMissions.map((mission) => {
              const completionRate =
                mission.objectives.length > 0
                  ? (mission.completedObjectivesCount / mission.objectives.length) * 100
                  : 0
              const successRating = getSuccessRating(mission.successScore)
              const isSelected = selectedMissions.includes(mission.id)

              return (
                <div
                  key={mission.id}
                  id={`mission-${mission.id}`}
                  className={`rounded-xl bg-card  border transition-all duration-200 ${
                    isSelected
                      ? 'border-[oklch(0.7_0.15_230)] shadow-none'
                      : 'border-border shadow-none hover:shadow-none'
                  } p-6`}
                >
                  <div className="flex items-start gap-4">
                    {/* Selection Checkbox */}
                    <div className="pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleMissionSelection(mission.id)}
                        className="data-[state=checked]:bg-[oklch(0.7_0.15_230)] data-[state=checked]:border-[oklch(0.7_0.15_230)]"
                      />
                    </div>

                    {/* Mission Content */}
                    <div className="flex-1 min-w-0 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)]">
                              {format(parseISO(mission.date), 'EEEE, MMMM d, yyyy')}
                            </h3>
                            <Badge variant="outline" className={getStatusColor(mission.status)}>
                              {mission.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-[oklch(0.556_0_0)]">
                            <span>
                              {mission.completedObjectivesCount} / {mission.objectives.length}{' '}
                              objectives
                            </span>
                            {mission.actualMinutes && (
                              <span>
                                {mission.actualMinutes} min (est. {mission.estimatedMinutes} min)
                              </span>
                            )}
                            {mission.successScore !== undefined && (
                              <span className={successRating.color}>
                                Success: {successRating.label} (
                                {Math.round(mission.successScore * 100)}%)
                              </span>
                            )}
                            {mission.difficultyRating && (
                              <span>Difficulty: {'⭐'.repeat(mission.difficultyRating)}</span>
                            )}
                          </div>
                        </div>

                        {/* View Details Link */}
                        <Link
                          href={`/missions/${mission.id}`}
                          className="flex-shrink-0 text-sm font-medium text-[oklch(0.7_0.15_230)] hover:text-[oklch(0.65_0.15_230)] transition-colors"
                        >
                          View Details →
                        </Link>
                      </div>

                      {/* Progress Bar */}
                      {mission.status !== 'PENDING' && (
                        <div>
                          <div className="h-2 w-full rounded-full bg-[oklch(0.97_0_0)]">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                mission.status === 'COMPLETED'
                                  ? 'bg-[oklch(0.75_0.15_160)]'
                                  : mission.status === 'SKIPPED'
                                    ? 'bg-[oklch(0.556_0_0)]'
                                    : 'bg-[oklch(0.7_0.15_50)]'
                              }`}
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Objectives Preview */}
                      <div className="space-y-2">
                        {mission.objectives.slice(0, 3).map((obj, idx) => (
                          <div key={obj.objectiveId} className="flex items-start gap-2 text-sm">
                            <span
                              className={`flex-shrink-0 mt-0.5 ${
                                obj.completed
                                  ? 'text-[oklch(0.75_0.15_160)]'
                                  : 'text-[oklch(0.556_0_0)]'
                              }`}
                            >
                              {obj.completed ? '✅' : `${idx + 1}.`}
                            </span>
                            <p
                              className={`flex-1 min-w-0 leading-relaxed ${
                                obj.completed
                                  ? 'text-[oklch(0.556_0_0)] line-through'
                                  : 'text-[oklch(0.145_0_0)]'
                              }`}
                            >
                              {obj.objective.objective}
                            </p>
                          </div>
                        ))}
                        {mission.objectives.length > 3 && (
                          <p className="text-xs text-[oklch(0.556_0_0)] pl-6">
                            +{mission.objectives.length - 3} more objectives
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <MissionTimeline
            missions={filteredMissions}
            onDateClick={(date, dayMissions) => {
              // Scroll to first mission of that day
              const firstMission = dayMissions[0]
              if (firstMission) {
                // Switch to list view and scroll
                const element = document.getElementById(`mission-${firstMission.id}`)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
