'use client'

import { useMemo, useState } from 'react'
import { Search, KanbanSquare, TableProperties, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useWorkspace, canWrite } from '@/hooks/use-workspace'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { DealSheet } from '@/components/pipeline/deal-sheet'
import { NewDealDialog } from '@/components/pipeline/new-deal-dialog'
import { apiFetch } from '@/lib/api'
import { formatKzt, formatDate } from '@/lib/format'
import { STAGE_LABELS, type Deal, type DealStage } from '@/lib/types'

export function PipelineView() {
  const { data, isLoading, mutate } = useWorkspace()
  const [query, setQuery] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [openDealId, setOpenDealId] = useState<string | null>(null)

  const usersById = useMemo(() => new Map((data?.users ?? []).map((u) => [u.id, u])), [data])
  const contactsById = useMemo(() => new Map((data?.contacts ?? []).map((c) => [c.id, c])), [data])
  const companiesById = useMemo(
    () => new Map((data?.clientCompanies ?? []).map((c) => [c.id, c])),
    [data],
  )

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.deals.filter((d) => {
      if (ownerFilter !== 'all' && d.ownerId !== ownerFilter) return false
      if (!q) return true
      const contact = d.contactId ? contactsById.get(d.contactId) : null
      return (
        d.title.toLowerCase().includes(q) ||
        (contact?.name.toLowerCase().includes(q) ?? false)
      )
    })
  }, [data, query, ownerFilter, contactsById])

  if (isLoading || !data) return <PageSkeleton />

  const writable = canWrite(data.session.role)
  const openDeal = openDealId ? (data.deals.find((d) => d.id === openDealId) ?? null) : null

  async function handleStageChange(dealId: string, stage: DealStage) {
    // Optimistic update
    void mutate(
      (current) =>
        current
          ? {
              ...current,
              deals: current.deals.map((d) => (d.id === dealId ? { ...d, stage } : d)),
            }
          : current,
      { revalidate: false },
    )
    try {
      await apiFetch(`/api/deals/${dealId}`, { method: 'PATCH', body: { stage } })
      void mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка')
      void mutate()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="kanban" className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TabsList>
              <TabsTrigger value="kanban">
                <KanbanSquare className="size-4" />
                Канбан
              </TabsTrigger>
              <TabsTrigger value="table">
                <TableProperties className="size-4" />
                Таблица
              </TabsTrigger>
            </TabsList>
            <InputGroup className="w-56">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Поиск сделок..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>
            <Select
              value={ownerFilter}
              onValueChange={(v) => v && setOwnerFilter(v)}
              items={[
                { value: 'all', label: 'Все менеджеры' },
                ...data.users.map((u) => ({ value: u.id, label: u.name })),
              ]}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Все менеджеры</SelectItem>
                  {data.users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {writable && (
            <NewDealDialog
              contacts={data.contacts}
              users={data.users}
              onCreated={() => void mutate()}
            />
          )}
        </div>

        <TabsContent value="kanban">
          <KanbanBoard
            deals={filtered}
            usersById={usersById}
            contactsById={contactsById}
            canDrag={writable}
            onStageChange={handleStageChange}
            onOpen={(deal) => setOpenDealId(deal.id)}
          />
        </TabsContent>

        <TabsContent value="table">
          {filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>Ничего не найдено</EmptyTitle>
                <EmptyDescription>Попробуйте изменить фильтры</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сделка</TableHead>
                    <TableHead>Этап</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                    <TableHead>Контакт</TableHead>
                    <TableHead>Ответственный</TableHead>
                    <TableHead>Источник</TableHead>
                    <TableHead>Создана</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((deal: Deal) => {
                    const contact = deal.contactId ? contactsById.get(deal.contactId) : null
                    const owner = usersById.get(deal.ownerId)
                    return (
                      <TableRow
                        key={deal.id}
                        className="cursor-pointer"
                        onClick={() => setOpenDealId(deal.id)}
                      >
                        <TableCell>
                          <span className="flex items-center gap-2 font-medium">
                            {deal.title}
                            {deal.aiCreated && (
                              <Badge variant="secondary" className="gap-1 px-1.5">
                                <Sparkles className="size-3" />
                                AI
                              </Badge>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              deal.stage === 'won'
                                ? 'default'
                                : deal.stage === 'lost'
                                  ? 'destructive'
                                  : 'outline'
                            }
                          >
                            {STAGE_LABELS[deal.stage]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatKzt(deal.amountKzt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact?.name ?? '—'}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarFallback className="text-[10px]">
                                {owner?.avatarInitials ?? '—'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{owner?.name.split(' ')[0] ?? '—'}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{deal.source}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(deal.createdAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DealSheet
        deal={openDeal}
        open={openDealId !== null}
        onOpenChange={(o) => {
          if (!o) setOpenDealId(null)
        }}
        usersById={usersById}
        contactsById={contactsById}
        companiesById={companiesById}
        canEdit={writable}
        onMutated={() => void mutate()}
      />
    </div>
  )
}
