'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { useWorkspace } from '@/hooks/use-workspace'
import { ROLE_LABELS } from '@/lib/labels'
import { formatKztShort } from '@/lib/format'

const DEMO_ACCOUNTS = [
  { email: 'owner@aaa.ai', role: 'Владелец платформы (все компании, CEO-панель)' },
  { email: 'admin@school.kz', role: 'Администратор «Академия Успех»' },
  { email: 'manager@school.kz', role: 'Менеджер «Академия Успех»' },
  { email: 'viewer@school.kz', role: 'Наблюдатель (только чтение)' },
]

export function SettingsView() {
  const { data, isLoading } = useWorkspace()

  if (isLoading || !data) return <PageSkeleton />

  const tenant = data.tenants.find((t) => t.id === data.session.activeCompanyId)

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
          <CardDescription>Данные текущей учётной записи</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="text-lg">{data.session.avatarInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="font-medium">{data.session.name}</p>
              <p className="text-sm text-muted-foreground">{data.session.email}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{ROLE_LABELS[data.session.role]}</Badge>
                <span className="text-xs text-muted-foreground">{data.session.title}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {tenant && (
        <Card>
          <CardHeader>
            <CardTitle>Компания</CardTitle>
            <CardDescription>Текущее рабочее пространство</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Название</span>
              <span className="font-medium">{tenant.name}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">БИН</span>
              <span>{tenant.bin}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ниша</span>
              <span>{tenant.niche}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Город</span>
              <span>{tenant.city}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Тариф</span>
              <Badge variant="secondary">{tenant.plan}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Лимит AI в месяц</span>
              <span>{formatKztShort(tenant.aiLimitKzt)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Демо-доступы</CardTitle>
          <CardDescription>
            Пароль для всех аккаунтов: <span className="font-mono">demo1234</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {DEMO_ACCOUNTS.map((acc) => (
            <div key={acc.email} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-mono text-xs">{acc.email}</span>
              <span className="text-right text-xs text-muted-foreground">{acc.role}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
