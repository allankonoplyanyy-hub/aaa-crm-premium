'use client'

import { useMemo } from 'react'
import { Bot, MessageSquare, UserPlus, ArrowRightLeft, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DemoBanner } from '@/components/shared/demo-banner'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { useWorkspace, canWrite } from '@/hooks/use-workspace'
import { apiFetch } from '@/lib/api'
import { formatKztShort } from '@/lib/format'
import { CHANNEL_LABELS } from '@/lib/types'

export function AiView() {
  const { data, isLoading, mutate } = useWorkspace()
  const writable = canWrite(data?.session.role)

  const tenant = useMemo(
    () => data?.tenants.find((t) => t.id === data.session.activeCompanyId),
    [data],
  )

  if (isLoading || !data) return <PageSkeleton />

  async function toggleAssistant(id: string, active: boolean) {
    try {
      await apiFetch(`/api/assistants/${id}`, { method: 'PATCH', body: { active } })
      await mutate()
      toast.success(active ? 'Ассистент запущен' : 'Ассистент приостановлен')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось изменить статус')
    }
  }

  const spendPct = tenant ? Math.round((tenant.aiSpendKzt / tenant.aiLimitKzt) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      <DemoBanner text="AI-менеджеры работают в демонстрационном режиме: статистика и диалоги — примеры, реальные LLM-запросы не выполняются." />
      {tenant && (
        <Card>
          <CardHeader>
            <CardTitle>Расход AI за месяц</CardTitle>
            <CardDescription>
              {formatKztShort(tenant.aiSpendKzt)} из лимита {formatKztShort(tenant.aiLimitKzt)} (
              {spendPct}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={spendPct} aria-label={`Расход AI: ${spendPct}%`} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {data.assistants.map((assistant) => (
          <Card key={assistant.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <CardTitle>{assistant.name}</CardTitle>
                    <CardDescription>
                      {assistant.channels.map((ch) => CHANNEL_LABELS[ch]).join(' · ')}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`toggle-${assistant.id}`} className="sr-only">
                    {assistant.active ? 'Приостановить' : 'Запустить'} {assistant.name}
                  </Label>
                  <Badge variant={assistant.active ? 'default' : 'secondary'}>
                    {assistant.active ? 'Активен' : 'Пауза'}
                  </Badge>
                  <Switch
                    id={`toggle-${assistant.id}`}
                    checked={assistant.active}
                    onCheckedChange={(checked) => toggleAssistant(assistant.id, checked)}
                    disabled={!writable}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MessageSquare className="size-3.5" />
                    Обработано диалогов
                  </div>
                  <p className="mt-1 text-xl font-semibold">{assistant.handled}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserPlus className="size-3.5" />
                    Создано лидов
                  </div>
                  <p className="mt-1 text-xl font-semibold">{assistant.leadsCreated}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowRightLeft className="size-3.5" />
                    Передано менеджеру
                  </div>
                  <p className="mt-1 text-xl font-semibold">{assistant.transferred}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Timer className="size-3.5" />
                    Средний ответ
                  </div>
                  <p className="mt-1 text-xl font-semibold">{assistant.avgResponseSec} сек</p>
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Конверсия в лида</span>
                  <span>{assistant.conversionPct}%</span>
                </div>
                <Progress
                  value={assistant.conversionPct}
                  aria-label={`Конверсия: ${assistant.conversionPct}%`}
                />
              </div>
              <div className="rounded-lg border p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Инструкция (промпт)</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{assistant.prompt}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
