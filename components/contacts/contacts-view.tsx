'use client'

import { useMemo, useState } from 'react'
import { Search, Plus, Phone, Mail, MessageCircle, Send, Instagram, ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useWorkspace, canWrite } from '@/hooks/use-workspace'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { apiFetch } from '@/lib/api'
import { formatDate, formatKztShort, relativeTime } from '@/lib/format'
import { STAGE_LABELS, type Contact, type LeadSource } from '@/lib/types'

const SOURCES: LeadSource[] = ['Сайт', 'Instagram', 'WhatsApp', 'Telegram', 'Звонок', 'Рекомендация', '2ГИС']

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
}

function NewContactDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [source, setSource] = useState<string>('Сайт')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('/api/contacts', {
        method: 'POST',
        body: { name, phone, email, position, source },
      })
      onCreated()
      setOpen(false)
      setName('')
      setPhone('')
      setEmail('')
      setPosition('')
      toast.success('Контакт добавлен')
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
            Новый контакт
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новый контакт</DialogTitle>
          <DialogDescription>Добавьте клиента в базу</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ct-name">Имя</FieldLabel>
              <Input id="ct-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Асель Нурланова" required />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="ct-phone">Телефон</FieldLabel>
                <Input id="ct-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 777 000 00 00" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="ct-email">Email</FieldLabel>
                <Input id="ct-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@example.kz" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="ct-position">Должность</FieldLabel>
                <Input id="ct-position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Директор" />
              </Field>
              <Field>
                <FieldLabel>Источник</FieldLabel>
                <Select value={source} onValueChange={(v) => v && setSource(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !phone.trim()}>
              {saving && <Spinner data-icon="inline-start" />}
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ContactsView() {
  const { data, isLoading, mutate } = useWorkspace()
  const [query, setQuery] = useState('')
  const [openContactId, setOpenContactId] = useState<string | null>(null)

  const companiesById = useMemo(
    () => new Map((data?.clientCompanies ?? []).map((c) => [c.id, c])),
    [data],
  )
  const usersById = useMemo(() => new Map((data?.users ?? []).map((u) => [u.id, u])), [data])

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    if (!q) return data.contacts
    return data.contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q),
    )
  }, [data, query])

  if (isLoading || !data) return <PageSkeleton />

  const writable = canWrite(data.session.role)
  const openContact = openContactId
    ? (data.contacts.find((c) => c.id === openContactId) ?? null)
    : null
  const contactDeals = openContact
    ? data.deals.filter((d) => d.contactId === openContact.id)
    : []
  const contactTasks = openContact
    ? data.tasks.filter((t) => t.contactId === openContact.id && !t.done)
    : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InputGroup className="w-64">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Поиск по имени, телефону, email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        {writable && <NewContactDialog onCreated={() => void mutate()} />}
      </div>

      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>Контакты не найдены</EmptyTitle>
            <EmptyDescription>Попробуйте изменить запрос</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Контакт</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Компания</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead>Согласие</TableHead>
                <TableHead>Добавлен</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact: Contact) => {
                const company = contact.clientCompanyId
                  ? companiesById.get(contact.clientCompanyId)
                  : null
                return (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() => setOpenContactId(contact.id)}
                  >
                    <TableCell>
                      <span className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback className="text-[10px]">
                            {initials(contact.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex flex-col">
                          <span className="font-medium">{contact.name}</span>
                          <span className="text-xs text-muted-foreground">{contact.position}</span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">{contact.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{company?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{contact.source}</Badge>
                    </TableCell>
                    <TableCell>
                      {contact.consent ? (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <ShieldCheck className="size-3.5" />
                          Есть
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShieldOff className="size-3.5" />
                          Нет
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(contact.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={openContactId !== null} onOpenChange={(o) => !o && setOpenContactId(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
          {openContact && (
            <>
              <SheetHeader>
                <SheetTitle>{openContact.name}</SheetTitle>
                <SheetDescription>
                  {openContact.position || 'Контакт'} · добавлен {relativeTime(openContact.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4 pb-6">
                <div className="flex flex-col gap-2 rounded-lg border p-3">
                  <a href={`tel:${openContact.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Phone className="size-3.5" />
                    {openContact.phone}
                  </a>
                  {openContact.email && (
                    <a href={`mailto:${openContact.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Mail className="size-3.5" />
                      {openContact.email}
                    </a>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {openContact.whatsapp && (
                      <Badge variant="secondary" className="gap-1">
                        <MessageCircle className="size-3" />
                        WhatsApp
                      </Badge>
                    )}
                    {openContact.telegram && (
                      <Badge variant="secondary" className="gap-1">
                        <Send className="size-3" />
                        {openContact.telegram}
                      </Badge>
                    )}
                    {openContact.instagram && (
                      <Badge variant="secondary" className="gap-1">
                        <Instagram className="size-3" />
                        {openContact.instagram}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Источник</p>
                    <p>{openContact.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ответственный</p>
                    <p>{usersById.get(openContact.ownerId)?.name ?? '—'}</p>
                  </div>
                  {openContact.clientCompanyId && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Компания</p>
                      <p>{companiesById.get(openContact.clientCompanyId)?.name ?? '—'}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-medium">Сделки ({contactDeals.length})</h4>
                  {contactDeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Нет связанных сделок</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {contactDeals.map((d) => (
                        <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{d.title}</p>
                            <p className="text-xs text-muted-foreground">{STAGE_LABELS[d.stage]}</p>
                          </div>
                          <span className="shrink-0 text-sm font-medium tabular-nums">
                            {formatKztShort(d.amountKzt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {contactTasks.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-medium">Открытые задачи ({contactTasks.length})</h4>
                    <ul className="flex flex-col gap-1.5">
                      {contactTasks.map((t) => (
                        <li key={t.id} className="text-sm text-muted-foreground">
                          {t.title} · {formatDate(t.dueAt)}
                        </li>
                      ))}
                    </ul>
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
