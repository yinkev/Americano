'use client'

import { Upload, Play, Library, FolderPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const actions = [
  {
    id: 'upload',
    label: 'Upload Lecture',
    description: 'PDF or slides',
    icon: Upload,
    color: 'oklch(0.7_0.15_230)', // Blue
    href: '/library?action=upload',
  },
  {
    id: 'session',
    label: 'Start Session',
    description: 'Begin studying',
    icon: Play,
    color: 'oklch(0.75_0.15_160)', // Green
    href: '/study',
  },
  {
    id: 'library',
    label: 'Browse Library',
    description: 'View lectures',
    icon: Library,
    color: 'oklch(0.7_0.15_290)', // Purple
    href: '/library',
  },
  {
    id: 'create',
    label: 'Create Course',
    description: 'Organize content',
    icon: FolderPlus,
    color: 'oklch(0.8_0.15_85)', // Amber
    href: '/library?action=create-course',
  },
]

export function QuickActions() {
  return (
    <Card interactive="static" className="bg-white/80 backdrop-blur-md border-white/30">
      <CardHeader>
        <CardTitle className="text-xl font-heading font-semibold">Quick Actions</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Actions Grid - 2x2 on all screens */}
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="group rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 p-4
                         hover:bg-white/80 hover:scale-[1.02] transition-all duration-200
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
                         min-h-[100px] flex flex-col items-center justify-center text-center gap-2"
            >
              {/* Icon */}
              <div
                className="rounded-lg p-3 transition-transform duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: `color-mix(in oklch, ${action.color} 10%, transparent)`,
                }}
              >
                <action.icon className="size-6" style={{ color: action.color }} />
              </div>

              {/* Label */}
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
