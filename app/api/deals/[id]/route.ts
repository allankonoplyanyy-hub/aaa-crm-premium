import { z } from 'zod'
import {
  requireSession,
  assertCanWrite,
  assertCsrf,
  assertTenant,
  apiErrorResponse,
  ApiError,
} from '@/lib/server/auth'
import { getRepo, uid } from '@/lib/server/store'
import { STAGE_LABELS, type DealStage } from '@/lib/types'

const STAGES = ['new', 'qualification', 'proposal', 'negotiation', 'approval', 'won', 'lost'] as const

const patchDealSchema = z.object({
  stage: z.enum(STAGES).optional(),
  title: z.string().trim().min(1).max(300).optional(),
  amountKzt: z.number().finite().min(0).max(1_000_000_000_000).optional(),
  probability: z.number().min(0).max(100).optional(),
  ownerId: z.string().max(64).optional(),
  nextActionAt: z.string().nullish(),
  nextActionText: z.string().max(500).nullish(),
  lostReason: z.string().max(500).nullish(),
  tags: z.array(z.string().max(60)).max(20).optional(),
  note: z.string().max(2000).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    await assertCsrf(req)
    const { id } = await params

    const repo = await getRepo()
    const deal = await repo.deals.byId(id)
    if (!deal) throw new ApiError(404, 'Сделка не найдена')
    assertTenant(session, deal.companyId)

    const raw = (await req.json()) as Record<string, unknown>
    const parsed = patchDealSchema.safeParse(raw)
    if (!parsed.success) {
      return Response.json({ error: 'Некорректные данные' }, { status: 400 })
    }
    const body = parsed.data
    const nowIso = new Date().toISOString()

    if (body.stage && body.stage !== deal.stage) {
      const stage = body.stage as DealStage
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
      await repo.events.insert({
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

    if (body.title) deal.title = body.title
    if (typeof body.amountKzt === 'number') deal.amountKzt = body.amountKzt
    if (typeof body.probability === 'number') deal.probability = body.probability
    if (body.ownerId) {
      const u = await repo.users.byId(body.ownerId)
      if (u && u.companyId === deal.companyId) deal.ownerId = u.id
    }
    if ('nextActionAt' in raw) deal.nextActionAt = body.nextActionAt ?? null
    if ('nextActionText' in raw) deal.nextActionText = body.nextActionText ?? null
    if ('lostReason' in raw && deal.stage === 'lost') deal.lostReason = body.lostReason ?? null
    if (body.tags) deal.tags = body.tags

    if (body.note?.trim()) {
      deal.notes.push({ id: uid('n'), authorId: session.id, text: body.note.trim(), createdAt: nowIso })
      await repo.events.insert({
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
    await repo.deals.update(deal)
    await repo.audit({
      companyId: deal.companyId,
      actorId: session.id,
      action: 'deal.update',
      entity: 'deal',
      entityId: deal.id,
    })

    return Response.json(deal)
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    await assertCsrf(req)
    const { id } = await params

    const repo = await getRepo()
    const deal = await repo.deals.byId(id)
    if (!deal) throw new ApiError(404, 'Сделка не найдена')
    assertTenant(session, deal.companyId)

    await repo.deals.remove(id)
    // Detach tasks that referenced the deleted deal.
    const tasks = await repo.tasks.listByCompany(deal.companyId)
    for (const t of tasks) {
      if (t.dealId === id) {
        t.dealId = null
        await repo.tasks.update(t)
      }
    }
    await repo.events.insert({
      id: uid('e'),
      companyId: deal.companyId,
      actorId: session.id,
      byAi: false,
      text: `${session.name} удалил(а) сделку «${deal.title}»`,
      entity: 'deal',
      entityId: null,
      at: new Date().toISOString(),
    })
    await repo.audit({
      companyId: deal.companyId,
      actorId: session.id,
      action: 'deal.delete',
      entity: 'deal',
      entityId: id,
    })

    return Response.json({ ok: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
