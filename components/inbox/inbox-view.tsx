'use client'

import * as React from 'react'
import { useMemo, useState } from 'react'
import { Bot, Send, UserRound, Globe, MessageCircle, Camera, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from '@/components/ui/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { useWorkspace, canWrite } from '@/hooks/use-workspace'
import { apiFetch } from '@/lib/api'
import { formatTime, relativeTime } from '@/lib/format'
import { CHANNEL_LABELS, type Channel, type Conversation } from '@/lib/types'
import { cn } from '@/lib/utils'

const CHANNEL_ICONS: Record<Channel, React.ComponentType<{ className?: string }>> = {
  telegram: Send,
  instagram: Camera,
  whatsapp: MessageCircle,
  website: Globe,
  email: Mail,
}

export function InboxView() {
  const { data, isLoading, mutate } = useWorkspace()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const conversations = useMemo(() => {
    if (!data) return []
    return [...data.conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [data])

  const contactsById = useMemo(() => new Map((data?.contacts ?? []).map((c) => [c.id, c])), [data])
  const usersById = useMemo(() => new Map((data?.users ?? []).map((u) => [u.id, u])), [data])

  const selected = conversations.find((c) => c.id === selectedId) ?? conversations[0] ?? null
  const writable = canWrite(data?.session.role)

  async function patchConversation(id: string, body: Record<string, unknown>) {
    await apiFetch(`/api/conversations/${id}`, { method: 'PATCH', body })
    await mutate()
  }

  async function handleSend() {
    if (!selected || !draft.trim() || sending) return
    setSending(true)
    try {
      await patchConversation(selected.id, { message: draft })
      setDraft('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось отправить')
    } finally {
      setSending(false)
    }
  }

  if (isLoading || !data) return <PageSkeleton />

  if (conversations.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageCircle />
          </EmptyMedia>
          <EmptyTitle>Нет диалогов</EmptyTitle>
          <EmptyDescription>Входящие сообщения из мессенджеров появятся здесь.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex h-[calc(100svh-8rem)] min-h-0 overflow-hidden rounded-xl border bg-card">
      {/* Conversation list */}
      <div className="flex w-full max-w-xs shrink-0 flex-col border-r">
        <div className="border-b p-3">
          <h2 className="text-sm font-semibold">Диалоги</h2>
          <p className="text-xs text-muted-foreground">
            {conversations.filter((c) => c.handledBy === 'ai').length} ведёт AI ·{' '}
            {conversations.reduce((s, c) => s + c.unread, 0)} непрочитанных
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const contact = contactsById.get(conv.contactId)
            const last = conv.messages[conv.messages.length - 1]
            const ChannelIcon = CHANNEL_ICONS[conv.channel]
            const isActive = selected?.id === conv.id
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => {
                  setSelectedId(conv.id)
                  if (conv.unread > 0) {
                    patchConversation(conv.id, { markRead: true }).catch(() => {})
                  }
                }}
                className={cn(
                  'flex w-full items-start gap-3 border-b p-3 text-left transition-colors hover:bg-accent',
                  isActive && 'bg-accent',
                )}
              >
                <Avatar className="size-9">
                  <AvatarFallback>{contact?.name.slice(0, 2).toUpperCase() ?? '??'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{contact?.name ?? 'Неизвестный'}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {relativeTime(conv.updatedAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <ChannelIcon className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs text-muted-foreground">{last?.text}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {conv.handledBy === 'ai' ? (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Bot className="size-3" />
                        AI
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <UserRound className="size-3" />
                        {usersById.get(conv.assigneeId ?? '')?.name.split(' ')[0] ?? 'Менеджер'}
                      </Badge>
                    )}
                    {conv.unread > 0 && <Badge className="text-[10px]">{conv.unread}</Badge>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Thread */}
      {selected ? (
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 border-b p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {contactsById.get(selected.contactId)?.name ?? 'Неизвестный'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {CHANNEL_LABELS[selected.channel]} ·{' '}
                {selected.handledBy === 'ai' ? 'Ведёт AI-ассистент' : 'Ведёт менеджер'}
              </p>
            </div>
            {writable && selected.handledBy === 'ai' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  patchConversation(selected.id, { transferToHuman: true })
                    .then(() => toast.success('Диалог передан вам'))
                    .catch(() => toast.error('Не удалось передать диалог'))
                }
              >
                <UserRound data-icon="inline-start" />
                Взять диалог
              </Button>
            )}
          </div>

          {selected.aiSummary && (
            <div className="border-b bg-muted/50 px-4 py-2">
              <p className="text-xs text-muted-foreground">
                <Bot className="mr-1 inline size-3" />
                {selected.aiSummary}
              </p>
            </div>
          )}

          <MessageScrollerProvider autoScroll>
            <MessageScroller className="min-h-0 flex-1">
              <MessageScrollerViewport>
                <MessageScrollerContent className="p-4">
                  {selected.messages.map((msg) => {
                    const isClient = msg.from === 'client'
                    const author =
                      msg.from === 'ai'
                        ? 'AI-ассистент'
                        : msg.from === 'manager'
                          ? (usersById.get(msg.authorId ?? '')?.name ?? 'Менеджер')
                          : (contactsById.get(selected.contactId)?.name ?? 'Клиент')
                    return (
                      <MessageScrollerItem key={msg.id} messageId={msg.id}>
                        <Message align={isClient ? 'start' : 'end'}>
                          {isClient && (
                            <MessageAvatar>
                              <Avatar className="size-8">
                                <AvatarFallback>
                                  {author.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </MessageAvatar>
                          )}
                          <MessageContent>
                            <MessageHeader>
                              {author}
                              {msg.from === 'ai' && <Bot className="ml-1 size-3" />}
                            </MessageHeader>
                            <Bubble
                              variant={isClient ? 'muted' : msg.from === 'ai' ? 'tinted' : 'default'}
                              align={isClient ? 'start' : 'end'}
                            >
                              <BubbleContent>{msg.text}</BubbleContent>
                            </Bubble>
                            <MessageFooter>{formatTime(msg.at)}</MessageFooter>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    )
                  })}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>

          {writable && (
            <div className="border-t p-3">
              <InputGroup>
                <InputGroupTextarea
                  placeholder="Написать сообщение..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing &&
                      e.keyCode !== 229
                    ) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  rows={1}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label="Отправить"
                    onClick={handleSend}
                    disabled={sending || !draft.trim()}
                  >
                    <Send />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
