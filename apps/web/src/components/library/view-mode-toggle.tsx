/**
 * View Mode Toggle Component
 *
 * Toggle between grid and list views for lecture library
 * - Grid/List view selector
 * - Grid columns configuration
 * - Display preferences toggles
 */

'use client'

import { Grid3x3, List, Settings2 } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { selectLibraryPreferences, useLibraryStore } from '@/stores'

export function ViewModeToggle() {
  const preferences = useLibraryStore(selectLibraryPreferences)
  const {
    setViewMode,
    setGridColumns,
    toggleShowThumbnails,
    toggleShowStats,
    toggleCompactMode,
  } = useLibraryStore()

  return (
    <div className="flex items-center gap-2">
      {/* View mode toggle */}
      <div className="flex items-center border rounded-lg p-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={preferences.viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grid view</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={preferences.viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>List view</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Display settings */}
      <Popover>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Display settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <PopoverContent align="end" className="w-64">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-3">Display Settings</h4>
            </div>

            <Separator />

            {/* Grid columns (only for grid view) */}
            {preferences.viewMode === 'grid' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Grid Columns</Label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map((cols) => (
                      <Button
                        key={cols}
                        variant={preferences.gridColumns === cols ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGridColumns(cols)}
                        className="flex-1"
                      >
                        {cols}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Show thumbnails (grid view only) */}
            {preferences.viewMode === 'grid' && (
              <div className="flex items-center justify-between">
                <Label htmlFor="show-thumbnails" className="text-sm cursor-pointer">
                  Show Thumbnails
                </Label>
                <Switch
                  id="show-thumbnails"
                  checked={preferences.showThumbnails}
                  onCheckedChange={toggleShowThumbnails}
                />
              </div>
            )}

            {/* Show stats */}
            <div className="flex items-center justify-between">
              <Label htmlFor="show-stats" className="text-sm cursor-pointer">
                Show Statistics
              </Label>
              <Switch
                id="show-stats"
                checked={preferences.showStats}
                onCheckedChange={toggleShowStats}
              />
            </div>

            {/* Compact mode */}
            <div className="flex items-center justify-between">
              <Label htmlFor="compact-mode" className="text-sm cursor-pointer">
                Compact Mode
              </Label>
              <Switch
                id="compact-mode"
                checked={preferences.compactMode}
                onCheckedChange={toggleCompactMode}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
