import { z } from 'zod'
import { requireSession, assertCanWrite, assertCsrf, apiErrorResponse } from '@/lib/server/auth'
import { parsePageParams, paginate } from '@/lib/server/security'
import { getRepo, uid } from '@/lib/server/store'
import type { Contact, LeadSource } from '@/lib/types'

// GET /api/contacts?limit=50&offset=0&q=иван — paginated list scoped to tenant.
export async function GET(req: Request) {
  try {
    const session = await requireSession()
    const url = new URL(req.url)
    const page = parsePageParams(url)
    const q = url.searchParams.get('q')?.trim().toLowerCase()

    const repo = await getRepo()
    let contacts = await repo.contacts.listByCompany(session.activeCompanyId)
    if (q) {
      contacts = contacts.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q),
      )
    }
    contacts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

    return Response.json(paginate(contacts, page))
  } catch (error) {
    return apiErrorResponse(error)
  }
}

const LEAD_SOURCES = ['Сайт', 'Instagram', 'WhatsApp', 'Telegram', 'Звонок', 'Рекомендация', '2ГИС'] as const

const createContactSchema = z.object({
  name: z.string().trim().min(1, 'Укажите имя контакта').max(200),
  phone: z.string().trim().min(1, 'Укажите телефон').max(40),
  email: z.string().trim().max(200).optional().default(''),
  whatsapp: z.string().max(40).nullish(),
  telegram: z.string().max(100).nullish(),
  instagram: z.string().max(100).nullish(),
  clientCompanyId: z.string().max(64).nullish(),
  position: z.string().trim().max(120).optional().default(''),
  source: z.enum(LEAD_SOURCES).optional().default('Сайт'),
  tags: z.array(z.string().max(60)).max(20).optional().default([]),
  consent: z.boolean().optional().default(true),
})

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    await assertCsrf(req)

    const parsed = createContactSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Некорректные данные' },
        { status: 400 },
      )
    }
    const body = parsed.data

    const repo = await getRepo()
    const cid = session.activeCompanyId

    let clientCompanyId: string | null = null
    if (body.clientCompanyId) {
      const cc = await repo.clientCompanies.byId(body.clientCompanyId)
      if (cc && cc.companyId === cid) clientCompanyId = cc.id
    }

    const contact: Contact = {
      id: uid('c'),
      companyId: cid,
      name: body.name,
      phone: body.phone,
      email: body.email,
      whatsapp: body.whatsapp ?? null,
      telegram: body.telegram ?? null,
      instagram: body.instagram ?? null,
      clientCompanyId,
      position: body.position,
      source: body.source as LeadSource,
      ownerId: session.id,
      tags: body.tags,
      consent: body.consent,
      createdAt: new Date().toISOString(),
    }

    await repo.contacts.insert(contact)
    await repo.events.insert({
      id: uid('e'),
      companyId: cid,
      actorId: session.id,
      byAi: false,
      text: `${session.name} добавил(а) контакт «${contact.name}»`,
      entity: 'contact',
      entityId: contact.id,
      at: new Date().toISOString(),
    })
    await repo.audit({
      companyId: cid,
      actorId: session.id,
      action: 'contact.create',
      entity: 'contact',
      entityId: contact.id,
    })

    return Response.json(contact, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
