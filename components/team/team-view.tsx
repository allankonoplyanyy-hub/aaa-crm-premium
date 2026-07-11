'use client'

import { useMemo } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { useWorkspace } from '@/hooks/use-workspace'
import { apiFetch } from '@/lib/api'
import { ROLE_LABELS } from '@/lib/labels'
import type { Role } from '@/lib/types'

const ASSIGNABLE: Role[] = ['admin', 'manager', 'viewer']

export function TeamView() {
  const { data, isLoading, mutate } = useWorkspace()

  const members = useMemo(() => {
    if (!data) return []
    return data.users.filter((u) => u.companyId === data.session.activeCompanyId)
  }, [data])

  if (isLoading || !data) return <PageSkeleton />

  const isAdmin = data.session.role === 'owner' || data.session.role === 'admin'

  async function patchUser(id: string, body: Record<string, unknown>) {
    try {
      await apiFetch(`/api/users/${id}`, { method: 'PATCH', body })
      await mutate()
      toast.success('Доступ обновлён')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось обновить')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Команда</CardTitle>
        <CardDescription>
          Роли и доступы сотрудников. Изменения доступны администраторам.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Сотрудник</TableHead>
              <TableHead>Должность</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Доступ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isOwnerRow = member.role === 'owner'
              const isSelf = member.id === data.session.id
              const editable = isAdmin && !isOwnerRow && !isSelf
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">{member.avatarInitials}</AvatarFallback>
                      </Avatar>
                      <span className="flex flex-col">
                        <span className="font-medium">
                          {member.name}
                          {isSelf && <span className="ml-1 text-xs text-muted-foreground">(вы)</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>{member.title}</TableCell>
                  <TableCell>
                    {editable ? (
                      <Select
                        value={member.role}
                        items={ASSIGNABLE.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                        onValueChange={(v) => {
                          if (v && v !== member.role) patchUser(member.id, { role: v })
                        }}
                      >
                        <SelectTrigger className="w-40" size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {ASSIGNABLE.map((r) => (
                              <SelectItem key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={isOwnerRow ? 'default' : 'secondary'}>
                        {ROLE_LABELS[member.role]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Label htmlFor={`active-${member.id}`} className="sr-only">
                        Доступ для {member.name}
                      </Label>
                      <Switch
                        id={`active-${member.id}`}
                        checked={member.active}
                        disabled={!editable}
                        onCheckedChange={(checked) => patchUser(member.id, { active: checked })}
                      />
                      <span className="text-xs text-muted-foreground">
                        {member.active ? 'Активен' : 'Отключён'}
                      </span>
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
