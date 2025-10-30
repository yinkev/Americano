import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Search - Americano',
  description: 'Search medical lectures, concepts, and study materials',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Americano Search',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function MobileSearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
