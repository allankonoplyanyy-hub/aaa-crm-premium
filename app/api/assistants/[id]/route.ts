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

const patchAssistantSchema = z.object({ active: z.boolean().optional() })

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    await assertCsrf(req)
    const { id } = await params

    const repo = await getRepo()
    const assistant = await repo.assistants.byId(id)
    if (!assistant) throw new ApiError(404, 'Ассистент не найден')
    assertTenant(session, assistant.companyId)

    const parsed = patchAssistantSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json({ error: 'Некорректные данные' }, { status: 400 })
    }
    const body = parsed.data

    if (typeof body.active === 'boolean') {
      assistant.active = body.active
      await repo.assistants.update(assistant)
      await repo.events.insert({
        id: uid('e'),
        companyId: assistant.companyId,
        actorId: session.id,
        byAi: false,
        text: `${session.name} ${body.active ? 'запустил(а)' : 'приостановил(а)'} AI-ассистента «${assistant.name}»`,
        entity: 'system',
        entityId: assistant.id,
        at: new Date().toISOString(),
      })
    }

    return Response.json(assistant)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
