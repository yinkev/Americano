import Link from 'next/link'
import type { ReactNode } from 'react'

export default function PersonalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
          <span className="font-semibold">Americano · Personal</span>
          <nav className="text-sm flex items-center gap-4 opacity-90">
            <Link href="/personal/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/personal/adaptive" className="hover:underline">
              Adaptive
            </Link>
            <Link href="/personal/validation" className="hover:underline">
              Validation
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
