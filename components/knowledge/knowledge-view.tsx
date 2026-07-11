'use client'

import { useMemo, useState } from 'react'
import { BookOpen, FileText, CircleCheck, CircleDashed } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { useWorkspace } from '@/hooks/use-workspace'
import { formatDate } from '@/lib/format'
import type { KnowledgeDoc } from '@/lib/types'

const CATEGORIES = ['Все', 'Документы', 'FAQ', 'Услуги', 'Цены', 'Правила', 'Запрещённые ответы'] as const

export function KnowledgeView() {
  const { data, isLoading } = useWorkspace()
  const [category, setCategory] = useState<string>('Все')
  const [openDoc, setOpenDoc] = useState<KnowledgeDoc | null>(null)

  const docs = useMemo(() => {
    if (!data) return []
    const list = [...data.knowledgeDocs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    if (category === 'Все') return list
    return list.filter((d) => d.category === category)
  }, [data, category])

  if (isLoading || !data) return <PageSkeleton />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {data.knowledgeDocs.length} документов ·{' '}
          {data.knowledgeDocs.filter((d) => d.indexed).length} проиндексировано для AI
        </p>
        <Tabs value={category} onValueChange={(v) => v && setCategory(v)}>
          <TabsList>
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c}>
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {docs.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>Нет документов</EmptyTitle>
            <EmptyDescription>В этой категории пока пусто.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setOpenDoc(doc)}
              className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-2">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                {doc.indexed ? (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <CircleCheck className="size-3" />
                    В базе AI
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <CircleDashed className="size-3" />
                    Не проиндексирован
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-pretty">{doc.title}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{doc.content}</p>
              <p className="mt-auto text-xs text-muted-foreground">
                {doc.category} · обновлён {formatDate(doc.updatedAt)}
              </p>
            </button>
          ))}
        </div>
      )}

      <Sheet open={openDoc !== null} onOpenChange={(open) => !open && setOpenDoc(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {openDoc && (
            <>
              <SheetHeader>
                <SheetTitle>{openDoc.title}</SheetTitle>
                <SheetDescription>
                  {openDoc.category} · {openDoc.assistant} · обновлён {formatDate(openDoc.updatedAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="overflow-y-auto px-4 pb-6">
                <p className="text-sm leading-relaxed whitespace-pre-line">{openDoc.content}</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
