/**
 * Lecture Grid Component
 *
 * Grid view for lecture library with thumbnail previews
 * - Responsive grid layout
 * - Lecture cards with thumbnails
 * - Quick stats display
 * - Selection support
 * - Hover interactions
 */

'use client'

import { motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MoreVertical,
  Target,
} from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { selectLibraryPreferences, useLibraryStore } from '@/stores'

interface Lecture {
  id: string
  title: string
  fileName: string
  uploadedAt: string
  processedAt: string | null
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  weekNumber: number | null
  topicTags: string[]
  course: {
    id: string
    name: string
    code: string | null
    color: string | null
  }
  chunkCount: number
  objectiveCount: number
  cardCount: number
}

export interface LectureGridProps {
  lectures: Lecture[]
  onLectureClick?: (lecture: Lecture) => void
  onLectureAction?: (action: string, lecture: Lecture) => void
}

export function LectureGrid({ lectures, onLectureClick, onLectureAction }: LectureGridProps) {
  const preferences = useLibraryStore(selectLibraryPreferences)
  const selectedLectureIds = useLibraryStore((state) => state.selectedLectureIds)
  const { toggleLectureSelection } = useLibraryStore()

  const getStatusConfig = (status: Lecture['processingStatus']) => {
    switch (status) {
      case 'COMPLETED':
        return {
          icon: CheckCircle2,
          label: 'Completed',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        }
      case 'PROCESSING':
        return {
          icon: Loader2,
          label: 'Processing',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        }
      case 'PENDING':
        return {
          icon: Clock,
          label: 'Pending',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        }
      case 'FAILED':
        return {
          icon: FileText,
          label: 'Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        }
      default:
        return {
          icon: FileText,
          label: 'Unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const gridClass = cn(
    'grid gap-4',
    preferences.gridColumns === 2 && 'grid-cols-1 md:grid-cols-2',
    preferences.gridColumns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    preferences.gridColumns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  )

  return (
    <div className={gridClass}>
      {lectures.map((lecture, index) => {
        const status = getStatusConfig(lecture.processingStatus)
        const isSelected = selectedLectureIds.has(lecture.id)

        return (
          <motion.div
            key={lecture.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <Card
              className={cn(
                'overflow-hidden transition-all hover:shadow-lg group',
                isSelected && 'ring-2 ring-primary'
              )}
            >
              {/* Thumbnail */}
              {preferences.showThumbnails && (
                <div
                  className={cn(
                    'relative h-32 bg-gradient-to-br cursor-pointer',
                    status.bgColor
                  )}
                  onClick={() => onLectureClick?.(lecture)}
                  style={{
                    background: lecture.course.color
                      ? `linear-gradient(135deg, ${lecture.course.color}20, ${lecture.course.color}40)`
                      : undefined,
                  }}
                >
                  {/* Selection checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleLectureSelection(lecture.id)}
                      className="bg-white/90 backdrop-blur-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Actions menu */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onLectureAction?.('view', lecture)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onLectureAction?.('edit', lecture)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onLectureAction?.('delete', lecture)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status badge */}
                  <div className="absolute bottom-2 left-2">
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', status.color, 'bg-white/90 backdrop-blur-sm')}
                    >
                      <status.icon className={cn('h-3 w-3 mr-1', status.label === 'Processing' && 'animate-spin')} />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Week number */}
                  {lecture.weekNumber && (
                    <div className="absolute bottom-2 right-2">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-white/90 backdrop-blur-sm"
                      >
                        Week {lecture.weekNumber}
                      </Badge>
                    </div>
                  )}

                  {/* File icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <FileText className="h-16 w-16" />
                  </div>
                </div>
              )}

              <CardContent className={cn('p-4', !preferences.showThumbnails && 'pt-4')}>
                {/* Title */}
                <h3
                  className="font-semibold text-base mb-2 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => onLectureClick?.(lecture)}
                >
                  {lecture.title}
                </h3>

                {/* Course */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: lecture.course.color || '#6b7280' }}
                  />
                  <span className="text-sm text-muted-foreground truncate">
                    {lecture.course.code || lecture.course.name}
                  </span>
                </div>

                {/* Tags */}
                {lecture.topicTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {lecture.topicTags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {lecture.topicTags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{lecture.topicTags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats */}
                {preferences.showStats && lecture.processingStatus === 'COMPLETED' && (
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center">
                            <Target className="h-4 w-4 text-muted-foreground mb-1" />
                            <span className="text-xs font-semibold">{lecture.objectiveCount}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Objectives</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground mb-1" />
                            <span className="text-xs font-semibold">{lecture.cardCount}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Flashcards</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center">
                            <FileText className="h-4 w-4 text-muted-foreground mb-1" />
                            <span className="text-xs font-semibold">{lecture.chunkCount}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Chunks</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </CardContent>

              <CardFooter className="px-4 pb-4 pt-0">
                <div className="text-xs text-muted-foreground">
                  Uploaded {formatDate(lecture.uploadedAt)}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
