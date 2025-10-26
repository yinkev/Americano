'use client'

import { motion } from 'motion/react'
import { Upload, Play, Library, FolderPlus, Rocket, FileText } from 'lucide-react'
import { Section } from '@/components/ui/section'
import Link from 'next/link'
import { springSmooth, springSubtle, gridContainerVariants, gridItemVariants } from '@/lib/design-system'

const actions = [
  {
    id: 'upload',
    label: 'Upload Lecture',
    description: 'PDF or slides',
    icon: Upload,
    color: 'oklch(0.75 0.12 240)', // Primary Blue
    href: '/library?action=upload',
  },
  {
    id: 'session',
    label: 'Start Session',
    description: 'Begin studying',
    icon: Play,
    color: 'oklch(0.70 0.15 150)', // Secondary Green
    href: '/study',
  },
  {
    id: 'library',
    label: 'Browse Library',
    description: 'View lectures',
    icon: Library,
    color: 'oklch(0.78 0.13 340)', // Accent Pink
    href: '/library',
  },
  {
    id: 'create',
    label: 'Create Course',
    description: 'Organize content',
    icon: FolderPlus,
    color: 'oklch(0.8 0.15 90)', // Warning Yellow
    href: '/library?action=create-course',
  },
  {
    id: 'quiz',
    label: 'Start Quiz',
    description: 'Timed practice',
    icon: Rocket,
    color: 'oklch(0.70 0.14 210)', // Teal-ish accent
    href: '/study?mode=quiz',
  },
  {
    id: 'notes',
    label: 'Upload Notes',
    description: 'Text or docs',
    icon: FileText,
    color: 'oklch(0.74 0.10 250)', // Cool blue
    href: '/library?action=upload-notes',
  },
]

export function QuickActions() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springSmooth, delay: 0.3 }}>
      <Section title="Quick Actions">
        <motion.div className="grid grid-cols-2 gap-3" variants={gridContainerVariants} initial="initial" animate="animate">
          {actions.map((action) => (
            <motion.div key={action.id} variants={gridItemVariants} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }}>
              <Link href={action.href} className="group rounded-xl p-3 text-center cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-muted">
                <div className="rounded-full p-3 transition-transform duration-300 group-hover:scale-110 bg-transparent" style={{ color: action.color }}>
                  <action.icon className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mt-1">{action.label}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Section>
    </motion.div>
  )
}
