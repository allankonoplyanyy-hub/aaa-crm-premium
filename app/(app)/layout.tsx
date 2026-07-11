import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server/auth'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/shell/app-sidebar'
import { AppTopbar } from '@/components/shell/app-topbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <AppTopbar />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
