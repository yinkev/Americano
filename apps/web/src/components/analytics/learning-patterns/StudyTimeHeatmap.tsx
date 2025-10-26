'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { chartVariants, getAnimationConfig } from '@/lib/animation-variants'

interface HeatmapCell {
  day: number
  hour: number
  avgPerformance: number
  sessionCount: number
}

interface OptimalWindow {
  day: number
  startHour: number
  endHour: number
  score: number
}

interface HeatmapData {
  heatmapData: HeatmapCell[]
  optimalWindows: OptimalWindow[]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getPerformanceColor(performance: number): string {
  if (performance === 0) return 'oklch(0.95 0.01 230)' // Very light gray for no data

  // Green gradient from light to dark using OKLCH
  const lightness = 0.9 - (performance / 100) * 0.4 // 0.9 to 0.5
  const chroma = 0.05 + (performance / 100) * 0.1 // 0.05 to 0.15
  return `oklch(${lightness} ${chroma} 145)`
}

function isOptimalWindow(day: number, hour: number, windows: OptimalWindow[]): boolean {
  return windows.some((w) => w.day === day && hour >= w.startHour && hour <= w.endHour)
}

export function StudyTimeHeatmap() {
  const [data, setData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics/study-time-heatmap')
        if (!res.ok) throw new Error('Failed to fetch heatmap data')
        const heatmapData = await res.json()
        setData(heatmapData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleMouseEnter = (cell: HeatmapCell, event: React.MouseEvent) => {
    setHoveredCell(cell)
    setMousePosition({ x: event.clientX, y: event.clientY })
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (hoveredCell) {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }
  }

  const handleMouseLeave = () => {
    setHoveredCell(null)
  }

  if (loading) {
    return <Skeleton className="h-80 w-full" />
  }

  if (error || !data) {
    return (
      <Alert className="bg-card border-destructive/20">
        <AlertDescription className="text-destructive">{error || 'No heatmap data available'}</AlertDescription>
      </Alert>
    )
  }

  const getCellData = (day: number, hour: number): HeatmapCell => {
    return (
      data.heatmapData.find((d) => d.day === day && d.hour === hour) || {
        day,
        hour,
        avgPerformance: 0,
        sessionCount: 0,
      }
    )
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour labels */}
          <div className="flex mb-2">
            <div className="w-12" /> {/* Spacer for day labels */}
            {HOURS.filter((h) => h % 2 === 0).map((hour) => (
              <div
                key={hour}
                className="flex-1 text-center text-[13px]"
                style={{ color: 'oklch(0.6 0.03 230)', minWidth: '32px' }}
              >
                {hour}h
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {DAYS.map((dayLabel, dayIndex) => (
              <motion.div
                key={dayLabel}
                className="flex items-center gap-1"
                variants={getAnimationConfig(chartVariants.heatmapRow)}
                initial="hidden"
                animate="show"
                custom={dayIndex}
              >
                <div className="w-12 text-[13px] font-medium" style={{ color: 'oklch(0.5 0.05 230)' }}>
                  {dayLabel}
                </div>
                <div className="flex gap-1 flex-1">
                  {HOURS.map((hour) => {
                    const cellData = getCellData(dayIndex, hour)
                    const isOptimal = isOptimalWindow(dayIndex, hour, data.optimalWindows)
                    return (
                      <motion.div
                        key={`${dayIndex}-${hour}`}
                        className="flex-1 aspect-square rounded-sm cursor-pointer"
                        style={{
                          backgroundColor: getPerformanceColor(cellData.avgPerformance),
                          border: isOptimal
                            ? '2px solid oklch(0.5 0.2 145)'
                            : '1px solid oklch(0.9 0.02 230)',
                          minWidth: '16px',
                          minHeight: '16px',
                        }}
                        variants={getAnimationConfig(chartVariants.heatmapCell)}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        onMouseEnter={(e) => handleMouseEnter(cellData, e)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                      />
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-[13px]">
            <span style={{ color: 'oklch(0.6 0.03 230)' }}>Performance:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'oklch(0.9 0.05 145)' }} />
              <span style={{ color: 'oklch(0.6 0.03 230)' }}>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'oklch(0.7 0.1 145)' }} />
              <span style={{ color: 'oklch(0.6 0.03 230)' }}>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'oklch(0.5 0.15 145)' }} />
              <span style={{ color: 'oklch(0.6 0.03 230)' }}>High</span>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <div className="w-4 h-4 rounded" style={{ border: '2px solid oklch(0.5 0.2 145)' }} />
              <span style={{ color: 'oklch(0.6 0.03 230)' }}>Optimal Window</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 px-3 py-2 rounded-md shadow-none pointer-events-none"
          style={{
            backgroundColor: 'oklch(0.2 0.05 230)',
            color: 'oklch(0.98 0 0)',
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y + 10}px`,
            transform: 'translate(0, -100%)',
          }}
        >
          <div className="text-[13px] font-medium">
            {DAYS[hoveredCell.day]} {hoveredCell.hour}:00
          </div>
          <div className="text-[13px] mt-1">
            Avg Performance: {Math.round(hoveredCell.avgPerformance)}
          </div>
          <div className="text-[13px]">
            {hoveredCell.sessionCount} session{hoveredCell.sessionCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
