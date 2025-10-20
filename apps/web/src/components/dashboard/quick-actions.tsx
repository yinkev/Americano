'use client'

import { Upload, Play, Library, FolderPlus } from 'lucide-react'

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
    <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6">
      {/* Card Header */}
      <h2 className="text-xl font-heading font-semibold text-[oklch(0.145_0_0)] mb-4">
        Quick Actions
      </h2>

      {/* Actions Grid - 2x2 on all screens */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            className="group rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 p-4
                       hover:bg-white/80 hover:scale-[1.02] transition-all duration-200
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]
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
              <p className="text-sm font-medium text-[oklch(0.145_0_0)] leading-tight">
                {action.label}
              </p>
              <p className="text-xs text-[oklch(0.556_0_0)] mt-0.5">{action.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
