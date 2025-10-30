import type { Metadata, Viewport } from 'next'
import { ChatFAB } from '@/components/ai/chat-fab'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
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
  themeColor: '#0066cc',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full bg-background font-sans antialiased">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <ChatFAB />
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
