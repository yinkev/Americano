'use client'

/**
 * TopHeader - Application Header
 * Features:
 * - Global search with cmd+k shortcut
 * - Notifications with badge
 * - Profile menu
 * - Breadcrumbs
 * - Sticky positioning with shadow-none on scroll
 */

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Search, Bell, ChevronRight, Command } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { springResponsive, buttonIconVariants, spacing } from '@/lib/design-system'
import { useUserStore } from '@/store/use-user-store'

// Navigation mapping for breadcrumbs
const routeTitles: Record<string, string> = {
  '/': 'Home',
  '/library': 'Library',
  '/study': 'Study',
  '/quests': 'Quests',
  '/progress': 'Progress',
  '/priorities': 'Priorities',
  '/analytics/behavioral-insights': 'Behavioral Insights',
  '/settings': 'Settings',
}

export function TopHeader() {
  const pathname = usePathname()
  const { userEmail } = useUserStore()
  const [searchOpen, setSearchOpen] = useState(false)

  // Active user
  const activeUser = {
    name: userEmail === 'dumpling@americano.demo' ? 'Dumpling' : 'Kevy',
    avatar: userEmail === 'dumpling@americano.demo' ? 'D' : 'K',
  }

  // Breadcrumb generation
  const breadcrumbs = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, array) => {
      const path = '/' + array.slice(0, index + 1).join('/')
      const title = routeTitles[path] || segment.charAt(0).toUpperCase() + segment.slice(1)
      return { path, title }
    })

  // Add home if not root
  if (pathname !== '/') {
    breadcrumbs.unshift({ path: '/', title: 'Home' })
  }

  // No header shadow on scroll in 2025 flat UI

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <motion.header
      className={`sticky top-0 z-40 bg-background`}
      style={{ padding: `${spacing[4]}px ${spacing[8]}px` }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', ...springResponsive }}
    >
      <div className="flex items-center gap-4">
        {/* Sidebar Trigger */}
        <motion.div variants={buttonIconVariants} whileHover="hover" whileTap="tap">
          <SidebarTrigger aria-label="Toggle sidebar" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors duration-200" />
        </motion.div>

        {/* Divider removed for cleaner flat look */}

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-medium">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              <a
                href={crumb.path}
                className={`transition-colors hover:text-primary ${
                  index === breadcrumbs.length - 1
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground'
                }`}
              >
                {crumb.title}
              </a>
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              type="text"
              placeholder="Search..."
              className="w-64 rounded-xl border-transparent bg-card pl-9 pr-12 shadow-none focus:border-primary/50 focus:ring-primary/20"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
              readOnly
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 flex h-5 -translate-y-1/2 items-center gap-1 rounded bg-muted px-1.5 font-mono text-xs text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div variants={buttonIconVariants} whileHover="hover" whileTap="tap">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 rounded-xl hover:bg-card"
                >
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary p-0 text-xs text-primary-foreground">
                    3
                  </Badge>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 rounded-xl bg-card border-none shadow-none p-2"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-semibold">Notifications</p>
                <p className="text-xs text-muted-foreground">You have 3 unread messages</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">New achievement unlocked!</p>
                  <p className="text-xs text-muted-foreground">5 days study streak</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Quiz ready for review</p>
                  <p className="text-xs text-muted-foreground">Cardiology - 15 cards</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Weekly progress report</p>
                  <p className="text-xs text-muted-foreground">You're doing great!</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div variants={buttonIconVariants} whileHover="hover" whileTap="tap">
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-xl hover:bg-card p-0"
                >
                  <Avatar className="h-9 w-9 rounded-xl">
                    <AvatarFallback className="rounded-xl bg-primary text-primary-foreground font-bold">
                      {activeUser.avatar}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl bg-card border-none shadow-none p-2"
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-card text-primary font-semibold">
                    {activeUser.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{activeUser.name}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-xl cursor-pointer">Profile</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl cursor-pointer">Settings</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl cursor-pointer">Help</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-xl cursor-pointer text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  )
}
