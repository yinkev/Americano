'use client'

import { motion } from 'motion/react'
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
  FlaskConical,
  Trophy,
  Star,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUserStore } from '@/store/use-user-store'
import {
  springSubtle,
  springResponsive,
  buttonIconVariants,
  listItemVariants,
} from '@/lib/design-system'

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
import { ThemeToggle } from '@/components/theme-toggle'

// Main navigation items
const navItems = [
  {
    title: 'Home',
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
    title: 'Quests',
    url: '/quests',
    icon: Trophy,
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
    title: 'Insights',
    url: '/analytics/behavioral-insights',
    icon: Brain,
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

  const activeUser = users.find((u) => u.email === userEmail) || users[0]

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-none bg-sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-card">
              <Link href="/">
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-none">
                  <Star className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-md leading-tight">
                  <span className="truncate font-bold font-heading">Americano</span>
                  <span className="truncate text-sm text-muted-foreground">
                    Your Study Buddy
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Theme Toggle - Positioned below logo */}
        <div className="px-2 py-2">
          <ThemeToggle />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground/80 px-2">
            Explore
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="gap-2">
              {navItems.map((item, index) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <motion.div
                      variants={listItemVariants}
                      initial="initial"
                      animate="animate"
                      custom={index}
                      whileHover={{
                        scale: 1.02,
                        x: isActive ? 0 : 4,
                        transition: springResponsive,
                      }}
                      whileTap={{
                        scale: 0.98,
                        transition: springResponsive,
                      }}
                    >
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                        className={`
                          rounded-xl transition-all duration-300 font-semibold
                          ${
                            isActive
                              ? 'bg-card text-primary shadow-none'
                              : 'hover:bg-card hover:shadow-none'
                          }
                        `}
                      >
                        <Link href={item.url}>
                          <motion.div
                            animate={{
                              rotate: isActive ? [0, -10, 10, -10, 0] : 0,
                            }}
                            transition={{
                              duration: 0.5,
                              ease: 'easeInOut',
                            }}
                          >
                            <item.icon className={'size-5'} />
                          </motion.div>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="hover:bg-card hover:shadow-none transition-all duration-300 rounded-xl data-[state=open]:bg-card"
                >
                  <Avatar className="size-10 rounded-xl shadow-none">
                    <AvatarFallback className="rounded-xl bg-primary text-primary-foreground font-bold">
                      {activeUser.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{activeUser.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {activeUser.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground/60" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-[--radix-popper-anchor-width] bg-card shadow-none border rounded-xl p-2"
              >
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground/80">
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
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-card text-primary font-semibold text-sm">
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
                <div className="h-px bg-card my-2" />
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
