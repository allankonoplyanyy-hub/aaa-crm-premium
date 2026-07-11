import { findUser, setSession, verifyPassword, apiErrorResponse } from '@/lib/server/auth'
import { DEMO_PASSWORD } from '@/lib/server/seed'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string }
    const email = body.email?.trim() ?? ''
    const password = body.password ?? ''

    if (!email || !password) {
      return Response.json({ error: 'Укажите email и пароль' }, { status: 400 })
    }

    const user = findUser(email)
    if (!user || !(await verifyPassword(user, password, DEMO_PASSWORD))) {
      return Response.json({ error: 'Неверный email или пароль' }, { status: 401 })
    }
    if (!user.active) {
      return Response.json({ error: 'Учетная запись приостановлена' }, { status: 403 })
    }

    await setSession(user.id)
    return Response.json({ ok: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
