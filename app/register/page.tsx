'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { apiFetch } from '@/lib/api'

const BENEFITS = [
  '14 дней бесплатно, без карты',
  'AI-ассистент и воронка продаж сразу после регистрации',
  'Данные вашей компании изолированы от других',
  'Поддержка на русском и казахском',
]

export default function RegisterPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: { companyName, name, email, password },
      })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
      setPending(false)
    }
  }

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
            Зарегистрируйте компанию и начните продавать с AI
          </h1>
          <ul className="flex flex-col gap-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-muted text-success">
                  <Check className="size-3.5" />
                </div>
                <span className="text-sm leading-relaxed text-sidebar-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">AAA AI · Алматы, Казахстан</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-1.5">
            <div className="mb-4 flex items-center gap-2 lg:hidden">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <p className="font-semibold">AAA CRM</p>
            </div>
            <h2 className="text-2xl font-semibold">Создать аккаунт</h2>
            <p className="text-sm text-muted-foreground">Две минуты — и ваша CRM с AI готова к работе</p>
          </div>

          <form onSubmit={submit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="companyName">Название компании</FieldLabel>
                <Input
                  id="companyName"
                  autoComplete="organization"
                  placeholder="ТОО «Ваша компания»"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="name">Ваше имя</FieldLabel>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Имя Фамилия"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Рабочий email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.kz"
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
                    autoComplete="new-password"
                    className="pr-9"
                    minLength={8}
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
                ) : (
                  <FieldDescription>Минимум 8 символов</FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit" size="lg" disabled={pending}>
                  {pending && <Spinner data-icon="inline-start" />}
                  Зарегистрировать компанию
                </Button>
              </Field>
            </FieldGroup>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
