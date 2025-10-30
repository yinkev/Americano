import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export default function WithSidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="flex h-screen w-full overflow-hidden">
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-white shadow-sm px-4">
          <SidebarTrigger className="flex items-center justify-center size-9 rounded-xl bg-card hover:bg-muted shadow-sm hover:shadow-md transition-all duration-200 border border-border" />
          <div className="h-5 w-px bg-border/30" />
          <h1 className="text-lg font-heading font-bold text-primary">Americano</h1>
        </header>
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
