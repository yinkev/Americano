"use client"

/**
 * ExportButton Component
 *
 * Epic 3 - Story 3.6 - Task 6: Export Functionality
 *
 * Features:
 * - Format selector dropdown (JSON, CSV, Markdown)
 * - Download progress indicator
 * - Rate limiting display
 * - Metadata inclusion toggle
 */

import * as React from "react"
import { Download, FileJson, FileText, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type ExportFormat = 'json' | 'csv' | 'markdown'

interface ExportButtonProps {
  query: string
  filters?: {
    courseIds?: string[]
    category?: string
    dateRange?: {
      start: Date
      end: Date
    }
    contentTypes?: ('lecture' | 'chunk' | 'concept')[]
    minSimilarity?: number
  }
  disabled?: boolean
  className?: string
}

const formatIcons = {
  json: FileJson,
  csv: FileSpreadsheet,
  markdown: FileText,
}

const formatLabels = {
  json: 'JSON',
  csv: 'CSV',
  markdown: 'Markdown',
}

const formatDescriptions = {
  json: 'Full search results with metadata',
  csv: 'Flattened tabular format',
  markdown: 'Human-readable formatted results',
}

export function ExportButton({ query, filters, disabled, className }: ExportButtonProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = React.useState(false)
  const [includeMetadata, setIncludeMetadata] = React.useState(true)
  const [remainingExports, setRemainingExports] = React.useState<number | null>(null)
  const [resetTime, setResetTime] = React.useState<Date | null>(null)

  const handleExport = async (format: ExportFormat) => {
    if (!query || query.trim().length === 0) {
      toast({
        title: "Cannot export",
        description: "Please enter a search query first",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      const response = await fetch('/api/graph/search/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters,
          format,
          includeMetadata,
        }),
      })

      // Update rate limit info from headers
      const remaining = response.headers.get('X-Rate-Limit-Remaining')
      const reset = response.headers.get('X-Rate-Limit-Reset')

      if (remaining) setRemainingExports(parseInt(remaining, 10))
      if (reset) setResetTime(new Date(reset))

      if (!response.ok) {
        const error = await response.json()

        if (response.status === 429) {
          // Rate limit exceeded
          const resetIn = resetTime
            ? Math.ceil((resetTime.getTime() - Date.now()) / 1000 / 60)
            : 'a few'

          toast({
            title: "Export limit reached",
            description: error.message || `You can export again in ${resetIn} minutes`,
            variant: "destructive",
          })
          return
        }

        throw new Error(error.error || 'Export failed')
      }

      // Get the blob data
      const blob = await response.blob()
      const exportCount = response.headers.get('X-Export-Count')
      const processingTime = response.headers.get('X-Processing-Time')

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || `search-results.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export successful",
        description: `Exported ${exportCount || 'N/A'} results in ${processingTime || 'N/A'}. ${remainingExports !== null ? `${remainingExports} exports remaining this hour.` : ''}`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export search results",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting || !query}
          className={cn(
            "rounded-lg bg-white/60 hover:bg-white/80 border-white/40",
            className
          )}
          aria-label="Export search results"
        >
          {isExporting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" aria-hidden="true" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="size-4 mr-2" aria-hidden="true" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-md border-white/40">
        <DropdownMenuLabel className="flex items-center gap-2">
          Export Results
          {remainingExports !== null && (
            <span className="text-xs text-muted-foreground ml-auto">
              {remainingExports}/10 left
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Format options */}
        {(['json', 'csv', 'markdown'] as ExportFormat[]).map((format) => {
          const Icon = formatIcons[format]
          return (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting}
              className="cursor-pointer"
            >
              <Icon className="size-4 mr-2" aria-hidden="true" />
              <div className="flex-1">
                <div className="font-medium">{formatLabels[format]}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDescriptions[format]}
                </div>
              </div>
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />

        {/* Metadata toggle */}
        <DropdownMenuCheckboxItem
          checked={includeMetadata}
          onCheckedChange={setIncludeMetadata}
        >
          Include metadata
        </DropdownMenuCheckboxItem>

        {/* Rate limit warning */}
        {remainingExports !== null && remainingExports <= 3 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-amber-600 flex items-center gap-2">
              <AlertCircle className="size-3" aria-hidden="true" />
              <span>
                {remainingExports === 0
                  ? 'Export limit reached'
                  : `Only ${remainingExports} export${remainingExports === 1 ? '' : 's'} left`}
              </span>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
