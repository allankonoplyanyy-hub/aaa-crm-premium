import { z } from 'zod'
import { requireSession, assertCanWrite, assertCsrf, apiErrorResponse } from '@/lib/server/auth'
import { getRepo, uid } from '@/lib/server/store'
import type { ClientCompany } from '@/lib/types'

const createClientCompanySchema = z.object({
  name: z.string().trim().min(1, 'Укажите название компании').max(200),
  bin: z.string().trim().max(20).optional().default(''),
  niche: z.string().trim().max(120).optional().default(''),
  size: z.string().trim().max(30).optional().default('1-10'),
  website: z.string().trim().max(300).optional().default(''),
  address: z.string().trim().max(400).optional().default(''),
})

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    await assertCsrf(req)

    const parsed = createClientCompanySchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Некорректные данные' },
        { status: 400 },
      )
    }
    const body = parsed.data

    const repo = await getRepo()
    const company: ClientCompany = {
      id: uid('kc'),
      companyId: session.activeCompanyId,
      name: body.name,
      bin: body.bin,
      niche: body.niche,
      size: body.size,
      website: body.website,
      address: body.address,
      ownerId: session.id,
      createdAt: new Date().toISOString(),
    }

    await repo.clientCompanies.insert(company)
    await repo.audit({
      companyId: company.companyId,
      actorId: session.id,
      action: 'client_company.create',
      entity: 'client_company',
      entityId: company.id,
    })
    return Response.json(company, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
