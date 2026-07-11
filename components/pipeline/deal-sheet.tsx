'use client'

import { useState } from 'react'
import { Sparkles, Trash2, Phone, Mail, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { apiFetch } from '@/lib/api'
import { formatKzt, formatDateTime, relativeTime } from '@/lib/format'
import {
  STAGE_LABELS,
  STAGE_ORDER,
  type Contact,
  type ClientCompany,
  type Deal,
  type DealStage,
  type User,
} from '@/lib/types'

export function DealSheet({
  deal,
  open,
  onOpenChange,
  usersById,
  contactsById,
  companiesById,
  canEdit,
  onMutated,
}: {
  deal: Deal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  usersById: Map<string, User>
  contactsById: Map<string, Contact>
  companiesById: Map<string, ClientCompany>
  canEdit: boolean
  onMutated: () => void
}) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  if (!deal) return null

  const owner = usersById.get(deal.ownerId)
  const contact = deal.contactId ? contactsById.get(deal.contactId) : null
  const clientCompany = deal.clientCompanyId ? companiesById.get(deal.clientCompanyId) : null

  async function patch(body: Record<string, unknown>, successMsg?: string) {
    if (!deal) return
    setSaving(true)
    try {
      await apiFetch(`/api/deals/${deal.id}`, { method: 'PATCH', body })
      onMutated()
      if (successMsg) toast.success(successMsg)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deal) return
    try {
      await apiFetch(`/api/deals/${deal.id}`, { method: 'DELETE' })
      onMutated()
      onOpenChange(false)
      toast.success('Сделка удалена')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function addNote() {
    if (!note.trim()) return
    await patch({ note }, 'Заметка добавлена')
    setNote('')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="text-pretty">{deal.title}</SheetTitle>
            {deal.aiCreated && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="size-3" />
                AI
              </Badge>
            )}
          </div>
          <SheetDescription>
            Создана {formatDateTime(deal.createdAt)} · {deal.source}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Сумма сделки</p>
              <p className="text-2xl font-semibold tabular-nums">{formatKzt(deal.amountKzt)}</p>
            </div>
            <Badge variant="outline" className="tabular-nums">
              {deal.probability}% вероятность
            </Badge>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Этап</FieldLabel>
              <Select
                value={deal.stage}
                items={STAGE_ORDER.map((s) => ({ value: s, label: STAGE_LABELS[s] }))}
                onValueChange={(value) => {
                  if (value && value !== deal.stage) {
                    void patch({ stage: value as DealStage }, 'Этап обновлён')
                  }
                }}
                disabled={!canEdit || saving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STAGE_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {deal.stage === 'lost' && deal.lostReason && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Причина проигрыша: {deal.lostReason}
            </p>
          )}

          <Separator />

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback>{owner?.avatarInitials ?? '—'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{owner?.name ?? 'Не назначен'}</p>
                <p className="text-xs text-muted-foreground">Ответственный</p>
              </div>
            </div>
            {contact && (
              <div className="flex flex-col gap-1.5 rounded-lg border p-3">
                <p className="text-sm font-medium">{contact.name}</p>
                <p className="text-xs text-muted-foreground">{contact.position}</p>
                <div className="flex flex-col gap-1 pt-1">
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Phone className="size-3" />
                    {contact.phone}
                  </a>
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Mail className="size-3" />
                    {contact.email}
                  </a>
                </div>
              </div>
            )}
            {clientCompany && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="size-3.5" />
                {clientCompany.name} · {clientCompany.niche}
              </p>
            )}
            {deal.nextActionText && (
              <p className="text-sm">
                <span className="text-muted-foreground">Следующий шаг: </span>
                {deal.nextActionText}
                {deal.nextActionAt ? ` (${formatDateTime(deal.nextActionAt)})` : ''}
              </p>
            )}
            {deal.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {deal.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Заметки ({deal.notes.length})</h4>
            {deal.notes.length > 0 && (
              <ul className="flex flex-col gap-2">
                {[...deal.notes].reverse().map((n) => {
                  const author = usersById.get(n.authorId)
                  return (
                    <li key={n.id} className="rounded-lg bg-muted/60 p-3">
                      <p className="text-sm leading-relaxed">{n.text}</p>
                      <p className="pt-1 text-xs text-muted-foreground">
                        {author?.name ?? '—'} · {relativeTime(n.createdAt)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
            {canEdit && (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Добавить заметку..."
                  rows={2}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={addNote} disabled={!note.trim() || saving}>
                    {saving && <Spinner data-icon="inline-start" />}
                    Сохранить
                  </Button>
                </div>
              </div>
            )}
          </div>

          {canEdit && (
            <>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="outline" size="sm" className="self-start text-destructive">
                      <Trash2 data-icon="inline-start" />
                      Удалить сделку
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить сделку?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Сделка «{deal.title}» будет удалена без возможности восстановления.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleDelete}>
                      Удалить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
