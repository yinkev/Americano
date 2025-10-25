import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { ChatFAB } from '@/components/ai/chat-fab'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Americano - Medical Learning Platform',
  description: 'AI-powered personalized medical education platform for medical students',
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
  themeColor: 'oklch(0.64 0.17 250)',
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
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <main className="flex-1 p-8">
                  <header className="flex h-16 shrink-0 items-center gap-3">
                    <SidebarTrigger className="flex items-center justify-center size-9 rounded-xl bg-white hover:bg-white/70 shadow-[0_2px_8px_rgba(31,38,135,0.08)] hover:shadow-[0_4px_12px_rgba(31,38,135,0.12)] transition-all duration-200 border border-white/40" />
                    <div className="h-5 w-px bg-border/30" />
                    <h1 className="text-lg font-heading font-bold text-primary">Americano</h1>
                  </header>
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
            <ChatFAB />
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
