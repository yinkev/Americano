/**
 * Graph Controls Component
 *
 * Premium control panel for knowledge graph visualization
 * - Layout selection (force, hierarchical, circular, radial)
 * - Zoom controls
 * - Node/edge customization
 * - Animation settings
 * - Export options
 */

'use client'

import {
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  type GraphLayout,
  selectGraphPreferences,
  useGraphStore,
} from '@/stores'

export interface GraphControlsProps {
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetZoom?: () => void
  onFitToCanvas?: () => void
  onExport?: (format: 'png' | 'svg' | 'json') => void
}

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToCanvas,
  onExport,
}: GraphControlsProps) {
  const preferences = useGraphStore(selectGraphPreferences)
  const {
    setLayout,
    toggleNodeLabel,
    toggleRelationships,
    setNodeSize,
    setLinkDistance,
    setLinkStrength,
    setChargeStrength,
    toggleHighlightConnected,
    toggleDimUnrelated,
    resetPreferences,
  } = useGraphStore()

  const [showAdvanced, setShowAdvanced] = React.useState(false)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Graph Controls
            </CardTitle>
            <CardDescription>Customize graph visualization and behavior</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={resetPreferences}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to defaults</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Zoom Controls */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">View Controls</Label>
          <div className="grid grid-cols-4 gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onZoomIn} className="w-full">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onZoomOut} className="w-full">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onResetZoom} className="w-full">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset View</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onFitToCanvas} className="w-full">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fit to Canvas</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Separator />

        {/* Layout Selection */}
        <div className="space-y-3">
          <Label htmlFor="layout" className="text-sm font-semibold">
            <LayoutGrid className="h-4 w-4 inline mr-2" />
            Graph Layout
          </Label>
          <Select value={preferences.layout} onValueChange={(v) => setLayout(v as GraphLayout)}>
            <SelectTrigger id="layout">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="force">Force-Directed</SelectItem>
              <SelectItem value="hierarchical">Hierarchical</SelectItem>
              <SelectItem value="circular">Circular</SelectItem>
              <SelectItem value="radial">Radial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Display Options */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Display Options</Label>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-labels" className="text-sm cursor-pointer">
              Show Node Labels
            </Label>
            <Switch
              id="show-labels"
              checked={preferences.showLabels}
              onCheckedChange={toggleNodeLabel}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-relationships" className="text-sm cursor-pointer">
              Show Relationships
            </Label>
            <Switch
              id="show-relationships"
              checked={preferences.showRelationships}
              onCheckedChange={toggleRelationships}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="highlight-connected" className="text-sm cursor-pointer">
              Highlight Connected
            </Label>
            <Switch
              id="highlight-connected"
              checked={preferences.highlightConnected}
              onCheckedChange={toggleHighlightConnected}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="dim-unrelated" className="text-sm cursor-pointer">
              Dim Unrelated Nodes
            </Label>
            <Switch
              id="dim-unrelated"
              checked={preferences.dimUnrelated}
              onCheckedChange={toggleDimUnrelated}
            />
          </div>
        </div>

        <Separator />

        {/* Advanced Settings */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-between"
          >
            <span className="text-sm font-semibold">Advanced Settings</span>
            {showAdvanced ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>

          {showAdvanced && (
            <div className="space-y-4 pt-2">
              {/* Node Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="node-size" className="text-sm">
                    Node Size
                  </Label>
                  <span className="text-xs text-muted-foreground">{preferences.nodeSize}</span>
                </div>
                <Slider
                  id="node-size"
                  min={4}
                  max={20}
                  step={1}
                  value={[preferences.nodeSize]}
                  onValueChange={([value]) => setNodeSize(value)}
                />
              </div>

              {/* Link Distance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="link-distance" className="text-sm">
                    Link Distance
                  </Label>
                  <span className="text-xs text-muted-foreground">{preferences.linkDistance}</span>
                </div>
                <Slider
                  id="link-distance"
                  min={50}
                  max={300}
                  step={10}
                  value={[preferences.linkDistance]}
                  onValueChange={([value]) => setLinkDistance(value)}
                />
              </div>

              {/* Link Strength */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="link-strength" className="text-sm">
                    Link Strength
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {preferences.linkStrength.toFixed(2)}
                  </span>
                </div>
                <Slider
                  id="link-strength"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[preferences.linkStrength]}
                  onValueChange={([value]) => setLinkStrength(value)}
                />
              </div>

              {/* Charge Strength */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="charge-strength" className="text-sm">
                    Charge Strength
                  </Label>
                  <span className="text-xs text-muted-foreground">{preferences.chargeStrength}</span>
                </div>
                <Slider
                  id="charge-strength"
                  min={-500}
                  max={-100}
                  step={10}
                  value={[preferences.chargeStrength]}
                  onValueChange={([value]) => setChargeStrength(value)}
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Export Options */}
        {onExport && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              <Download className="h-4 w-4 inline mr-2" />
              Export Graph
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => onExport('png')} className="w-full">
                PNG
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport('svg')} className="w-full">
                SVG
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport('json')} className="w-full">
                JSON
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
