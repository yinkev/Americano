'use client'

/**
 * 2025 World-Class Gamified Learning Sidebar
 *
 * Based on research:
 * - Loss Aversion: 18.40% more engagement from streak protection
 * - Progress Visualization: Drives completion behavior
 * - Flat Design: NO gradients, OKLCH colors only
 * - Duolingo Principles: Useful, Intuitive, Delightful, Polish
 */

import {
  BarChart2,
  BookOpen,
  Brain,
  Calendar,
  Flame,
  FlaskConical,
  Home,
  Library,
  Settings,
  Target,
} from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { GoalProgress } from './dashboard/GoalProgress'

const navItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Library', url: '/library', icon: Library },
  { title: 'Study', url: '/study', icon: BookOpen },
  { title: 'Progress', url: '/progress', icon: BarChart2 },
  { title: 'Insights', url: '/analytics/behavioral-insights', icon: Brain },
  { title: 'Experiments', url: '/analytics/experiments', icon: FlaskConical },
  { title: 'Exams', url: '/settings/exams', icon: Calendar },
  { title: 'Settings', url: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  // Mock data - replace with real data from API
  const streakDays = 5
  const weeklyGoalProgress = 78 // percentage
  const cardsMastered = 87

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-none">
      {/* Loss Aversion Section - Critical for engagement */}
      <SidebarHeader className="border-b border-border/30 p-3 space-y-3">
        {/* Streak Counter - Prominent */}
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--streak-fire)] shadow-sm">
              <Flame className="h-5 w-5 text-[var(--streak-foreground)]" />
              <span className="text-base font-bold text-[var(--streak-foreground)] group-data-[collapsible=icon]:hidden">
                {streakDays}
              </span>
            </div>
            <span className="text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
              day streak
            </span>
          </div>
        </div>

        {/* Weekly Progress - Progress Visualization */}
        <div className="group-data-[collapsible=icon]:hidden">
          <GoalProgress
            current={weeklyGoalProgress}
            goal={100}
            label="Weekly Goal"
            color="var(--xp-purple)"
            height="sm"
            milestones={[
              { percentage: 50, reached: weeklyGoalProgress >= 50 },
              { percentage: 100, label: 'Goal!', reached: weeklyGoalProgress >= 100 },
            ]}
          />
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-[var(--mastery-green)]/10">
            <Target className="h-4 w-4 text-[var(--mastery-green)]" />
            <span className="text-sm font-semibold text-foreground">{cardsMastered}</span>
            <span className="text-xs text-muted-foreground">mastered</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation - Compact & Flat */}
      <SidebarContent className="bg-background">
        <SidebarGroup className="px-3">
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      className={`
                        rounded transition-all h-[28px] text-sm
                        ${
                          isActive
                            ? 'bg-card shadow-sm border border-border/50 text-foreground font-medium'
                            : 'hover:bg-muted/50'
                        }
                      `}
                    >
                      <Link href={item.url}>
                        <item.icon
                          className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Section - Minimal */}
      <SidebarFooter className="border-t border-border/30 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" className="h-[28px]">
              <Avatar className="h-6 w-6 rounded-full">
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                  K
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold truncate">Kevy</span>
                <span className="text-xs text-muted-foreground truncate mt-1">PNWU Med</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
