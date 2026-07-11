'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { useWorkspace } from '@/hooks/use-workspace'
import { formatKztShort } from '@/lib/format'
import { STAGE_LABELS, STAGE_ORDER, type LeadSource } from '@/lib/types'

const funnelConfig = {
  count: { label: 'Сделок', color: 'var(--chart-1)' },
} satisfies ChartConfig

const sourceConfig = {
  value: { label: 'Лиды' },
} satisfies ChartConfig

const SOURCE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--muted-foreground)', 'var(--border)']

export function ReportsView() {
  const { data, isLoading } = useWorkspace()

  const funnel = useMemo(() => {
    if (!data) return []
    return STAGE_ORDER.filter((s) => s !== 'lost').map((stage) => ({
      stage: STAGE_LABELS[stage],
      count: data.deals.filter((d) => d.stage === stage).length,
    }))
  }, [data])

  const sources = useMemo(() => {
    if (!data) return []
    const counts = new Map<LeadSource, number>()
    for (const c of data.contacts) counts.set(c.source, (counts.get(c.source) ?? 0) + 1)
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [data])

  const managers = useMemo(() => {
    if (!data) return []
    return data.users
      .filter((u) => u.role === 'manager' || u.role === 'admin')
      .map((u) => {
        const deals = data.deals.filter((d) => d.ownerId === u.id)
        const won = deals.filter((d) => d.stage === 'won')
        const open = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost')
        const tasksDone = data.tasks.filter((t) => t.assigneeId === u.id && t.done).length
        return {
          user: u,
          openCount: open.length,
          wonCount: won.length,
          wonSum: won.reduce((s, d) => s + d.amountKzt, 0),
          pipelineSum: open.reduce((s, d) => s + d.amountKzt, 0),
          tasksDone,
        }
      })
      .sort((a, b) => b.wonSum - a.wonSum)
  }, [data])

  if (isLoading || !data) return <PageSkeleton />

  const wonDeals = data.deals.filter((d) => d.stage === 'won')
  const lostDeals = data.deals.filter((d) => d.stage === 'lost')
  const winRate =
    wonDeals.length + lostDeals.length > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0
  const aiHandled = data.conversations.filter((c) => c.handledBy === 'ai').length
  const aiCalls = data.calls.filter((c) => c.byAi).length

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Выиграно</CardDescription>
            <CardTitle className="text-2xl">{formatKztShort(wonDeals.reduce((s, d) => s + d.amountKzt, 0))}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Win rate</CardDescription>
            <CardTitle className="text-2xl">{winRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Диалогов ведёт AI</CardDescription>
            <CardTitle className="text-2xl">{aiHandled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Звонков через Voice AI</CardDescription>
            <CardTitle className="text-2xl">{aiCalls}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Воронка продаж</CardTitle>
            <CardDescription>Количество сделок по этапам</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={funnelConfig} className="h-64 w-full">
              <BarChart data={funnel} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="stage" width={110} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Источники лидов</CardTitle>
            <CardDescription>Откуда приходят контакты</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={sourceConfig} className="h-64 w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie data={sources} dataKey="value" nameKey="name" innerRadius={50} label={(entry) => entry.name}>
                  {sources.map((entry, i) => (
                    <Cell key={entry.name} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Эффективность менеджеров</CardTitle>
          <CardDescription>Сделки, выручка и выполненные задачи</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Менеджер</TableHead>
                <TableHead>В работе</TableHead>
                <TableHead>Сумма в работе</TableHead>
                <TableHead>Выиграно</TableHead>
                <TableHead>Выручка</TableHead>
                <TableHead>Задач выполнено</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managers.map((m) => (
                <TableRow key={m.user.id}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-xs">{m.user.avatarInitials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{m.user.name}</span>
                    </span>
                  </TableCell>
                  <TableCell>{m.openCount}</TableCell>
                  <TableCell>{formatKztShort(m.pipelineSum)}</TableCell>
                  <TableCell>{m.wonCount}</TableCell>
                  <TableCell className="font-medium">{formatKztShort(m.wonSum)}</TableCell>
                  <TableCell>{m.tasksDone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
