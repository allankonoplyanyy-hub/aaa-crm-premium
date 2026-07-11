'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { DealCardContent } from '@/components/pipeline/deal-card'
import { formatKztShort } from '@/lib/format'
import { STAGE_LABELS, STAGE_ORDER, type Contact, type Deal, type DealStage, type User } from '@/lib/types'
import { cn } from '@/lib/utils'

const KANBAN_STAGES = STAGE_ORDER.filter((s) => s !== 'lost')

function DraggableCard({
  deal,
  owner,
  contact,
  disabled,
  onOpen,
}: {
  deal: Deal
  owner: User | undefined
  contact: Contact | null | undefined
  disabled: boolean
  onOpen: (deal: Deal) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    disabled,
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpen(deal)}
      className={cn('w-full cursor-pointer text-left outline-none', isDragging && 'opacity-30')}
      {...listeners}
      {...attributes}
    >
      <DealCardContent deal={deal} owner={owner} contact={contact} />
    </button>
  )
}

function StageColumn({
  stage,
  deals,
  usersById,
  contactsById,
  canDrag,
  onOpen,
}: {
  stage: DealStage
  deals: Deal[]
  usersById: Map<string, User>
  contactsById: Map<string, Contact>
  canDrag: boolean
  onOpen: (deal: Deal) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const total = deals.reduce((s, d) => s + d.amountKzt, 0)
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-muted/50 p-2 transition-colors',
        isOver && 'bg-primary/8 ring-2 ring-primary/30',
      )}
    >
      <div className="flex items-center justify-between px-1.5 pt-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'size-2 rounded-full',
              stage === 'won' ? 'bg-success' : 'bg-primary/60',
            )}
            aria-hidden
          />
          <h3 className="text-sm font-medium">{STAGE_LABELS[stage]}</h3>
          <span className="text-xs tabular-nums text-muted-foreground">{deals.length}</span>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{formatKztShort(total)}</span>
      </div>
      <div className="flex min-h-24 flex-col gap-2 overflow-y-auto pb-1">
        {deals.map((deal) => (
          <DraggableCard
            key={deal.id}
            deal={deal}
            owner={usersById.get(deal.ownerId)}
            contact={deal.contactId ? contactsById.get(deal.contactId) : null}
            disabled={!canDrag}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  )
}

export function KanbanBoard({
  deals,
  usersById,
  contactsById,
  canDrag,
  onStageChange,
  onOpen,
}: {
  deals: Deal[]
  usersById: Map<string, User>
  contactsById: Map<string, Contact>
  canDrag: boolean
  onStageChange: (dealId: string, stage: DealStage) => void
  onOpen: (deal: Deal) => void
}) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragStart(event: DragStartEvent) {
    setActiveDeal(deals.find((d) => d.id === event.active.id) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null)
    const { active, over } = event
    if (!over) return
    const deal = deals.find((d) => d.id === active.id)
    const stage = over.id as DealStage
    if (deal && deal.stage !== stage && STAGE_LABELS[stage]) {
      onStageChange(deal.id, stage)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {KANBAN_STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            deals={deals.filter((d) => d.stage === stage)}
            usersById={usersById}
            contactsById={contactsById}
            canDrag={canDrag}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal && (
          <DealCardContent
            deal={activeDeal}
            owner={usersById.get(activeDeal.ownerId)}
            contact={activeDeal.contactId ? contactsById.get(activeDeal.contactId) : null}
            className="w-72 rotate-2 shadow-lg"
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
