'use client'

import {
  Home,
  Library,
  BookOpen,
  BarChart2,
  Settings,
  ChevronsUpDown,
  Check,
  Sparkles,
  Calendar,
  Clock,
  Brain,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUserStore } from '@/store/use-user-store'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Main navigation items
const navItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
  },
  {
    title: 'Library',
    url: '/library',
    icon: Library,
  },
  {
    title: 'Study',
    url: '/study',
    icon: BookOpen,
  },
  {
    title: 'Orchestration',
    url: '/study/orchestration',
    icon: Clock,
  },
  {
    title: 'Progress',
    url: '/progress',
    icon: BarChart2,
  },
  {
    title: 'Priorities',
    url: '/priorities',
    icon: Sparkles,
  },
  {
    title: 'Behavioral Insights',
    url: '/analytics/behavioral-insights',
    icon: Brain,
  },
  {
    title: 'Exams',
    url: '/settings/exams',
    icon: Calendar,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
]

const users = [
  {
    name: 'Kevy',
    email: 'kevy@americano.dev',
    avatar: 'K',
  },
  {
    name: 'Dumpling',
    email: 'dumpling@americano.demo',
    avatar: 'D',
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { userEmail, setUserEmail } = useUserStore()

  // Find active user based on stored email
  const activeUser = users.find((u) => u.email === userEmail) || users[0]

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-none">
      <SidebarHeader className="border-b border-white/20 bg-white/95 backdrop-blur-xl shadow-[0_4px_16px_rgba(31,38,135,0.06)]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-white/60">
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                  <BookOpen className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-heading font-bold">Americano</span>
                  <span className="truncate text-xs text-muted-foreground/80">
                    Medical Learning
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-white/90 backdrop-blur-xl">
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      className={`
                        rounded-xl transition-all duration-200 font-medium
                        ${
                          isActive
                            ? 'bg-white shadow-[0_4px_16px_rgba(31,38,135,0.12)] text-foreground'
                            : 'hover:bg-white/70 hover:shadow-[0_2px_8px_rgba(31,38,135,0.06)]'
                        }
                      `}
                    >
                      <Link href={item.url}>
                        <item.icon className={isActive ? 'text-primary' : ''} />
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

      <SidebarFooter className="border-t border-white/20 bg-white/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(31,38,135,0.06)] p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="hover:bg-white/70 hover:shadow-[0_2px_12px_rgba(31,38,135,0.08)] transition-all duration-200 rounded-xl data-[state=open]:bg-white/70"
                >
                  <Avatar className="size-8 rounded-xl shadow-sm">
                    <AvatarFallback className="rounded-xl bg-primary text-primary-foreground font-bold">
                      {activeUser.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{activeUser.name}</span>
                    <span className="truncate text-xs text-muted-foreground/80">
                      {activeUser.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground/60" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-[--radix-popper-anchor-width] bg-white/98 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.15)] border-white/40 rounded-2xl p-2"
              >
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground/70">
                  Switch Account
                </div>
                {users.map((user) => (
                  <DropdownMenuItem
                    key={user.email}
                    onClick={() => {
                      setUserEmail(user.email)
                      router.refresh()
                    }}
                    className="rounded-xl gap-2 cursor-pointer"
                  >
                    <Avatar className="size-6 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-xs">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground/70">{user.email}</span>
                    </div>
                    {activeUser.email === user.email && <Check className="size-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <div className="h-px bg-border/50 my-2" />
                <DropdownMenuItem className="rounded-xl text-muted-foreground">
                  <Settings className="size-4 mr-2" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
