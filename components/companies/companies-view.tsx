'use client'

import { useMemo, useState } from 'react'
import { Search, Building2, Globe, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useWorkspace } from '@/hooks/use-workspace'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { formatKztShort } from '@/lib/format'

export function CompaniesView() {
  const { data, isLoading } = useWorkspace()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    if (!q) return data.clientCompanies
    return data.clientCompanies.filter(
      (c) => c.name.toLowerCase().includes(q) || c.niche.toLowerCase().includes(q),
    )
  }, [data, query])

  if (isLoading || !data) return <PageSkeleton />

  return (
    <div className="flex flex-col gap-4">
      <InputGroup className="w-64">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Поиск компаний..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>

      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 />
            </EmptyMedia>
            <EmptyTitle>Компании не найдены</EmptyTitle>
            <EmptyDescription>Попробуйте изменить запрос</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((company) => {
            const contacts = data.contacts.filter((c) => c.clientCompanyId === company.id)
            const deals = data.deals.filter((d) => d.clientCompanyId === company.id)
            const openAmount = deals
              .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
              .reduce((s, d) => s + d.amountKzt, 0)
            const wonAmount = deals
              .filter((d) => d.stage === 'won')
              .reduce((s, d) => s + d.amountKzt, 0)
            return (
              <Card key={company.id}>
                <CardHeader>
                  <CardTitle className="text-base">{company.name}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Badge variant="outline">{company.niche}</Badge>
                    <span>{company.size}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {company.website && (
                      <span className="flex items-center gap-1.5">
                        <Globe className="size-3" />
                        {company.website}
                      </span>
                    )}
                    {company.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3" />
                        {company.address}
                      </span>
                    )}
                    <span className="tabular-nums">БИН {company.bin}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-3 text-center">
                    <div>
                      <p className="text-sm font-semibold tabular-nums">{contacts.length}</p>
                      <p className="text-xs text-muted-foreground">Контакты</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold tabular-nums">
                        {formatKztShort(openAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">В работе</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold tabular-nums">
                        {formatKztShort(wonAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">Выиграно</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
