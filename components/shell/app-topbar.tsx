'use client'

import { usePathname } from 'next/navigation'
import { Eye } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { pageTitle } from '@/lib/nav'
import { useWorkspace } from '@/hooks/use-workspace'

export function AppTopbar() {
  const pathname = usePathname()
  const { data } = useWorkspace()
  const session = data?.session

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5!" />
      <h1 className="text-sm font-semibold">{pageTitle(pathname)}</h1>
      <div className="flex-1" />
      {session?.role === 'viewer' && (
        <Badge variant="secondary" className="gap-1.5">
          <Eye className="size-3" />
          Режим просмотра
        </Badge>
      )}
    </header>
  )
}
