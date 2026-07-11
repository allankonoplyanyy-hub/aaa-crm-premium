import Link from 'next/link'
import Image from 'next/image'
import {
  Bot,
  MessageSquare,
  Phone,
  KanbanSquare,
  BarChart3,
  BookOpen,
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LandingHeader } from './landing-header'

const FEATURES = [
  {
    icon: Bot,
    title: 'AI-менеджеры 24/7',
    text: 'Ассистенты отвечают клиентам в WhatsApp, Telegram и Instagram, квалифицируют лиды и сами создают сделки — даже ночью и в выходные.',
  },
  {
    icon: MessageSquare,
    title: 'Омниканальный inbox',
    text: 'Все диалоги из мессенджеров, сайта и почты — в одном окне. Менеджер видит историю и может перехватить разговор у AI в один клик.',
  },
  {
    icon: Phone,
    title: 'Voice AI для звонков',
    text: 'Голосовой ассистент принимает входящие звонки, записывает клиентов и оставляет транскрипт с кратким AI-резюме.',
  },
  {
    icon: KanbanSquare,
    title: 'Воронка продаж',
    text: 'Наглядная kanban-доска сделок с drag-and-drop, суммами по этапам и прогнозом. Ни одна сделка не потеряется.',
  },
  {
    icon: BarChart3,
    title: 'Отчёты и аналитика',
    text: 'Конверсия по этапам, выручка по менеджерам, вклад AI в продажи — прозрачные отчёты без Excel.',
  },
  {
    icon: BookOpen,
    title: 'База знаний для AI',
    text: 'Загрузите цены, услуги и регламенты — AI-ассистенты отвечают точно по вашим материалам, без выдумок.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Подключите каналы',
    text: 'WhatsApp, Telegram, Instagram, сайт и телефония подключаются за один день — без программистов.',
  },
  {
    n: '02',
    title: 'Обучите AI-ассистента',
    text: 'Добавьте услуги, цены и правила в базу знаний. Ассистент начнёт отвечать клиентам в вашем стиле.',
  },
  {
    n: '03',
    title: 'Контролируйте продажи',
    text: 'AI создаёт лиды и ведёт диалоги, команда закрывает сделки, а вы видите всю картину в отчётах.',
  },
]

const PLANS = [
  {
    name: 'Старт',
    price: '49 000',
    description: 'Для небольших команд, которые начинают систематизировать продажи',
    features: ['До 3 пользователей', '1 AI-ассистент', 'WhatsApp + Telegram', 'Воронка и задачи', 'Базовые отчёты'],
    highlight: false,
  },
  {
    name: 'Бизнес',
    price: '129 000',
    description: 'Для растущих компаний с активным потоком заявок',
    features: [
      'До 15 пользователей',
      '3 AI-ассистента',
      'Все каналы + Voice AI',
      'Полная аналитика',
      'База знаний',
      'Приоритетная поддержка',
    ],
    highlight: true,
  },
  {
    name: 'Премиум',
    price: '299 000',
    description: 'Для холдингов и сетей с несколькими юрлицами',
    features: [
      'Безлимит пользователей',
      'Безлимит AI-ассистентов',
      'Мульти-компании и CEO-панель',
      'Выделенный менеджер',
      'SLA 99.9%',
      'Интеграции под заказ',
    ],
    highlight: false,
  },
]

const REVIEWS = [
  {
    name: 'Динара Сапарова',
    role: 'Директор, образовательный центр',
    text: 'AI-ассистент отвечает родителям в WhatsApp даже ночью. За три месяца конверсия из заявки в пробный урок выросла с 34% до 52%.',
  },
  {
    name: 'Ержан Касымов',
    role: 'Коммерческий директор, стройматериалы',
    text: 'Раньше менеджеры теряли заявки в пяти чатах. Теперь всё в одном окне, а по каждой сделке видно следующий шаг. Выручка выросла на 28%.',
  },
  {
    name: 'Асель Нурпеисова',
    role: 'Руководитель отдела продаж',
    text: 'Voice AI принимает звонки, пока команда на встречах. Ни один клиент больше не уходит «в никуда» — все звонки с транскриптами в CRM.',
  },
]

const STATS = [
  { value: '+40%', label: 'к конверсии лидов' },
  { value: '24/7', label: 'AI отвечает клиентам' },
  { value: '5 мин', label: 'среднее время ответа' },
  { value: '1 день', label: 'на запуск системы' },
]

