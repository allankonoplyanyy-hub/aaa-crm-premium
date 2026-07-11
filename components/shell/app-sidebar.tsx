'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Sparkles, LogOut, ChevronsUpDown, Building } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { visibleSections } from '@/lib/nav'
import { useWorkspace } from '@/hooks/use-workspace'
import { apiFetch } from '@/lib/api'
import { ROLE_LABELS } from '@/lib/labels'

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data, mutate } = useWorkspace()
  const { setOpenMobile } = useSidebar()

  const session = data?.session
  const sections = session ? visibleSections(session.role) : []
  const activeTenant = data?.tenants.find((t) => t.id === session?.activeCompanyId)

  async function switchCompany(companyId: string) {
    await apiFetch('/api/company/switch', { method: 'POST', body: { companyId } })
    await mutate()
  }

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">AAA CRM</p>
            <p className="truncate text-xs text-muted-foreground">
              {activeTenant?.name ?? 'AI-платформа продаж'}
            </p>
          </div>
        </div>

        {session?.role === 'owner' && data && data.tenants.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-2.5 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent"
                >
                  <Building className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate font-medium">{activeTenant?.name}</span>
                  <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
              }
            />
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Компании платформы</DropdownMenuLabel>
              <DropdownMenuGroup>
                {data.tenants.map((t) => (
                  <DropdownMenuItem key={t.id} onClick={() => switchCompany(t.id)}>
                    <span className="flex-1 truncate">{t.name}</span>
                    {t.id === session.activeCompanyId && (
                      <Badge variant="secondary" className="ml-2">
                        активна
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      render={
                        <Link href={item.url} onClick={() => setOpenMobile(false)}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {session && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {session.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">{session.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ROLE_LABELS[session.role]}
                    </p>
                  </div>
                  <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
              }
            />
            <DropdownMenuContent className="w-56" align="start" side="top">
              <DropdownMenuLabel>
                <p>{session.name}</p>
                <p className="text-xs font-normal text-muted-foreground">{session.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={logout} variant="destructive">
                  <LogOut />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
