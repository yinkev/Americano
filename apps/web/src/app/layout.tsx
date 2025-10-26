import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { AppShell } from '@/components/layout/app-shell'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Americano - Your Study Buddy',
  description: 'A soft, playful, and gamified medical learning platform.',
  manifest: '/manifest.json',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Americano',
  },

  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: 'oklch(0.75 0.12 240)',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AppShell showSidebar={true} showHeader={true}>
              {children}
            </AppShell>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
