'use client'

import { useMemo, useState } from 'react'
import { Bot, PhoneIncoming, PhoneOutgoing, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { useWorkspace } from '@/hooks/use-workspace'
import { formatDateTime, formatDuration } from '@/lib/format'
import type { Call } from '@/lib/types'

export function CallsView() {
  const { data, isLoading } = useWorkspace()
  const [filter, setFilter] = useState<'all' | 'ai' | 'human'>('all')
  const [openCall, setOpenCall] = useState<Call | null>(null)

  const contactsById = useMemo(() => new Map((data?.contacts ?? []).map((c) => [c.id, c])), [data])

  const calls = useMemo(() => {
    if (!data) return []
    let list = [...data.calls].sort((a, b) => b.at.localeCompare(a.at))
    if (filter === 'ai') list = list.filter((c) => c.byAi)
    if (filter === 'human') list = list.filter((c) => !c.byAi)
    return list
  }, [data, filter])

  if (isLoading || !data) return <PageSkeleton />

  const aiCount = data.calls.filter((c) => c.byAi).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Всего {data.calls.length} звонков · {aiCount} обработано Voice AI
          </p>
        </div>
        <ToggleGroup
          value={filter}
          onValueChange={(v) => {
            if (v) setFilter(v as typeof filter)
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="all">Все</ToggleGroupItem>
          <ToggleGroupItem value="ai">Voice AI</ToggleGroupItem>
          <ToggleGroupItem value="human">Менеджеры</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {calls.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Phone />
            </EmptyMedia>
            <EmptyTitle>Нет звонков</EmptyTitle>
            <EmptyDescription>История звонков появится здесь.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Направление</TableHead>
                <TableHead>Контакт</TableHead>
                <TableHead>Результат</TableHead>
                <TableHead>Длительность</TableHead>
                <TableHead>Кто обработал</TableHead>
                <TableHead>Когда</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call) => {
                const contact = call.contactId ? contactsById.get(call.contactId) : null
                return (
                  <TableRow
                    key={call.id}
                    className="cursor-pointer"
                    onClick={() => setOpenCall(call)}
                  >
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {call.direction === 'incoming' ? (
                          <PhoneIncoming className="size-4 text-muted-foreground" />
                        ) : (
                          <PhoneOutgoing className="size-4 text-muted-foreground" />
                        )}
                        {call.direction === 'incoming' ? 'Входящий' : 'Исходящий'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{contact?.name ?? 'Неизвестный'}</span>
                        <span className="text-xs text-muted-foreground">{call.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-56 truncate">{call.result}</TableCell>
                    <TableCell>{formatDuration(call.durationSec)}</TableCell>
                    <TableCell>
                      {call.byAi ? (
                        <Badge variant="secondary" className="gap-1">
                          <Bot className="size-3" />
                          Voice AI
                        </Badge>
                      ) : (
                        <Badge variant="outline">Менеджер</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(call.at)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={openCall !== null} onOpenChange={(open) => !open && setOpenCall(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {openCall && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {openCall.direction === 'incoming' ? 'Входящий звонок' : 'Исходящий звонок'} ·{' '}
                  {openCall.phone}
                </SheetTitle>
                <SheetDescription>
                  {formatDateTime(openCall.at)} · {formatDuration(openCall.durationSec)}
                  {openCall.byAi ? ' · Обработан Voice AI' : ''}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Результат</h3>
                  <p className="text-sm text-muted-foreground">{openCall.result}</p>
                </div>
                {openCall.aiSummary && (
                  <div className="rounded-lg bg-muted p-3">
                    <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                      <Bot className="size-4" />
                      AI-резюме
                    </h3>
                    <p className="text-sm text-muted-foreground">{openCall.aiSummary}</p>
                  </div>
                )}
                {openCall.transcript && (
                  <div>
                    <h3 className="mb-1 text-sm font-semibold">Транскрипт</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                      {openCall.transcript}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