export function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 pt-16 pb-12 text-center md:px-6 md:pt-24">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="size-3.5" />
            AI-платформа продаж для малого и среднего бизнеса
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-balance md:text-6xl">
            CRM, в которой продают и люди, и искусственный интеллект
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
            AAA CRM объединяет мессенджеры, звонки, сделки и AI-ассистентов в одной системе. Ваши клиенты получают
            ответ за минуты, а вы — прозрачную воронку и рост выручки.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              render={
                <Link href="/register">
                  Попробовать бесплатно
                  <ArrowRight data-icon="inline-end" />
                </Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/login">Посмотреть демо</Link>}
            />
          </div>
          <p className="text-xs text-muted-foreground">Демо-доступ без карты и обязательств</p>

          {/* Product screenshot */}
          <div className="relative mt-4 w-full">
            <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
              <Image
                src="/screens/dashboard.png"
                alt="Интерфейс AAA CRM: дашборд с воронкой продаж, KPI и лентой активности AI-ассистентов"
                width={1440}
                height={900}
                priority
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y bg-card">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-3xl font-semibold text-gold">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
          <div className="mb-12 flex flex-col items-center gap-3 text-center">
            <Badge variant="secondary">Возможности</Badge>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Всё, что нужно отделу продаж — в одной системе
            </h2>
            <p className="max-w-xl leading-relaxed text-muted-foreground">
              Без зоопарка сервисов и потерянных заявок. От первого сообщения клиента до закрытой сделки.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-gold-muted text-gold">
                    <feature.icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{feature.text}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y bg-card">
          <div className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
            <div className="mb-12 flex flex-col items-center gap-3 text-center">
              <Badge variant="secondary">Как это работает</Badge>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Запуск за один день, результат — в первый месяц
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.n} className="flex flex-col gap-3">
                  <span className="text-4xl font-semibold text-gold">{step.n}</span>
                  <h3 className="text-lg font-medium">{step.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
          <div className="mb-12 flex flex-col items-center gap-3 text-center">
            <Badge variant="secondary">Тарифы</Badge>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Прозрачные цены без скрытых платежей
            </h2>
            <p className="max-w-xl leading-relaxed text-muted-foreground">
              Оплата в тенге, договор с ТОО, закрывающие документы. Первые 14 дней — бесплатно.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <Card key={plan.name} className={plan.highlight ? 'relative border-gold shadow-lg' : undefined}>
                {plan.highlight && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gold text-gold-foreground">
                    Популярный
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">₸/мес</span>
                  </div>
                  <CardDescription className="leading-relaxed">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-6">
                  <ul className="flex flex-col gap-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.highlight ? 'default' : 'outline'}
                    nativeButton={false}
                    render={<Link href="/register">Начать бесплатно</Link>}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="border-y bg-card">
          <div className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
            <div className="mb-12 flex flex-col items-center gap-3 text-center">
              <Badge variant="secondary">Отзывы</Badge>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Компании уже растут вместе с AAA CRM
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {REVIEWS.map((review) => (
                <Card key={review.name}>
                  <CardContent className="flex flex-col gap-4 pt-6">
                    <div className="flex gap-0.5" aria-label="Оценка 5 из 5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="leading-relaxed text-pretty">{review.text}</p>
                    <div>
                      <p className="text-sm font-medium">{review.name}</p>
                      <p className="text-sm text-muted-foreground">{review.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-12 md:flex-row md:justify-center md:gap-12 md:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            Данные хранятся изолированно по компаниям
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="size-4 text-gold" />
            Запуск без программистов
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="size-4 text-success" />
            Договор и закрывающие документы
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t bg-primary text-primary-foreground">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center md:px-6 md:py-20">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Начните продавать с AI уже сегодня
            </h2>
            <p className="max-w-xl leading-relaxed text-primary-foreground/80">
              Зарегистрируйте компанию за две минуты или войдите в готовое демо-пространство с данными.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                nativeButton={false}
                render={
                  <Link href="/register">
                    Создать аккаунт
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                }
              />
              <Button
                size="lg"
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                nativeButton={false}
                render={<Link href="/login">Войти в демо</Link>}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center md:flex-row md:px-6 md:text-left">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-3.5" />
            </div>
            <span className="text-sm font-medium">AAA CRM</span>
          </div>
          <p className="text-sm text-muted-foreground">AAA AI · Алматы, Казахстан · hello@aaa.ai</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/login" className="transition-colors hover:text-foreground">
              Вход
            </Link>
            <Link href="/register" className="transition-colors hover:text-foreground">
              Регистрация
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
