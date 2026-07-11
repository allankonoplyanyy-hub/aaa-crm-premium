'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, Bot, TrendingUp, MessageSquare, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { apiFetch } from '@/lib/api'
import { IS_DEMO, DEMO_PASSWORD_HINT } from '@/lib/demo'

const DEMO_ACCOUNTS = [
  { email: 'owner@aaa.ai', label: 'Владелец платформы', role: 'CEO AAA AI' },
  { email: 'admin@school.kz', label: 'Администратор', role: 'Академия Успех' },
  { email: 'manager@school.kz', label: 'Менеджер', role: 'Академия Успех' },
  { email: 'viewer@school.kz', label: 'Наблюдатель', role: 'Академия Успех' },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(IS_DEMO ? 'manager@school.kz' : '')
  const [password, setPassword] = useState(IS_DEMO ? DEMO_PASSWORD_HINT : '')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(loginEmail: string, loginPassword: string) {
    setError(null)
    setPending(true)
    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email: loginEmail, password: loginPassword },
      })
      const next = searchParams.get('next')
      router.push(next && next.startsWith('/') ? next : '/dashboard')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка входа')
      setPending(false)
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <div className="mb-4 flex items-center gap-2 lg:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <p className="font-semibold">AAA CRM</p>
        </div>
        <h2 className="text-2xl font-semibold">Вход в систему</h2>
        <p className="text-sm text-muted-foreground">Войдите, чтобы продолжить работу с клиентами</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(email, password)
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="password">Пароль</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="pr-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {error ? (
              <FieldDescription className="text-destructive">{error}</FieldDescription>
            ) : IS_DEMO ? (
              <FieldDescription>Демо-пароль: {DEMO_PASSWORD_HINT}</FieldDescription>
            ) : null}
          </Field>
          <Field>
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Войти
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Нет аккаунта?{' '}
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Зарегистрировать компанию
        </Link>
      </p>

      {IS_DEMO && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">Демо-доступы</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={pending}
                onClick={() => {
                  setEmail(acc.email)
                  setPassword(DEMO_PASSWORD_HINT)
                  submit(acc.email, DEMO_PASSWORD_HINT)
                }}
                className="flex flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
              >
                <span className="text-sm font-medium">{acc.label}</span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {acc.role}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-svh">
      {/* Brand panel */}
      <div className="hidden flex-1 flex-col justify-between bg-sidebar p-10 lg:flex">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="font-semibold leading-tight text-sidebar-foreground">AAA CRM</p>
              <p className="text-xs text-muted-foreground">AI-платформа продаж</p>
            </div>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            На главную
          </Link>
        </div>

        <div className="flex max-w-md flex-col gap-8">
          <h1 className="text-3xl font-semibold leading-tight text-balance text-sidebar-foreground">
            CRM, в которой продают и люди, и искусственный интеллект
          </h1>
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="size-4.5" />
              </div>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">AI-менеджеры 24/7</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Ассистенты отвечают в WhatsApp, Telegram и Instagram, квалифицируют лиды и создают сделки
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="size-4.5" />
              </div>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">Все каналы в одном окне</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Диалоги, звонки и задачи связаны со сделками — ничего не теряется
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="size-4.5" />
              </div>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">Прозрачная аналитика</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Воронка, конверсия и вклад AI в выручку — на одном экране
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">AAA AI · Алматы, Казахстан</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
