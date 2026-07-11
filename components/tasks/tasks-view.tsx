'use client'

import { useMemo, useState } from 'react'
import { Plus, CheckSquare, Phone, CalendarClock, MessageSquare, FileText, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useWorkspace, canWrite } from '@/hooks/use-workspace'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { apiFetch } from '@/lib/api'
import { formatDateTime, isOverdue, isToday } from '@/lib/format'
import { TASK_TYPE_LABELS, type Task, type TaskType } from '@/lib/types'
import { cn } from '@/lib/utils'

const TYPE_ICONS: Record<TaskType, typeof Phone> = {
  call: Phone,
  meeting: CalendarClock,
  message: MessageSquare,
  proposal: FileText,
  followup: RotateCcw,
}

function NewTaskDialog({
  deals,
  users,
  onCreated,
}: {
  deals: { id: string; title: string }[]
  users: { id: string; name: string }[]
  onCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('call')
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(10, 0, 0, 0)
    // Format as datetime-local value in local time.
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [dealId, setDealId] = useState<string | null>(null)
  const [assigneeId, setAssigneeId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: {
          title,
          type,
          dueAt: new Date(dueAt).toISOString(),
          dealId,
          assigneeId,
        },
      })
      onCreated()
      setOpen(false)
      setTitle('')
      setDealId(null)
      toast.success('Задача создана')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus data-icon="inline-start" />
            Новая задача
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новая задача</DialogTitle>
          <DialogDescription>Запланируйте следующее действие</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="tk-title">Название</FieldLabel>
              <Input
                id="tk-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Позвонить клиенту"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Тип</FieldLabel>
                <Select
                  value={type}
                  onValueChange={(v) => v && setType(v)}
                  items={Object.entries(TASK_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="tk-due">Срок</FieldLabel>
                <Input
                  id="tk-due"
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  required
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Сделка</FieldLabel>
              <Select
                value={dealId}
                onValueChange={setDealId}
                items={deals.map((d) => ({ value: d.id, label: d.title }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Без сделки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {deals.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Исполнитель</FieldLabel>
              <Select
                value={assigneeId}
                onValueChange={setAssigneeId}
                items={users.map((u) => ({ value: u.id, label: u.name }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="По умолчанию — вы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={saving || !title.trim() || !dueAt}>
              {saving && <Spinner data-icon="inline-start" />}
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TasksView() {
  const { data, isLoading, mutate } = useWorkspace()
  const [filter, setFilter] = useState('open')

  const usersById = useMemo(() => new Map((data?.users ?? []).map((u) => [u.id, u])), [data])
  const dealsById = useMemo(() => new Map((data?.deals ?? []).map((d) => [d.id, d])), [data])

  const filtered = useMemo(() => {
    if (!data) return []
    let tasks = data.tasks
    if (filter === 'open') tasks = tasks.filter((t) => !t.done)
    else if (filter === 'today') tasks = tasks.filter((t) => !t.done && isToday(t.dueAt))
    else if (filter === 'overdue') tasks = tasks.filter((t) => !t.done && isOverdue(t.dueAt))
    else if (filter === 'done') tasks = tasks.filter((t) => t.done)
    return [...tasks].sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))
  }, [data, filter])

  if (isLoading || !data) return <PageSkeleton />

  const writable = canWrite(data.session.role)

  async function toggleDone(task: Task, done: boolean) {
    void mutate(
      (current) =>
        current
          ? {
              ...current,
              tasks: current.tasks.map((t) => (t.id === task.id ? { ...t, done } : t)),
            }
          : current,
      { revalidate: false },
    )
    try {
      await apiFetch(`/api/tasks/${task.id}`, { method: 'PATCH', body: { done } })
      void mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка')
      void mutate()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="open">Открытые</TabsTrigger>
            <TabsTrigger value="today">Сегодня</TabsTrigger>
            <TabsTrigger value="overdue">Просроченные</TabsTrigger>
            <TabsTrigger value="done">Выполненные</TabsTrigger>
          </TabsList>
        </Tabs>
        {writable && (
          <NewTaskDialog
            deals={data.deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost')}
            users={data.users}
            onCreated={() => void mutate()}
          />
        )}
      </div>

      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckSquare />
            </EmptyMedia>
            <EmptyTitle>Задач нет</EmptyTitle>
            <EmptyDescription>В этом списке пока пусто</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((task) => {
            const Icon = TYPE_ICONS[task.type]
            const overdue = !task.done && isOverdue(task.dueAt)
            const assignee = usersById.get(task.assigneeId)
            const deal = task.dealId ? dealsById.get(task.dealId) : null
            return (
              <li
                key={task.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border bg-card p-3.5',
                  task.done && 'opacity-60',
                )}
              >
                <Checkbox
                  checked={task.done}
                  onCheckedChange={(checked) => {
                    if (writable) void toggleDone(task, checked === true)
                  }}
                  disabled={!writable}
                  aria-label={task.done ? 'Отметить как невыполненную' : 'Отметить как выполненную'}
                />
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    overdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm font-medium', task.done && 'line-through')}>
                    {task.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {TASK_TYPE_LABELS[task.type]}
                    {deal ? ` · ${deal.title}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {overdue && <Badge variant="destructive">Просрочено</Badge>}
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      overdue ? 'font-medium text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {formatDateTime(task.dueAt)}
                  </span>
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[10px]">
                      {assignee?.avatarInitials ?? '—'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
