'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { apiFetch } from '@/lib/api'
import {
  STAGE_LABELS,
  STAGE_ORDER,
  type Contact,
  type LeadSource,
  type User,
} from '@/lib/types'

const SOURCES: LeadSource[] = ['Сайт', 'Instagram', 'WhatsApp', 'Telegram', 'Звонок', 'Рекомендация', '2ГИС']

export function NewDealDialog({
  contacts,
  users,
  onCreated,
}: {
  contacts: Contact[]
  users: User[]
  onCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [contactId, setContactId] = useState<string | null>(null)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [stage, setStage] = useState('new')
  const [source, setSource] = useState<string>('Сайт')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('/api/deals', {
        method: 'POST',
        body: {
          title,
          amountKzt: Number(amount) || 0,
          contactId,
          ownerId,
          stage,
          source,
        },
      })
      onCreated()
      setOpen(false)
      setTitle('')
      setAmount('')
      setContactId(null)
      setOwnerId(null)
      setStage('new')
      toast.success('Сделка создана')
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
            Новая сделка
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новая сделка</DialogTitle>
          <DialogDescription>Добавьте сделку в воронку продаж</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="deal-title">Название</FieldLabel>
              <Input
                id="deal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Ремонт офиса — ТОО Алатау"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="deal-amount">Сумма, ₸</FieldLabel>
              <Input
                id="deal-amount"
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500000"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Этап</FieldLabel>
                <Select
                  value={stage}
                  onValueChange={(v) => v && setStage(v)}
                  items={STAGE_ORDER.filter((s) => s !== 'won' && s !== 'lost').map((s) => ({
                    value: s,
                    label: STAGE_LABELS[s],
                  }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STAGE_ORDER.filter((s) => s !== 'won' && s !== 'lost').map((s) => (
                        <SelectItem key={s} value={s}>
                          {STAGE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
            <Field>
              <FieldLabel>Контакт</FieldLabel>
              <Select
                value={contactId}
                onValueChange={setContactId}
                items={contacts.map((c) => ({ value: c.id, label: c.name }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите контакт" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Ответственный</FieldLabel>
              <Select
                value={ownerId}
                onValueChange={setOwnerId}
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
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving && <Spinner data-icon="inline-start" />}
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
