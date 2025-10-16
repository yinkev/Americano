'use client'

import {
  Bell,
  BellOff,
  Clock,
  Coffee,
  CreditCard,
  Focus,
  Minimize2,
  RotateCcw,
  Settings,
} from 'lucide-react'
import { useId, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { SessionSettings } from '@/store/use-session-store'

interface SessionSettingsPanelProps {
  settings: SessionSettings
  onUpdateSettings: (settings: Partial<SessionSettings>) => void
  onResetSettings: () => void
  variant?: 'dropdown' | 'inline'
}

interface SettingsContentProps {
  settings: SessionSettings
  onUpdateSettings: (settings: Partial<SessionSettings>) => void
  showResetConfirm: boolean
  handleReset: () => void
}

/**
 * Settings Content Component (Story 2.5 Task 10)
 *
 * Internal component that renders all session settings controls.
 * Extracted to avoid nested component definition issues.
 */
function SettingsContent({
  settings,
  onUpdateSettings,
  showResetConfirm,
  handleReset,
}: SettingsContentProps) {
  // Generate unique IDs for all form controls
  const autoAdvanceId = useId()
  const pomodoroModeId = useId()
  const enableBreaksId = useId()
  const focusModeId = useId()
  const minimizeModeId = useId()
  const disableNotificationsId = useId()

  return (
    <div className="space-y-6 p-4">
      {/* Auto-Advance Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: 'oklch(0.55 0.2 250)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.3 0.15 250)' }}>
            Auto-Advance
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor={autoAdvanceId} className="text-sm">
            Auto-advance objectives
          </Label>
          <Switch
            id={autoAdvanceId}
            checked={settings.autoAdvance}
            onCheckedChange={(checked) => onUpdateSettings({ autoAdvance: checked })}
          />
        </div>

        {settings.autoAdvance && (
          <div className="space-y-2 pl-4">
            <Label className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
              Delay: {settings.autoAdvanceDelay / 1000}s
            </Label>
            <Slider
              value={[settings.autoAdvanceDelay]}
              onValueChange={([value]) => onUpdateSettings({ autoAdvanceDelay: value })}
              min={1000}
              max={10000}
              step={1000}
              className="w-full"
            />
          </div>
        )}
      </div>

      <DropdownMenuSeparator />

      {/* Time Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: 'oklch(0.55 0.2 250)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.3 0.15 250)' }}>
            Time Alerts
          </h3>
        </div>

        <div className="space-y-2">
          <Label className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
            Alert at:
          </Label>
          <div className="flex flex-wrap gap-2">
            {[50, 80, 100, 120].map((percent) => (
              <Badge
                key={percent}
                variant={settings.objectiveTimeAlerts.includes(percent) ? 'default' : 'outline'}
                className="cursor-pointer min-h-[32px]"
                onClick={() => {
                  const newAlerts = settings.objectiveTimeAlerts.includes(percent)
                    ? settings.objectiveTimeAlerts.filter((p) => p !== percent)
                    : [...settings.objectiveTimeAlerts, percent].sort((a, b) => a - b)
                  onUpdateSettings({ objectiveTimeAlerts: newAlerts })
                }}
                style={
                  settings.objectiveTimeAlerts.includes(percent)
                    ? {
                        background: 'oklch(0.55 0.2 250)',
                        color: 'oklch(1 0 0)',
                      }
                    : {}
                }
              >
                {percent}%
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <DropdownMenuSeparator />

      {/* Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" style={{ color: 'oklch(0.55 0.2 250)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.3 0.15 250)' }}>
            Flashcards
          </h3>
        </div>

        <div className="space-y-2">
          <Label className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
            Cards per objective:{' '}
            {settings.cardsPerObjective === 0 ? 'All' : settings.cardsPerObjective}
          </Label>
          <Slider
            value={[settings.cardsPerObjective]}
            onValueChange={([value]) => onUpdateSettings({ cardsPerObjective: value })}
            min={0}
            max={10}
            step={1}
            className="w-full"
          />
          <p className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
            {settings.cardsPerObjective === 0
              ? 'Review all available cards'
              : `Review up to ${settings.cardsPerObjective} card${settings.cardsPerObjective === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      <DropdownMenuSeparator />

      {/* Pomodoro Mode Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Coffee className="w-4 h-4" style={{ color: 'oklch(0.55 0.2 250)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.3 0.15 250)' }}>
            Pomodoro Mode
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor={pomodoroModeId} className="text-sm">
            Enable Pomodoro
          </Label>
          <Switch
            id={pomodoroModeId}
            checked={settings.pomodoroMode}
            onCheckedChange={(checked) => onUpdateSettings({ pomodoroMode: checked })}
          />
        </div>

        {settings.pomodoroMode && (
          <div className="space-y-3 pl-4">
            <div className="space-y-2">
              <Label className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
                Focus block: {settings.focusBlockMinutes}m
              </Label>
              <Slider
                value={[settings.focusBlockMinutes]}
                onValueChange={([value]) => onUpdateSettings({ focusBlockMinutes: value })}
                min={15}
                max={60}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
                Short break: {settings.shortBreakMinutes}m
              </Label>
              <Slider
                value={[settings.shortBreakMinutes]}
                onValueChange={([value]) => onUpdateSettings({ shortBreakMinutes: value })}
                min={3}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
                Long break: {settings.longBreakMinutes}m
              </Label>
              <Slider
                value={[settings.longBreakMinutes]}
                onValueChange={([value]) => onUpdateSettings({ longBreakMinutes: value })}
                min={10}
                max={30}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
                Long break after: {settings.objectivesUntilLongBreak} objectives
              </Label>
              <Slider
                value={[settings.objectivesUntilLongBreak]}
                onValueChange={([value]) => onUpdateSettings({ objectivesUntilLongBreak: value })}
                min={2}
                max={6}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor={enableBreaksId} className="text-sm">
            Break reminders
          </Label>
          <Switch
            id={enableBreaksId}
            checked={settings.enableBreaks}
            onCheckedChange={(checked) => onUpdateSettings({ enableBreaks: checked })}
          />
        </div>
      </div>

      <DropdownMenuSeparator />

      {/* Focus & Distraction Management */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Focus className="w-4 h-4" style={{ color: 'oklch(0.55 0.2 250)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.3 0.15 250)' }}>
            Focus Management
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Focus className="w-3 h-3" style={{ color: 'oklch(0.5 0.1 250)' }} />
              <Label htmlFor={focusModeId} className="text-sm">
                Focus mode
              </Label>
            </div>
            <Switch
              id={focusModeId}
              checked={settings.focusMode}
              onCheckedChange={(checked) => onUpdateSettings({ focusMode: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Minimize2 className="w-3 h-3" style={{ color: 'oklch(0.5 0.1 250)' }} />
              <Label htmlFor={minimizeModeId} className="text-sm">
                Minimize mode
              </Label>
            </div>
            <Switch
              id={minimizeModeId}
              checked={settings.minimizeMode}
              onCheckedChange={(checked) => onUpdateSettings({ minimizeMode: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellOff className="w-3 h-3" style={{ color: 'oklch(0.5 0.1 250)' }} />
              <Label htmlFor={disableNotificationsId} className="text-sm">
                Disable notifications
              </Label>
            </div>
            <Switch
              id={disableNotificationsId}
              checked={settings.disableNotifications}
              onCheckedChange={(checked) => onUpdateSettings({ disableNotifications: checked })}
            />
          </div>
        </div>
      </div>

      <DropdownMenuSeparator />

      {/* Reset Settings */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="w-full min-h-[40px]"
          style={
            showResetConfirm
              ? {
                  background: 'oklch(0.5 0.2 0 / 0.1)',
                  borderColor: 'oklch(0.5 0.2 0)',
                }
              : {}
          }
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {showResetConfirm ? 'Click again to confirm' : 'Reset to defaults'}
        </Button>
      </div>
    </div>
  )
}

/**
 * Session Settings Panel (Story 2.5 Task 10)
 *
 * Comprehensive settings for session orchestration including:
 * - Auto-advance configuration
 * - Objective time alerts
 * - Cards per objective
 * - Pomodoro mode
 * - Focus and distraction management
 */
export function SessionSettingsPanel({
  settings,
  onUpdateSettings,
  onResetSettings,
  variant = 'dropdown',
}: SessionSettingsPanelProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleReset = () => {
    if (showResetConfirm) {
      onResetSettings()
      setShowResetConfirm(false)
    } else {
      setShowResetConfirm(true)
      setTimeout(() => setShowResetConfirm(false), 3000)
    }
  }

  if (variant === 'inline') {
    return (
      <div
        className="rounded-2xl backdrop-blur-md"
        style={{
          background: 'oklch(1 0 0 / 0.9)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
        }}
      >
        <SettingsContent
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          showResetConfirm={showResetConfirm}
          handleReset={handleReset}
        />
      </div>
    )
  }

  // Dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="min-h-[44px]">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] max-h-[600px] overflow-y-auto">
        <DropdownMenuLabel>Session Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <SettingsContent
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          showResetConfirm={showResetConfirm}
          handleReset={handleReset}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
