import { z } from 'zod'
import {
  requireSession,
  assertOwner,
  assertCsrf,
  setActiveCompany,
  apiErrorResponse,
} from '@/lib/server/auth'
import { getRepo } from '@/lib/server/store'

const switchSchema = z.object({ companyId: z.string().min(1).max(64) })

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    assertOwner(session)
    await assertCsrf(req)

    const parsed = switchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json({ error: 'Некорректные данные' }, { status: 400 })
    }

    const repo = await getRepo()
    const tenant = await repo.tenants.byId(parsed.data.companyId)
    if (!tenant) {
      return Response.json({ error: 'Компания не найдена' }, { status: 404 })
    }
    await setActiveCompany(tenant.id)
    return Response.json({ ok: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
