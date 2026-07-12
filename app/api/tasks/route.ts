import { z } from 'zod'
import {
  requireSession,
  assertCanWrite,
  assertCsrf,
  apiErrorResponse,
} from '@/lib/server/auth'
import { parsePageParams, paginate } from '@/lib/server/security'
import { getRepo, uid } from '@/lib/server/store'
import type { Task, TaskType } from '@/lib/types'

// GET /api/tasks?limit=50&offset=0&done=false — paginated list scoped to tenant.
export async function GET(req: Request) {
  try {
    const session = await requireSession()
    const url = new URL(req.url)
    const page = parsePageParams(url)
    const done = url.searchParams.get('done')

    const repo = await getRepo()
    let tasks = await repo.tasks.listByCompany(session.activeCompanyId)
    if (done === 'true') tasks = tasks.filter((t) => t.done)
    if (done === 'false') tasks = tasks.filter((t) => !t.done)
    tasks.sort((a, b) => (a.dueAt > b.dueAt ? 1 : -1))

    return Response.json(paginate(tasks, page))
  } catch (error) {
    return apiErrorResponse(error)
  }
}

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Укажите название задачи').max(300),
  dueAt: z.string().min(1, 'Укажите срок задачи'),
  type: z.enum(['call', 'meeting', 'message', 'proposal', 'followup']).default('call'),
  assigneeId: z.string().max(64).nullish(),
  dealId: z.string().max(64).nullish(),
  contactId: z.string().max(64).nullish(),
})

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    await assertCsrf(req)

    const parsed = createTaskSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Некорректные данные' },
        { status: 400 },
      )
    }
    const body = parsed.data

    const repo = await getRepo()
    const cid = session.activeCompanyId

    // Referenced entities must belong to the same tenant.
    let assigneeId = session.id
    if (body.assigneeId) {
      const u = await repo.users.byId(body.assigneeId)
      if (u && u.companyId === cid) assigneeId = u.id
    }
    let dealId: string | null = null
    if (body.dealId) {
      const d = await repo.deals.byId(body.dealId)
      if (d && d.companyId === cid) dealId = d.id
    }
    let contactId: string | null = null
    if (body.contactId) {
      const c = await repo.contacts.byId(body.contactId)
      if (c && c.companyId === cid) contactId = c.id
    }

    const task: Task = {
      id: uid('tk'),
      companyId: cid,
      title: body.title,
      type: body.type as TaskType,
      dueAt: body.dueAt,
      done: false,
      assigneeId,
      dealId,
      contactId,
      createdAt: new Date().toISOString(),
    }

    await repo.tasks.insert(task)
    await repo.events.insert({
      id: uid('e'),
      companyId: cid,
      actorId: session.id,
      byAi: false,
      text: `${session.name} создал(а) задачу «${task.title}»`,
      entity: 'task',
      entityId: task.id,
      at: new Date().toISOString(),
    })
    await repo.audit({
      companyId: cid,
      actorId: session.id,
      action: 'task.create',
      entity: 'task',
      entityId: task.id,
    })

    return Response.json(task, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
