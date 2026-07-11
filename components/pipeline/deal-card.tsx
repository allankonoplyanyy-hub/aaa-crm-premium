'use client'

import { Sparkles, CalendarClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatKztShort, formatDate, isOverdue } from '@/lib/format'
import type { Contact, Deal, User } from '@/lib/types'
import { cn } from '@/lib/utils'

export function DealCardContent({
  deal,
  owner,
  contact,
  className,
}: {
  deal: Deal
  owner: User | undefined
  contact: Contact | null | undefined
  className?: string
}) {
  const nextOverdue = deal.nextActionAt ? isOverdue(deal.nextActionAt) : false
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border bg-card p-3 text-left shadow-xs transition-colors hover:border-ring/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-pretty">{deal.title}</p>
        {deal.aiCreated && (
          <Badge variant="secondary" className="shrink-0 gap-1 px-1.5">
            <Sparkles className="size-3" />
            AI
          </Badge>
        )}
      </div>
      <p className="text-sm font-semibold tabular-nums">{formatKztShort(deal.amountKzt)}</p>
      {contact && <p className="truncate text-xs text-muted-foreground">{contact.name}</p>}
      {deal.nextActionAt && (
        <p
          className={cn(
            'flex items-center gap-1 text-xs',
            nextOverdue ? 'font-medium text-destructive' : 'text-muted-foreground',
          )}
        >
          <CalendarClock className="size-3 shrink-0" />
          <span className="truncate">
            {formatDate(deal.nextActionAt)}
            {deal.nextActionText ? ` · ${deal.nextActionText}` : ''}
          </span>
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{deal.source}</span>
        <Avatar className="size-5">
          <AvatarFallback className="text-[10px]">{owner?.avatarInitials ?? '—'}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
