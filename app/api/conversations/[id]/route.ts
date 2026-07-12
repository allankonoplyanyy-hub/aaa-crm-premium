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

const patchConversationSchema = z.object({
  markRead: z.boolean().optional(),
  transferToHuman: z.boolean().optional(),
  message: z.string().max(4000).optional(),
})

// PATCH: mark read / transfer to human / send message
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params

    const repo = await getRepo()
    const conv = await repo.conversations.byId(id)
    if (!conv) throw new ApiError(404, 'Диалог не найден')
    assertTenant(session, conv.companyId)

    const parsed = patchConversationSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json({ error: 'Некорректные данные' }, { status: 400 })
    }
    const body = parsed.data

    // Reading is allowed for all roles including viewer.
    if (body.markRead) {
      conv.unread = 0
    }

    if (body.transferToHuman) {
      assertCanWrite(session)
      await assertCsrf(req)
      conv.handledBy = 'human'
      conv.assigneeId = session.id
      await repo.events.insert({
        id: uid('e'),
        companyId: conv.companyId,
        actorId: session.id,
        byAi: false,
        text: `${session.name} принял(а) диалог от AI-ассистента`,
        entity: 'conversation',
        entityId: conv.id,
        at: new Date().toISOString(),
      })
    }

    if (body.message?.trim()) {
      assertCanWrite(session)
      await assertCsrf(req)
      conv.messages.push({
        id: uid('m'),
        from: 'manager',
        authorId: session.id,
        text: body.message.trim(),
        at: new Date().toISOString(),
        status: 'sent',
      })
      conv.handledBy = 'human'
      conv.assigneeId = session.id
      conv.updatedAt = new Date().toISOString()
    }

    await repo.conversations.update(conv)
    return Response.json(conv)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
