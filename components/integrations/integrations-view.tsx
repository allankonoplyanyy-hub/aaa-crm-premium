'use client'

import { Plug, CircleCheck, CircleAlert, CircleX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { DemoBanner } from '@/components/shared/demo-banner'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { useWorkspace } from '@/hooks/use-workspace'
import { IS_DEMO } from '@/lib/demo'
import { relativeTime } from '@/lib/format'
import type { IntegrationStatus } from '@/lib/types'

const STATUS_META: Record<
  IntegrationStatus,
  { label: string; icon: typeof CircleCheck; variant: 'default' | 'secondary' | 'destructive' }
> = {
  connected: { label: 'Подключено', icon: CircleCheck, variant: 'default' },
  setup_required: { label: 'Требуется настройка', icon: CircleAlert, variant: 'secondary' },
  error: { label: 'Ошибка', icon: CircleX, variant: 'destructive' },
}

// In demo mode no external channel is actually connected — every card is
// labeled honestly instead of claiming a live connection.
const DEMO_STATUS_META: typeof STATUS_META = {
  connected: { label: 'Демо', icon: CircleCheck, variant: 'secondary' },
  setup_required: { label: 'Не подключено', icon: CircleAlert, variant: 'secondary' },
  error: { label: 'Не подключено', icon: CircleX, variant: 'secondary' },
}

export function IntegrationsView() {
  const { data, isLoading } = useWorkspace()

  if (isLoading || !data) return <PageSkeleton />

  if (data.integrations.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Plug />
          </EmptyMedia>
          <EmptyTitle>Нет интеграций</EmptyTitle>
          <EmptyDescription>Подключённые сервисы появятся здесь.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <DemoBanner text="Показаны примеры интеграций. Реальные каналы (WhatsApp, Telegram, Instagram, Voice AI и другие) не подключены — все события сгенерированы для демонстрации." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.integrations.map((integration) => {
        const meta = (IS_DEMO ? DEMO_STATUS_META : STATUS_META)[integration.status]
        const StatusIcon = meta.icon
        return (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle>{integration.name}</CardTitle>
                <Badge variant={meta.variant} className="gap-1">
                  <StatusIcon className="size-3" />
                  {meta.label}
                </Badge>
              </div>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {integration.lastEventAt
                  ? `Последнее событие: ${relativeTime(integration.lastEventAt)}`
                  : 'Событий пока не было'}
              </p>
            </CardContent>
          </Card>
        )
      })}
      </div>
    </div>
  )
}
