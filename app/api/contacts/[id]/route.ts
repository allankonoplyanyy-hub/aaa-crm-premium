import { z } from 'zod'
import {
  requireSession,
  assertCanWrite,
  assertCsrf,
  assertTenant,
  apiErrorResponse,
  ApiError,
} from '@/lib/server/auth'
import { getRepo } from '@/lib/server/store'

const patchContactSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().min(1).max(40).optional(),
  email: z.string().trim().max(200).optional(),
  whatsapp: z.string().max(40).nullish(),
  telegram: z.string().max(100).nullish(),
  instagram: z.string().max(100).nullish(),
  clientCompanyId: z.string().max(64).nullish(),
  position: z.string().trim().max(120).optional(),
  consent: z.boolean().optional(),
  tags: z.array(z.string().max(60)).max(20).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    await assertCsrf(req)
    const { id } = await params

    const repo = await getRepo()
    const contact = await repo.contacts.byId(id)
    if (!contact) throw new ApiError(404, 'Контакт не найден')
    assertTenant(session, contact.companyId)

    const raw = (await req.json()) as Record<string, unknown>
    const parsed = patchContactSchema.safeParse(raw)
    if (!parsed.success) {
      return Response.json({ error: 'Некорректные данные' }, { status: 400 })
    }
    const body = parsed.data

    if (body.name) contact.name = body.name
    if (body.phone) contact.phone = body.phone
    if (typeof body.email === 'string') contact.email = body.email
    if ('whatsapp' in raw) contact.whatsapp = body.whatsapp ?? null
    if ('telegram' in raw) contact.telegram = body.telegram ?? null
    if ('instagram' in raw) contact.instagram = body.instagram ?? null
    if (typeof body.position === 'string') contact.position = body.position
    if (typeof body.consent === 'boolean') contact.consent = body.consent
    if (body.tags) contact.tags = body.tags
    if ('clientCompanyId' in raw) {
      if (body.clientCompanyId === null || body.clientCompanyId === undefined) {
        contact.clientCompanyId = null
      } else {
        const cc = await repo.clientCompanies.byId(body.clientCompanyId)
        if (cc && cc.companyId === contact.companyId) contact.clientCompanyId = cc.id
      }
    }

    await repo.contacts.update(contact)
    await repo.audit({
      companyId: contact.companyId,
      actorId: session.id,
      action: 'contact.update',
      entity: 'contact',
      entityId: contact.id,
    })

    return Response.json(contact)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
