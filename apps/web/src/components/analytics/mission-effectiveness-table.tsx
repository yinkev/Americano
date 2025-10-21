/**
 * MissionEffectivenessTable Component
 * Story 2.6 Task 3.4
 *
 * Sortable/filterable table showing mission effectiveness metrics
 */

'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Filter } from 'lucide-react'

interface MissionEffectiveness {
  week: string
  missionsCompleted: number
  avgDifficulty: number
  objectivesMastered: number
  studyTimeMinutes: number
  improvementPercentage: number
}

interface ComparisonData {
  missionGuided: {
    sessions: number
    masteryImprovement: number
    completionRate: number
    efficiency: number
  }
  freeStudy: {
    sessions: number
    masteryImprovement: number
    completionRate: number
    efficiency: number
  }
  improvementPercentage: number
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  pValue: number
  insight: string
}

type SortField = keyof MissionEffectiveness
type SortDirection = 'asc' | 'desc'

export function MissionEffectivenessTable() {
  const [data, setData] = useState<MissionEffectiveness[]>([])
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('week')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | '1' | '2' | '3' | '4' | '5'>(
    'all',
  )

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/missions/summary?period=90d', {
        headers: {
          'X-User-Email': 'kevy@americano.dev',
        },
      })

      if (!response.ok) throw new Error('Failed to fetch effectiveness data')

      const result = await response.json()

      // Extract comparison data from API response
      if (result.data?.comparison) {
        setComparison(result.data.comparison)
      }

      // Transform summary data into weekly effectiveness records
      // In production, this would come from a dedicated endpoint
      const mockData: MissionEffectiveness[] = [
        {
          week: '2025-10-08',
          missionsCompleted: 6,
          avgDifficulty: 3.5,
          objectivesMastered: 18,
          studyTimeMinutes: 324,
          improvementPercentage: 15.2,
        },
        {
          week: '2025-10-01',
          missionsCompleted: 5,
          avgDifficulty: 3.2,
          objectivesMastered: 14,
          studyTimeMinutes: 280,
          improvementPercentage: 12.8,
        },
        {
          week: '2025-09-24',
          missionsCompleted: 7,
          avgDifficulty: 3.8,
          objectivesMastered: 21,
          studyTimeMinutes: 385,
          improvementPercentage: 18.5,
        },
      ]

      setData(mockData)
    } catch (error) {
      console.error('Error fetching effectiveness data:', error)
      setData([])
      setComparison(null)
    } finally {
      setLoading(false)
    }
  }

  // Sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  // Filtering logic
  const filteredData =
    filterDifficulty === 'all'
      ? sortedData
      : sortedData.filter((row) => Math.round(row.avgDifficulty) === parseInt(filterDifficulty))

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Week',
      'Missions Completed',
      'Avg Difficulty',
      'Objectives Mastered',
      'Study Time (min)',
      'Improvement %',
    ]
    const rows = filteredData.map((row) => [
      format(new Date(row.week), 'MMM dd, yyyy'),
      row.missionsCompleted,
      row.avgDifficulty.toFixed(1),
      row.objectivesMastered,
      row.studyTimeMinutes,
      row.improvementPercentage.toFixed(1),
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-effectiveness-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-4 text-[oklch(0.556_0_0)]" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="size-4 text-[oklch(0.7_0.15_230)]" />
    ) : (
      <ArrowDown className="size-4 text-[oklch(0.7_0.15_230)]" />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/80 backdrop-blur-md rounded-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30">
        <div className="text-[13px] text-muted-foreground">Loading effectiveness data...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white/80 backdrop-blur-md rounded-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
        <div className="text-[13px] text-muted-foreground">No effectiveness data available</div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Complete missions over multiple weeks to see trends
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all border border-white/30 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[18px] font-heading font-semibold text-foreground">
            Mission Effectiveness
          </h3>
          <p className="text-[13px] text-muted-foreground mt-1">Weekly performance breakdown</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/60 text-[oklch(0.556_0_0)] hover:bg-white/80 transition-colors text-sm font-medium"
          aria-label="Export to CSV"
        >
          <Download className="size-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-[oklch(0.556_0_0)]" />
          <span className="text-sm text-[oklch(0.556_0_0)]">Difficulty:</span>
        </div>
        <div className="flex gap-2">
          {(['all', '1', '2', '3', '4', '5'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilterDifficulty(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterDifficulty === level
                  ? 'bg-[oklch(0.7_0.15_230)] text-white'
                  : 'bg-white/60 text-[oklch(0.556_0_0)] hover:bg-white/80'
              }`}
            >
              {level === 'all' ? 'All' : `${level}/5`}
            </button>
          ))}
        </div>
      </div>

      {/* Mission vs. Free-Study Comparison */}
      {comparison &&
        comparison.missionGuided.sessions >= 3 &&
        comparison.freeStudy.sessions >= 3 && (
          <div className="mb-6 p-4 rounded-xl bg-[oklch(0.7_0.15_230)]/5 border border-[oklch(0.7_0.15_230)]/20">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-[oklch(0.145_0_0)] mb-1">
                  Mission-Guided vs. Free-Form Study
                </h4>
                <p className="text-xs text-[oklch(0.556_0_0)]">
                  Statistical comparison over last 90 days
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  comparison.confidence === 'HIGH'
                    ? 'bg-[oklch(0.75_0.15_160)]/10 text-[oklch(0.75_0.15_160)]'
                    : comparison.confidence === 'MEDIUM'
                      ? 'bg-[oklch(0.7_0.15_50)]/10 text-[oklch(0.7_0.15_50)]'
                      : 'bg-[oklch(0.556_0_0)]/10 text-[oklch(0.556_0_0)]'
                }`}
              >
                {comparison.confidence} confidence
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-[oklch(0.556_0_0)]">
                  Mission-Guided ({comparison.missionGuided.sessions} sessions)
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[oklch(0.556_0_0)]">Mastery:</span>
                    <span className="font-medium text-[oklch(0.7_0.15_230)]">
                      {(comparison.missionGuided.masteryImprovement * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[oklch(0.556_0_0)]">Completion:</span>
                    <span className="font-medium text-[oklch(0.145_0_0)]">
                      {(comparison.missionGuided.completionRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[oklch(0.556_0_0)]">Efficiency:</span>
                    <span className="font-medium text-[oklch(0.145_0_0)]">
                      {comparison.missionGuided.efficiency.toFixed(1)} obj/hr
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-[oklch(0.556_0_0)]">
                  Free-Form ({comparison.freeStudy.sessions} sessions)
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[oklch(0.556_0_0)]">Mastery:</span>
                    <span className="font-medium text-[oklch(0.556_0_0)]">
                      {(comparison.freeStudy.masteryImprovement * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[oklch(0.556_0_0)]">Completion:</span>
                    <span className="font-medium text-[oklch(0.145_0_0)]">
                      {(comparison.freeStudy.completionRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[oklch(0.556_0_0)]">Efficiency:</span>
                    <span className="font-medium text-[oklch(0.145_0_0)]">
                      {comparison.freeStudy.efficiency.toFixed(1)} obj/hr
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[oklch(0.7_0.15_230)]/10">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[oklch(0.556_0_0)]">{comparison.insight}</p>
                <span
                  className={`ml-2 text-sm font-semibold whitespace-nowrap ${
                    comparison.improvementPercentage > 0
                      ? 'text-[oklch(0.75_0.15_160)]'
                      : 'text-[oklch(0.65_0.15_10)]'
                  }`}
                >
                  {comparison.improvementPercentage > 0 ? '+' : ''}
                  {comparison.improvementPercentage.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-[oklch(0.556_0_0)] mt-1">
                p-value: {comparison.pValue.toFixed(3)}{' '}
                {comparison.pValue < 0.01
                  ? '(highly significant)'
                  : comparison.pValue < 0.05
                    ? '(significant)'
                    : '(not significant)'}
              </p>
            </div>
          </div>
        )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[oklch(0.922_0_0)]">
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('week')}
                  className="flex items-center gap-2 text-sm font-semibold text-[oklch(0.145_0_0)] hover:text-[oklch(0.7_0.15_230)] transition-colors"
                >
                  Week
                  <SortIcon field="week" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('missionsCompleted')}
                  className="flex items-center justify-end gap-2 ml-auto text-sm font-semibold text-[oklch(0.145_0_0)] hover:text-[oklch(0.7_0.15_230)] transition-colors"
                >
                  Missions
                  <SortIcon field="missionsCompleted" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('avgDifficulty')}
                  className="flex items-center justify-end gap-2 ml-auto text-sm font-semibold text-[oklch(0.145_0_0)] hover:text-[oklch(0.7_0.15_230)] transition-colors"
                >
                  Avg Difficulty
                  <SortIcon field="avgDifficulty" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('objectivesMastered')}
                  className="flex items-center justify-end gap-2 ml-auto text-sm font-semibold text-[oklch(0.145_0_0)] hover:text-[oklch(0.7_0.15_230)] transition-colors"
                >
                  Mastered
                  <SortIcon field="objectivesMastered" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('studyTimeMinutes')}
                  className="flex items-center justify-end gap-2 ml-auto text-sm font-semibold text-[oklch(0.145_0_0)] hover:text-[oklch(0.7_0.15_230)] transition-colors"
                >
                  Study Time
                  <SortIcon field="studyTimeMinutes" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('improvementPercentage')}
                  className="flex items-center justify-end gap-2 ml-auto text-sm font-semibold text-[oklch(0.145_0_0)] hover:text-[oklch(0.7_0.15_230)] transition-colors"
                >
                  Improvement
                  <SortIcon field="improvementPercentage" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr
                key={row.week}
                className={`border-b border-[oklch(0.922_0_0)] hover:bg-white/60 transition-colors ${
                  index % 2 === 0 ? 'bg-white/20' : ''
                }`}
              >
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-[oklch(0.145_0_0)]">
                    {format(new Date(row.week), 'MMM dd, yyyy')}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm text-[oklch(0.145_0_0)]">{row.missionsCompleted}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      row.avgDifficulty >= 4
                        ? 'bg-[oklch(0.65_0.15_10)]/10 text-[oklch(0.65_0.15_10)]'
                        : row.avgDifficulty >= 3
                          ? 'bg-[oklch(0.7_0.15_50)]/10 text-[oklch(0.7_0.15_50)]'
                          : 'bg-[oklch(0.75_0.15_160)]/10 text-[oklch(0.75_0.15_160)]'
                    }`}
                  >
                    {row.avgDifficulty.toFixed(1)}/5
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-medium text-[oklch(0.7_0.15_230)]">
                    {row.objectivesMastered}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm text-[oklch(0.145_0_0)]">
                    {Math.floor(row.studyTimeMinutes / 60)}h {row.studyTimeMinutes % 60}m
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-medium ${
                      row.improvementPercentage > 15
                        ? 'text-[oklch(0.75_0.15_160)]'
                        : row.improvementPercentage > 10
                          ? 'text-[oklch(0.7_0.15_50)]'
                          : 'text-[oklch(0.556_0_0)]'
                    }`}
                  >
                    {row.improvementPercentage > 0 && '+'}
                    {row.improvementPercentage.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-6 border-t border-[oklch(0.922_0_0)] grid grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Total Missions</p>
          <p className="text-lg font-semibold text-[oklch(0.145_0_0)]">
            {filteredData.reduce((sum, row) => sum + row.missionsCompleted, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Avg Difficulty</p>
          <p className="text-lg font-semibold text-[oklch(0.145_0_0)]">
            {(
              filteredData.reduce((sum, row) => sum + row.avgDifficulty, 0) / filteredData.length
            ).toFixed(1)}
            /5
          </p>
        </div>
        <div>
          <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Total Mastered</p>
          <p className="text-lg font-semibold text-[oklch(0.145_0_0)]">
            {filteredData.reduce((sum, row) => sum + row.objectivesMastered, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Avg Improvement</p>
          <p className="text-lg font-semibold text-[oklch(0.75_0.15_160)]">
            +
            {(
              filteredData.reduce((sum, row) => sum + row.improvementPercentage, 0) /
              filteredData.length
            ).toFixed(1)}
            %
          </p>
        </div>
      </div>
    </div>
  )
}
