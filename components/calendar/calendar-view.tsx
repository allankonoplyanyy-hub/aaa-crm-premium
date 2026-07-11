'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWorkspace } from '@/hooks/use-workspace'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { formatTime } from '@/lib/format'
import { TASK_TYPE_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function CalendarView() {
  const { data, isLoading } = useWorkspace()
  const [month, setMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState(() => new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, typeof data extends undefined ? never[] : NonNullable<typeof data>['tasks']>()
    for (const task of data?.tasks ?? []) {
      const key = format(new Date(task.dueAt), 'yyyy-MM-dd')
      const list = map.get(key) ?? []
      list.push(task)
      map.set(key, list)
    }
    return map
  }, [data])

  if (isLoading || !data) return <PageSkeleton />

  const selectedTasks = (tasksByDay.get(format(selectedDay, 'yyyy-MM-dd')) ?? []).sort(
    (a, b) => +new Date(a.dueAt) - +new Date(b.dueAt),
  )
  const usersById = new Map(data.users.map((u) => [u.id, u]))

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-lg font-semibold capitalize">
            {format(month, 'LLLL yyyy', { locale: ru })}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => setMonth((m) => subMonths(m, 1))} aria-label="Предыдущий месяц">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setMonth(new Date()); setSelectedDay(new Date()) }}>
              Сегодня
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Следующий месяц">
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayTasks = tasksByDay.get(key) ?? []
              const inMonth = isSameMonth(day, month)
              const isSelected = isSameDay(day, selectedDay)
              const isCurrentDay = isSameDay(day, new Date())
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    'flex min-h-20 flex-col items-start gap-1 border-b border-r p-1.5 text-left transition-colors hover:bg-accent',
                    !inMonth && 'bg-muted/30 text-muted-foreground',
                    isSelected && 'bg-primary/5 ring-2 ring-inset ring-primary/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
                      isCurrentDay && 'bg-primary font-semibold text-primary-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="flex w-full flex-col gap-0.5">
                      {dayTasks.slice(0, 2).map((t) => (
                        <span
                          key={t.id}
                          className={cn(
                            'w-full truncate rounded px-1 py-0.5 text-[10px] leading-tight',
                            t.done
                              ? 'bg-muted text-muted-foreground line-through'
                              : 'bg-primary/10 text-primary',
                          )}
                        >
                          {t.title}
                        </span>
                      ))}
                      {dayTasks.length > 2 && (
                        <span className="px-1 text-[10px] text-muted-foreground">
                          +{dayTasks.length - 2} ещё
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold capitalize">
          {format(selectedDay, 'd MMMM, EEEE', { locale: ru })}
        </h3>
        {selectedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет задач на этот день</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedTasks.map((task) => {
              const assignee = usersById.get(task.assigneeId)
              return (
                <li key={task.id} className="flex items-start gap-3 rounded-xl border bg-card p-3">
                  <span className="w-11 shrink-0 pt-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {formatTime(task.dueAt)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-medium', task.done && 'line-through opacity-60')}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {TASK_TYPE_LABELS[task.type]}
                      {assignee ? ` · ${assignee.name.split(' ')[0]}` : ''}
                    </p>
                  </div>
                  {task.done && <Badge variant="secondary">Готово</Badge>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
