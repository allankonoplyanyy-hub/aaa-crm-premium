'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Wallet,
  Bot,
  CheckSquare,
  ArrowRight,
  Phone,
  MessageSquare,
  CalendarClock,
  Sparkles,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useWorkspace } from '@/hooks/use-workspace'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { formatKztShort, formatKzt, relativeTime, formatTime, isToday, isOverdue } from '@/lib/format'
import { STAGE_LABELS, STAGE_ORDER, TASK_TYPE_LABELS, type DealStage } from '@/lib/types'

const chartConfig = {
  count: { label: 'Сделки', color: 'var(--chart-1)' },
  amount: { label: 'Сумма', color: 'var(--chart-2)' },
}

export function Overview() {
  const { data, isLoading } = useWorkspace()

  const stats = useMemo(() => {
    if (!data) return null
    const open = data.deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost')
    const won = data.deals.filter((d) => d.stage === 'won')
    const closed = data.deals.filter((d) => d.stage === 'won' || d.stage === 'lost')
    const wonAmount = won.reduce((s, d) => s + d.amountKzt, 0)
    const openAmount = open.reduce((s, d) => s + d.amountKzt, 0)
    const conversion = closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0
    const aiDeals = data.deals.filter((d) => d.aiCreated)
    const aiWonAmount = aiDeals
      .filter((d) => d.stage === 'won')
      .reduce((s, d) => s + d.amountKzt, 0)
    const todayTasks = data.tasks.filter((t) => !t.done && isToday(t.dueAt))
    const overdueTasks = data.tasks.filter((t) => !t.done && isOverdue(t.dueAt))

    const funnel = STAGE_ORDER.filter((s) => s !== 'won' && s !== 'lost').map((stage) => ({
      stage: STAGE_LABELS[stage],
      count: data.deals.filter((d) => d.stage === stage).length,
      amount: data.deals
        .filter((d) => d.stage === stage)
        .reduce((s, d) => s + d.amountKzt, 0),
    }))

    return {
      open,
      wonAmount,
      openAmount,
      conversion,
      aiDeals,
      aiWonAmount,
      todayTasks,
      overdueTasks,
      funnel,
    }
  }, [data])

  if (isLoading || !data || !stats) return <PageSkeleton />

  const userById = new Map(data.users.map((u) => [u.id, u]))
  const contactById = new Map(data.contacts.map((c) => [c.id, c]))
  const recentEvents = [...data.events]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 8)
  const agenda = [...stats.overdueTasks, ...stats.todayTasks]
    .sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))
    .slice(0, 6)

  return (
    <div className="flex flex-col gap-4">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Wallet className="size-3.5" />
              Выигранные сделки
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatKztShort(stats.wonAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.deals.filter((d) => d.stage === 'won').length} закрытых сделок
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5" />
              Активная воронка
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatKztShort(stats.openAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.open.length} открытых сделок · конверсия {stats.conversion}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Bot className="size-3.5" />
              Вклад AI
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatKztShort(stats.aiWonAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.aiDeals.length} сделок создано AI-ассистентом
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <CheckSquare className="size-3.5" />
              Задачи
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {stats.todayTasks.length} на сегодня
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.overdueTasks.length > 0 ? (
              <p className="text-xs font-medium text-destructive">
                {stats.overdueTasks.length} просрочено
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Просроченных нет</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Funnel chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Воронка продаж</CardTitle>
            <CardDescription>Открытые сделки по этапам</CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={
                  <Link href="/pipeline">
                    Открыть
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                }
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={stats.funnel} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="stage"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) =>
                        name === 'count' ? (
                          <div className="flex w-full items-center justify-between gap-4">
                            <span className="text-muted-foreground">Сделок</span>
                            <span className="font-mono font-medium tabular-nums">
                              {String(value)} · {formatKztShort(item.payload.amount)}
                            </span>
                          </div>
                        ) : null
                      }
                    />
                  }
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} maxBarSize={22} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Agenda */}
        <Card>
          <CardHeader>
            <CardTitle>Повестка дня</CardTitle>
            <CardDescription>Просроченные и сегодняшние задачи</CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={
                  <Link href="/tasks">
                    Все
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                }
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            {agenda.length === 0 ? (
              <Empty className="border-0 p-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CheckSquare />
                  </EmptyMedia>
                  <EmptyTitle>Всё выполнено</EmptyTitle>
                  <EmptyDescription>На сегодня задач нет</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="flex flex-col gap-3">
                {agenda.map((task) => {
                  const overdue = isOverdue(task.dueAt)
                  const assignee = userById.get(task.assigneeId)
                  return (
                    <li key={task.id} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${
                          overdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {task.type === 'call' ? (
                          <Phone className="size-3.5" />
                        ) : task.type === 'meeting' ? (
                          <CalendarClock className="size-3.5" />
                        ) : (
                          <MessageSquare className="size-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {TASK_TYPE_LABELS[task.type]} · {overdue ? 'просрочено' : formatTime(task.dueAt)}
                          {assignee ? ` · ${assignee.name.split(' ')[0]}` : ''}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Activity feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Лента активности</CardTitle>
            <CardDescription>Действия команды и AI-ассистентов</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-4">
              {recentEvents.map((event) => {
                const actor = event.actorId ? userById.get(event.actorId) : null
                return (
                  <li key={event.id} className="flex items-start gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback
                        className={
                          event.byAi
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {event.byAi ? <Sparkles className="size-3.5" /> : (actor?.avatarInitials ?? '—')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed">
                        <span className="font-medium">
                          {event.byAi ? 'AI-ассистент' : (actor?.name ?? 'Система')}
                        </span>{' '}
                        {event.text}
                      </p>
                      <p className="text-xs text-muted-foreground">{relativeTime(event.at)}</p>
                    </div>
                    {event.byAi && <Badge variant="secondary">AI</Badge>}
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Top open deals */}
        <Card>
          <CardHeader>
            <CardTitle>Крупные сделки</CardTitle>
            <CardDescription>Топ открытых по сумме</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {[...stats.open]
                .sort((a, b) => b.amountKzt - a.amountKzt)
                .slice(0, 6)
                .map((deal) => {
                  const contact = deal.contactId ? contactById.get(deal.contactId) : null
                  return (
                    <li key={deal.id}>
                      <Link
                        href="/pipeline"
                        className="flex items-center gap-3 rounded-lg p-2 -m-2 transition-colors hover:bg-accent"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{deal.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {STAGE_LABELS[deal.stage as DealStage]}
                            {contact ? ` · ${contact.name}` : ''}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium tabular-nums">
                          {formatKzt(deal.amountKzt)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
