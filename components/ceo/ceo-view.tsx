'use client'

import { useMemo } from 'react'
import { Crown, Building2, Bot, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { useWorkspace } from '@/hooks/use-workspace'
import { apiFetch } from '@/lib/api'
import { formatKztShort } from '@/lib/format'

export function CeoView() {
  const { data, isLoading, mutate } = useWorkspace()

  const stats = useMemo(() => {
    if (!data) return null
    const totalSpend = data.tenants.reduce((s, t) => s + t.aiSpendKzt, 0)
    const totalLimit = data.tenants.reduce((s, t) => s + t.aiLimitKzt, 0)
    return { totalSpend, totalLimit }
  }, [data])

  if (isLoading || !data) return <PageSkeleton />

  if (data.session.role !== 'owner') {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Crown />
          </EmptyMedia>
          <EmptyTitle>Доступ ограничен</EmptyTitle>
          <EmptyDescription>CEO-панель доступна только владельцу платформы.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  async function switchCompany(companyId: string) {
    try {
      await apiFetch('/api/company/switch', { method: 'POST', body: { companyId } })
      await mutate()
      toast.success('Рабочее пространство переключено')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось переключить')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Building2 className="size-3.5" />
              Компаний на платформе
            </CardDescription>
            <CardTitle className="text-2xl">{data.tenants.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Bot className="size-3.5" />
              Расход AI (все компании)
            </CardDescription>
            <CardTitle className="text-2xl">{formatKztShort(stats?.totalSpend ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5" />
              Общий лимит AI
            </CardDescription>
            <CardTitle className="text-2xl">{formatKztShort(stats?.totalLimit ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {data.tenants.map((tenant) => {
          const isActive = tenant.id === data.session.activeCompanyId
          const spendPct = Math.round((tenant.aiSpendKzt / tenant.aiLimitKzt) * 100)
          return (
            <Card key={tenant.id} className={isActive ? 'border-primary' : undefined}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{tenant.name}</CardTitle>
                    <CardDescription>
                      {tenant.niche} · {tenant.city}
                    </CardDescription>
                  </div>
                  <Badge variant={tenant.status === 'active' ? 'default' : 'destructive'}>
                    {tenant.status === 'active' ? 'Активна' : 'Приостановлена'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Тариф</span>
                  <Badge variant="secondary">{tenant.plan}</Badge>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Расход AI</span>
                    <span>
                      {formatKztShort(tenant.aiSpendKzt)} / {formatKztShort(tenant.aiLimitKzt)}
                    </span>
                  </div>
                  <Progress value={spendPct} aria-label={`Расход AI: ${spendPct}%`} />
                </div>
                <Button
                  variant={isActive ? 'secondary' : 'outline'}
                  size="sm"
                  disabled={isActive}
                  onClick={() => switchCompany(tenant.id)}
                >
                  {isActive ? 'Текущее пространство' : 'Открыть пространство'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
