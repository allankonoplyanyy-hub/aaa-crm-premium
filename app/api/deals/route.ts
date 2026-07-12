import { z } from 'zod'
import { requireSession, assertCanWrite, assertCsrf, apiErrorResponse } from '@/lib/server/auth'
import { parsePageParams, paginate } from '@/lib/server/security'
import { getRepo, uid } from '@/lib/server/store'
import type { Deal, DealStage, LeadSource } from '@/lib/types'

// GET /api/deals?limit=50&offset=0&stage=new — paginated list scoped to tenant.
export async function GET(req: Request) {
  try {
    const session = await requireSession()
    const url = new URL(req.url)
    const page = parsePageParams(url)
    const stage = url.searchParams.get('stage')

    const repo = await getRepo()
    let deals = await repo.deals.listByCompany(session.activeCompanyId)
    if (stage) deals = deals.filter((d) => d.stage === stage)
    deals.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

    return Response.json(paginate(deals, page))
  } catch (error) {
    return apiErrorResponse(error)
  }
}

const LEAD_SOURCES = ['Сайт', 'Instagram', 'WhatsApp', 'Telegram', 'Звонок', 'Рекомендация', '2ГИС'] as const
const STAGES = ['new', 'qualification', 'proposal', 'negotiation', 'approval', 'won', 'lost'] as const

const createDealSchema = z.object({
  title: z.string().trim().min(1, 'Укажите название сделки').max(300),
  amountKzt: z.number().finite().min(0, 'Некорректная сумма').max(1_000_000_000_000),
  stage: z.enum(STAGES).optional().default('new'),
  contactId: z.string().max(64).nullish(),
  ownerId: z.string().max(64).nullish(),
  source: z.enum(LEAD_SOURCES).optional().default('Сайт'),
  probability: z.number().min(0).max(100).optional().default(20),
  nextActionAt: z.string().nullish(),
  nextActionText: z.string().max(500).nullish(),
  closeDate: z.string().nullish(),
  tags: z.array(z.string().max(60)).max(20).optional().default([]),
})

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    await assertCsrf(req)

    const parsed = createDealSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Некорректные данные' },
        { status: 400 },
      )
    }
    const body = parsed.data

    const repo = await getRepo()
    const cid = session.activeCompanyId

    let contact = null
    if (body.contactId) {
      const c = await repo.contacts.byId(body.contactId)
      if (c && c.companyId === cid) contact = c
    }
    let ownerId = session.id
    if (body.ownerId) {
      const u = await repo.users.byId(body.ownerId)
      if (u && u.companyId === cid) ownerId = u.id
    }

    const nowIso = new Date().toISOString()
    const deal: Deal = {
      id: uid('d'),
      companyId: cid,
      title: body.title,
      clientCompanyId: contact?.clientCompanyId ?? null,
      contactId: contact?.id ?? null,
      amountKzt: body.amountKzt,
      stage: body.stage as DealStage,
      ownerId,
      source: body.source as LeadSource,
      probability: body.probability,
      nextActionAt: body.nextActionAt ?? null,
      nextActionText: body.nextActionText ?? null,
      closeDate: body.closeDate ?? null,
      tags: body.tags,
      aiCreated: false,
      lostReason: null,
      notes: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    await repo.deals.insert(deal)
    await repo.events.insert({
      id: uid('e'),
      companyId: cid,
      actorId: session.id,
      byAi: false,
      text: `${session.name} создал(а) сделку «${deal.title}»`,
      entity: 'deal',
      entityId: deal.id,
      at: nowIso,
    })
    await repo.audit({
      companyId: cid,
      actorId: session.id,
      action: 'deal.create',
      entity: 'deal',
      entityId: deal.id,
    })

    return Response.json(deal, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
