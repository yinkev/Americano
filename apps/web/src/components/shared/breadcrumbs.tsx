'use client'

import Link from 'next/link'
import { Home, ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      {/* Home Icon */}
      <Link
        href="/"
        className="flex items-center justify-center size-8 rounded-lg text-[oklch(0.556_0_0)]
                   hover:text-[oklch(0.7_0.15_230)] hover:bg-card transition-colors duration-200
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]"
        aria-label="Home"
      >
        <Home className="size-4" />
      </Link>

      {/* Breadcrumb Items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center gap-2">
            {/* Chevron Separator */}
            <ChevronRight className="size-4 text-[oklch(0.922_0_0)]" aria-hidden="true" />

            {/* Breadcrumb Item */}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-[oklch(0.556_0_0)] hover:text-[oklch(0.7_0.15_230)]
                           hover:underline transition-colors duration-200 truncate max-w-[200px]
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]
                           rounded px-1 py-0.5"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`truncate max-w-[200px] ${
                  isLast ? 'text-[oklch(0.145_0_0)] font-medium' : 'text-[oklch(0.556_0_0)]'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
