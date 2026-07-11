import {
  requireSession,
  assertCanWrite,
  assertTenant,
  apiErrorResponse,
  ApiError,
} from '@/lib/server/auth'
import { getDb, uid } from '@/lib/server/store'
import { STAGE_LABELS, type Deal, type DealStage } from '@/lib/types'

function findDeal(id: string) {
  const deal = getDb().deals.find((d) => d.id === id)
  if (!deal) throw new ApiError(404, 'Сделка не найдена')
  return deal
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    const { id } = await params
    const deal = findDeal(id)
    assertTenant(session, deal.companyId)

    const body = (await req.json()) as Partial<Deal> & { note?: string }
    const db = getDb()
    const nowIso = new Date().toISOString()

    if (body.stage && body.stage !== deal.stage) {
      const stage = body.stage as DealStage
      if (!STAGE_LABELS[stage]) throw new ApiError(400, 'Неизвестный этап')
      deal.stage = stage
      if (stage === 'won') {
        deal.probability = 100
        deal.closeDate = nowIso
      }
      if (stage === 'lost') {
        deal.probability = 0
        deal.closeDate = nowIso
        deal.lostReason = body.lostReason?.trim() || 'Причина не указана'
      }
      db.events.unshift({
        id: uid('e'),
        companyId: deal.companyId,
        actorId: session.id,
        byAi: false,
        text: `${session.name} перевел(а) сделку «${deal.title}» на этап «${STAGE_LABELS[stage]}»`,
        entity: 'deal',
        entityId: deal.id,
        at: nowIso,
      })
    }

    if (typeof body.title === 'string' && body.title.trim()) deal.title = body.title.trim()
    if (typeof body.amountKzt === 'number' && body.amountKzt >= 0) deal.amountKzt = body.amountKzt
    if (typeof body.probability === 'number') deal.probability = Math.min(100, Math.max(0, body.probability))
    if (body.ownerId && db.users.some((u) => u.id === body.ownerId && u.companyId === deal.companyId)) {
      deal.ownerId = body.ownerId
    }
    if ('nextActionAt' in body) deal.nextActionAt = body.nextActionAt ?? null
    if ('nextActionText' in body) deal.nextActionText = body.nextActionText ?? null
    if ('lostReason' in body && deal.stage === 'lost') deal.lostReason = body.lostReason ?? null
    if (Array.isArray(body.tags)) deal.tags = body.tags

    if (typeof body.note === 'string' && body.note.trim()) {
      deal.notes.push({ id: uid('n'), authorId: session.id, text: body.note.trim(), createdAt: nowIso })
      db.events.unshift({
        id: uid('e'),
        companyId: deal.companyId,
        actorId: session.id,
        byAi: false,
        text: `${session.name} добавил(а) заметку к сделке «${deal.title}»`,
        entity: 'deal',
        entityId: deal.id,
        at: nowIso,
      })
    }

    deal.updatedAt = nowIso
    return Response.json(deal)
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    const { id } = await params
    const deal = findDeal(id)
    assertTenant(session, deal.companyId)

    const db = getDb()
    db.deals = db.deals.filter((d) => d.id !== id)
    db.tasks = db.tasks.map((t) => (t.dealId === id ? { ...t, dealId: null } : t))
    db.events.unshift({
      id: uid('e'),
      companyId: deal.companyId,
      actorId: session.id,
      byAi: false,
      text: `${session.name} удалил(а) сделку «${deal.title}»`,
      entity: 'deal',
      entityId: null,
      at: new Date().toISOString(),
    })

    return Response.json({ ok: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
