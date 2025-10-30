'use client'

import { BarChart3, BookOpen, Search, Upload } from 'lucide-react'
import React from 'react'
import { Card } from '@/components/ui/card'

const actions = [
  {
    icon: Upload,
    label: 'Upload',
    color: 'var(--primary)',
  },
  {
    icon: Search,
    label: 'Search',
    color: 'var(--accent-energy)',
  },
  {
    icon: BookOpen,
    label: 'Library',
    color: 'var(--mastery-green)',
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    color: 'var(--xp-gold)',
  },
]

export function QuickActions() {
  return (
    <Card className="p-4 shadow-md border-border/50">
      <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, idx) => (
          <button
            key={idx}
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all group hover:scale-105"
          >
            <div
              className="p-2 rounded-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${action.color}20` }}
            >
              <action.icon className="h-4 w-4" style={{ color: action.color }} />
            </div>
            <p className="text-xs font-medium">{action.label}</p>
          </button>
        ))}
      </div>

      {/* TODO: Backend Integration */}
      {/* These buttons should navigate to different sections or trigger modals */}
      {/* - Upload: POST /api/lectures/upload */}
      {/* - Search: Opens command palette or search modal */}
      {/* - Library: Navigate to /library */}
      {/* - Analytics: Navigate to /analytics */}
    </Card>
  )
}
