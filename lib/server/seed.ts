import type {
  ActivityEvent,
  AiAssistant,
  Call,
  ClientCompany,
  Contact,
  Conversation,
  Deal,
  Integration,
  KnowledgeDoc,
  Task,
  Tenant,
  User,
} from '@/lib/types'

export const DEMO_PASSWORD = 'aaa-demo-2026'

const now = Date.now()
const days = (n: number, hours = 10) =>
  new Date(now + n * 86400000 + (hours - new Date(now).getHours()) * 3600000).toISOString()

export interface Database {
  tenants: Tenant[]
  users: User[]
  deals: Deal[]
  contacts: Contact[]
  clientCompanies: ClientCompany[]
  tasks: Task[]
  conversations: Conversation[]
  calls: Call[]
  knowledgeDocs: KnowledgeDoc[]
  integrations: Integration[]
  events: ActivityEvent[]
  assistants: AiAssistant[]
}

export function createSeed(): Database {
  const tenants: Tenant[] = [
    {
      id: 't1',
      name: 'Академия Успех',
      bin: '190240012345',
      niche: 'Образование',
      city: 'Алматы',
      plan: 'Премиум',
      status: 'active',
      aiSpendKzt: 184000,
      aiLimitKzt: 300000,
      createdAt: days(-320),
    },
    {
      id: 't2',
      name: 'СтройКомплект',
      bin: '210340098765',
      niche: 'Стройматериалы',
      city: 'Астана',
      plan: 'Бизнес',
      status: 'active',
      aiSpendKzt: 92000,
      aiLimitKzt: 150000,
      createdAt: days(-190),
    },
  ]

  const users: User[] = [
    { id: 'u1', companyId: 't1', name: 'Александр Ким', email: 'owner@aaa.ai', role: 'owner', title: 'CEO, AAA AI', avatarInitials: 'АК', active: true },
    { id: 'u2', companyId: 't1', name: 'Динара Сапарова', email: 'admin@school.kz', role: 'admin', title: 'Директор', avatarInitials: 'ДС', active: true },
    { id: 'u3', companyId: 't1', name: 'Марат Оспанов', email: 'manager@school.kz', role: 'manager', title: 'Менеджер продаж', avatarInitials: 'МО', active: true },
    { id: 'u4', companyId: 't1', name: 'Елена Цой', email: 'viewer@school.kz', role: 'viewer', title: 'Аналитик', avatarInitials: 'ЕЦ', active: true },
    { id: 'u5', companyId: 't2', name: 'Айгерим Нурланова', email: 'manager@stroy.kz', role: 'manager', title: 'Менеджер продаж', avatarInitials: 'АН', active: true },
  ]

  const cc = (
    id: string, companyId: string, name: string, niche: string, size: string, city: string, ownerId: string, binSuffix: string,
  ): ClientCompany => ({
    id, companyId, name, bin: `1902400${binSuffix}`, niche, size,
    website: `https://${id}.kz`, address: city, ownerId, createdAt: days(-Math.floor(Math.random() * 0) - 60),
  })

  const clientCompanies: ClientCompany[] = [
    cc('kc1', 't1', 'ТОО «Казахтелеком Партнер»', 'Телеком', '50-200', 'г. Алматы, ул. Абая 42', 'u3', '11111'),
    cc('kc2', 't1', 'ИП Жанибеков', 'Розничная торговля', '1-10', 'г. Алматы, мкр. Самал-2', 'u3', '22222'),
    cc('kc3', 't1', 'ТОО «Дастархан Групп»', 'Ресторанный бизнес', '10-50', 'г. Алматы, пр. Достык 91', 'u3', '33333'),
    cc('kc4', 't1', 'Фитнес-клуб «Титан»', 'Спорт и фитнес', '10-50', 'г. Алматы, ул. Розыбакиева 247', 'u2', '44444'),
    cc('kc5', 't1', 'ТОО «МедЦентр Асыл»', 'Медицина', '50-200', 'г. Алматы, ул. Тимирязева 38', 'u3', '55555'),
    cc('kc6', 't1', 'Языковой центр «Полиглот»', 'Образование', '10-50', 'г. Алматы, ул. Жандосова 55', 'u3', '66666'),
    cc('kc7', 't1', 'ТОО «АвтоПрокат KZ»', 'Аренда авто', '10-50', 'г. Алматы, пр. Райымбека 160', 'u2', '77777'),
    cc('kc8', 't1', 'Салон красоты «Айгерим»', 'Красота', '1-10', 'г. Алматы, ул. Байтурсынова 78', 'u3', '88888'),
    cc('kc9', 't1', 'ТОО «Логистик Азия»', 'Логистика', '200+', 'г. Алматы, ул. Кульджинский тракт 1', 'u3', '99999'),
    cc('kc10', 't1', 'Стоматология «Дента Люкс»', 'Медицина', '10-50', 'г. Алматы, ул. Сатпаева 90', 'u2', '10101'),
    cc('kc11', 't1', 'ТОО «Агрофирма Жетысу»', 'Сельское хозяйство', '200+', 'Алматинская обл., г. Талдыкорган', 'u3', '12121'),
    cc('kc12', 't1', 'Детский сад «Балдаурен»', 'Образование', '10-50', 'г. Алматы, мкр. Аксай-4', 'u3', '13131'),
    cc('kc13', 't1', 'ТОО «Финансовые решения»', 'Финансы', '10-50', 'г. Алматы, пр. Аль-Фараби 17', 'u2', '14141'),
    cc('kc14', 't1', 'Турагентство «Шелковый путь»', 'Туризм', '1-10', 'г. Алматы, ул. Фурманова 128', 'u3', '15151'),
    cc('kc15', 't2', 'ТОО «БетонСтрой Астана»', 'Строительство', '200+', 'г. Астана, пр. Кабанбай батыра 53', 'u5', '16161'),
    cc('kc16', 't2', 'ИП Смагулов', 'Ремонт и отделка', '1-10', 'г. Астана, ул. Сыганак 10', 'u5', '17171'),
    cc('kc17', 't2', 'ТОО «ЖилСтройИнвест»', 'Девелопмент', '200+', 'г. Астана, пр. Мангилик Ел 55', 'u5', '18181'),
    cc('kc18', 't2', 'ТОО «Евроремонт Плюс»', 'Ремонт и отделка', '10-50', 'г. Астана, ул. Кенесары 40', 'u5', '19191'),
    cc('kc19', 't2', 'ТОО «Дорстрой КЗ»', 'Дорожное строительство', '200+', 'г. Астана, пр. Туран 37', 'u5', '20202'),
    cc('kc20', 't2', 'ИП Ахметова', 'Дизайн интерьеров', '1-10', 'г. Астана, ул. Достык 5', 'u5', '21212'),
  ]

  const ct = (
    id: string, companyId: string, name: string, phone: string, clientCompanyId: string | null,
    position: string, source: Contact['source'], ownerId: string, extra?: Partial<Contact>,
  ): Contact => ({
    id, companyId, name, phone,
    email: `${id}@mail.kz`,
    whatsapp: phone, telegram: null, instagram: null,
    clientCompanyId, position, source, ownerId,
    tags: [], consent: true, createdAt: days(-40),
    ...extra,
  })

  const contacts: Contact[] = [
    ct('c1', 't1', 'Айдос Жанибеков', '+7 701 234 56 01', 'kc2', 'Владелец', 'Instagram', 'u3', { instagram: '@aidos.zh', tags: ['VIP'] }),
    ct('c2', 't1', 'Гульнара Ахметова', '+7 701 234 56 02', 'kc1', 'Директор по развитию', 'Сайт', 'u3', { tags: ['корпоратив'] }),
    ct('c3', 't1', 'Тимур Досжанов', '+7 701 234 56 03', 'kc3', 'Управляющий', 'WhatsApp', 'u3'),
    ct('c4', 't1', 'Салтанат Ерланова', '+7 701 234 56 04', 'kc4', 'Директор', 'Рекомендация', 'u2'),
    ct('c5', 't1', 'Ержан Касымов', '+7 701 234 56 05', 'kc5', 'Главный врач', 'Звонок', 'u3'),
    ct('c6', 't1', 'Мадина Турсынова', '+7 701 234 56 06', 'kc6', 'Директор', 'Telegram', 'u3', { telegram: '@madina_t' }),
    ct('c7', 't1', 'Бекзат Алимов', '+7 701 234 56 07', 'kc7', 'Коммерческий директор', 'Сайт', 'u2'),
    ct('c8', 't1', 'Айгерим Сеитова', '+7 701 234 56 08', 'kc8', 'Владелица', 'Instagram', 'u3', { instagram: '@aigerim_beauty' }),
    ct('c9', 't1', 'Нурлан Байжанов', '+7 701 234 56 09', 'kc9', 'Директор филиала', 'Звонок', 'u3'),
    ct('c10', 't1', 'Жанна Ким', '+7 701 234 56 10', 'kc10', 'Администратор', 'WhatsApp', 'u2'),
    ct('c11', 't1', 'Асель Нурпеисова', '+7 701 234 56 11', 'kc11', 'Зам. директора', 'Сайт', 'u3'),
    ct('c12', 't1', 'Данияр Сулейменов', '+7 701 234 56 12', 'kc12', 'Заведующий', 'Рекомендация', 'u3'),
    ct('c13', 't1', 'Карина Ли', '+7 701 234 56 13', 'kc13', 'Партнер', '2ГИС', 'u2'),
    ct('c14', 't1', 'Руслан Абдрахманов', '+7 701 234 56 14', 'kc14', 'Директор', 'Telegram', 'u3', { telegram: '@ruslan_silk' }),
    ct('c15', 't1', 'Дана Мусабекова', '+7 701 234 56 15', null, 'Частное лицо', 'Instagram', 'u3', { instagram: '@dana_m' }),
    ct('c16', 't1', 'Олжас Токтаров', '+7 701 234 56 16', null, 'Частное лицо', 'Сайт', 'u3'),
    ct('c17', 't1', 'Инкар Бекова', '+7 701 234 56 17', null, 'Частное лицо', 'WhatsApp', 'u2'),
    ct('c18', 't1', 'Виктор Пак', '+7 701 234 56 18', 'kc1', 'IT-директор', 'Сайт', 'u3'),
    ct('c19', 't1', 'Аружан Смагулова', '+7 701 234 56 19', 'kc5', 'Маркетолог', 'Instagram', 'u3', { instagram: '@aruzhan_s', consent: false }),
    ct('c20', 't1', 'Галым Ертаев', '+7 701 234 56 20', 'kc9', 'Логист', 'Звонок', 'u3'),
    ct('c21', 't1', 'Меруерт Кайратова', '+7 701 234 56 21', 'kc6', 'Методист', 'Telegram', 'u2', { telegram: '@meruert_k' }),
    ct('c22', 't1', 'Санжар Утегенов', '+7 701 234 56 22', null, 'Частное лицо', '2ГИС', 'u3'),
    ct('c23', 't2', 'Марат Смагулов', '+7 702 345 67 01', 'kc16', 'Владелец', 'Звонок', 'u5'),
    ct('c24', 't2', 'Алия Бекенова', '+7 702 345 67 02', 'kc15', 'Начальник снабжения', 'Сайт', 'u5', { tags: ['опт'] }),
    ct('c25', 't2', 'Серик Жумабаев', '+7 702 345 67 03', 'kc17', 'Директор по закупу', 'Рекомендация', 'u5'),
    ct('c26', 't2', 'Динара Ахметова', '+7 702 345 67 04', 'kc20', 'Владелица', 'Instagram', 'u5', { instagram: '@dinara.design' }),
    ct('c27', 't2', 'Куаныш Ержанов', '+7 702 345 67 05', 'kc18', 'Прораб', 'WhatsApp', 'u5'),
    ct('c28', 't2', 'Багдат Оспанов', '+7 702 345 67 06', 'kc19', 'Главный инженер', 'Звонок', 'u5'),
    ct('c29', 't2', 'Жулдыз Кенжебаева', '+7 702 345 67 07', null, 'Частное лицо', 'Сайт', 'u5'),
    ct('c30', 't2', 'Абылай Тлеубаев', '+7 702 345 67 08', 'kc15', 'Менеджер проекта', 'Telegram', 'u5', { telegram: '@abylai_t' }),
  ]

  const dl = (
    id: string, companyId: string, title: string, contactId: string, amountKzt: number,
    stage: Deal['stage'], ownerId: string, source: Deal['source'], probability: number,
    nextIn: number | null, nextText: string | null, extra?: Partial<Deal>,
  ): Deal => {
    const contact = contacts.find((c) => c.id === contactId)
    return {
      id, companyId, title,
      clientCompanyId: contact?.clientCompanyId ?? null,
      contactId, amountKzt, stage, ownerId, source, probability,
      nextActionAt: nextIn === null ? null : days(nextIn),
      nextActionText: nextText,
      closeDate: stage === 'won' || stage === 'lost' ? days(-3) : days(14),
      tags: [], aiCreated: false, lostReason: null, notes: [],
      createdAt: days(-20), updatedAt: days(-1),
      ...extra,
    }
  }

  const deals: Deal[] = [
    dl('d1', 't1', 'Корпоративное обучение — Казахтелеком', 'c2', 4800000, 'negotiation', 'u3', 'Сайт', 70, 1, 'Согласовать программу курса', { tags: ['корпоратив'], createdAt: days(-18) }),
    dl('d2', 't1', 'Курс английского для сотрудников', 'c3', 1350000, 'proposal', 'u3', 'WhatsApp', 50, 0, 'Отправить коммерческое предложение', { createdAt: days(-9) }),
    dl('d3', 't1', 'IT-курсы для команды «Титан»', 'c4', 960000, 'qualification', 'u2', 'Рекомендация', 30, 2, 'Уточнить количество участников', { createdAt: days(-5) }),
    dl('d4', 't1', 'Обучение медперсонала — Асыл', 'c5', 2200000, 'approval', 'u3', 'Звонок', 85, 1, 'Дождаться подписания договора', { createdAt: days(-26) }),
    dl('d5', 't1', 'Летний интенсив — Полиглот', 'c6', 780000, 'won', 'u3', 'Telegram', 100, null, null, { createdAt: days(-40) }),
    dl('d6', 't1', 'Тренинг продаж — АвтоПрокат', 'c7', 640000, 'lost', 'u2', 'Сайт', 0, null, null, { lostReason: 'Выбрали конкурента по цене', createdAt: days(-35) }),
    dl('d7', 't1', 'Индивидуальный курс — Дана', 'c15', 240000, 'new', 'u3', 'Instagram', 15, 0, 'Первый звонок клиенту', { aiCreated: true, createdAt: days(-1) }),
    dl('d8', 't1', 'Подготовка к IELTS — Олжас', 'c16', 320000, 'qualification', 'u3', 'Сайт', 35, -1, 'Перезвонить после пробного урока', { aiCreated: true, createdAt: days(-4) }),
    dl('d9', 't1', 'Корпоративный казахский — Логистик Азия', 'c9', 1750000, 'proposal', 'u3', 'Звонок', 55, 3, 'Презентация для HR-отдела', { createdAt: days(-12) }),
    dl('d10', 't1', 'Курс для администраторов — Дента Люкс', 'c10', 420000, 'new', 'u2', 'WhatsApp', 20, 1, 'Квалифицировать запрос', { aiCreated: true, createdAt: days(0) }),
    dl('d11', 't1', 'Обучение агрономов — Жетысу', 'c11', 2900000, 'negotiation', 'u3', 'Сайт', 65, -2, 'Обсудить скидку за объем', { tags: ['опт'], createdAt: days(-22) }),
    dl('d12', 't1', 'Методика для воспитателей — Балдаурен', 'c12', 510000, 'qualification', 'u3', 'Рекомендация', 40, 4, 'Выслать программу курса', { createdAt: days(-7) }),
    dl('d13', 't1', 'Финансовая грамотность — тренинг', 'c13', 880000, 'proposal', 'u2', '2ГИС', 45, 2, 'Согласовать даты тренинга', { createdAt: days(-10) }),
    dl('d14', 't1', 'Курс гидов-переводчиков', 'c14', 690000, 'new', 'u3', 'Telegram', 25, 0, 'Связаться в Telegram', { aiCreated: true, createdAt: days(0) }),
    dl('d15', 't1', 'Speaking Club — годовой абонемент', 'c17', 180000, 'won', 'u2', 'WhatsApp', 100, null, null, { createdAt: days(-30) }),
    dl('d16', 't1', 'Обучение IT-отдела — Казахтелеком', 'c18', 3400000, 'qualification', 'u3', 'Сайт', 35, 1, 'Собрать требования по стеку', { tags: ['корпоратив'], createdAt: days(-6) }),
    dl('d17', 't1', 'SMM-курс — Аружан', 'c19', 260000, 'lost', 'u3', 'Instagram', 0, null, null, { lostReason: 'Клиент отложил обучение', createdAt: days(-28) }),
    dl('d18', 't1', 'Деловой английский — Санжар', 'c22', 350000, 'new', 'u3', '2ГИС', 20, 0, 'Позвонить и уточнить уровень', { createdAt: days(0) }),
    dl('d19', 't2', 'Поставка цемента — БетонСтрой', 'c24', 12500000, 'negotiation', 'u5', 'Сайт', 75, 1, 'Финальное согласование цены', { tags: ['опт'], createdAt: days(-15) }),
    dl('d20', 't2', 'Отделочные материалы — ИП Смагулов', 'c23', 1850000, 'proposal', 'u5', 'Звонок', 50, 0, 'Отправить смету', { createdAt: days(-8) }),
    dl('d21', 't2', 'Кирпич М150 — ЖилСтройИнвест', 'c25', 8700000, 'approval', 'u5', 'Рекомендация', 85, 2, 'Подписание спецификации', { createdAt: days(-20) }),
    dl('d22', 't2', 'Материалы для дизайн-проекта', 'c26', 950000, 'qualification', 'u5', 'Instagram', 30, -1, 'Уточнить спецификацию', { aiCreated: true, createdAt: days(-3) }),
    dl('d23', 't2', 'Сухие смеси — Евроремонт Плюс', 'c27', 2300000, 'won', 'u5', 'WhatsApp', 100, null, null, { createdAt: days(-25) }),
    dl('d24', 't2', 'Щебень и песок — Дорстрой', 'c28', 15800000, 'new', 'u5', 'Звонок', 20, 0, 'Подготовить расчет объемов', { createdAt: days(-1) }),
    dl('d25', 't2', 'Ламинат и плитка — частный заказ', 'c29', 680000, 'new', 'u5', 'Сайт', 15, 1, 'Первый контакт', { aiCreated: true, createdAt: days(0) }),
  ]

  const tk = (
    id: string, companyId: string, title: string, type: Task['type'], dueIn: number,
    assigneeId: string, dealId: string | null, contactId: string | null, done = false,
  ): Task => ({
    id, companyId, title, type, dueAt: days(dueIn, dueIn === 0 ? 15 : 11), done,
    assigneeId, dealId, contactId, createdAt: days(-5),
  })

  const tasks: Task[] = [
    tk('tk1', 't1', 'Позвонить Гульнаре по программе курса', 'call', 0, 'u3', 'd1', 'c2'),
    tk('tk2', 't1', 'Отправить КП Тимуру Досжанову', 'proposal', 0, 'u3', 'd2', 'c3'),
    tk('tk3', 't1', 'Встреча с директором «Титан»', 'meeting', 2, 'u2', 'd3', 'c4'),
    tk('tk4', 't1', 'Проверить статус подписания — МедЦентр', 'followup', 1, 'u3', 'd4', 'c5'),
    tk('tk5', 't1', 'Первый звонок Дане Мусабековой', 'call', 0, 'u3', 'd7', 'c15'),
    tk('tk6', 't1', 'Перезвонить Олжасу после пробного урока', 'call', -1, 'u3', 'd8', 'c16'),
    tk('tk7', 't1', 'Подготовить презентацию для Логистик Азия', 'proposal', 3, 'u3', 'd9', 'c9'),
    tk('tk8', 't1', 'Написать Жанне в WhatsApp', 'message', 1, 'u2', 'd10', 'c10'),
    tk('tk9', 't1', 'Согласовать скидку с Жетысу', 'call', -2, 'u3', 'd11', 'c11'),
    tk('tk10', 't1', 'Выслать программу Данияру', 'message', 4, 'u3', 'd12', 'c12'),
    tk('tk11', 't1', 'Согласовать даты тренинга с Кариной', 'call', 2, 'u2', 'd13', 'c13'),
    tk('tk12', 't1', 'Ответить Руслану в Telegram', 'message', 0, 'u3', 'd14', 'c14'),
    tk('tk13', 't1', 'Собрать требования Казахтелеком IT', 'meeting', 1, 'u3', 'd16', 'c18'),
    tk('tk14', 't1', 'Позвонить Санжару, уточнить уровень', 'call', 0, 'u3', 'd18', 'c22'),
    tk('tk15', 't1', 'Обновить прайс на корпоративные курсы', 'proposal', 5, 'u2', null, null),
    tk('tk16', 't1', 'Follow-up: Салон «Айгерим»', 'followup', -3, 'u3', null, 'c8'),
    tk('tk17', 't1', 'Подготовить отчет по итогам месяца', 'proposal', 6, 'u2', null, null),
    tk('tk18', 't1', 'Встреча с методистом «Полиглот»', 'meeting', -1, 'u2', 'd5', 'c6', true),
    tk('tk19', 't1', 'Позвонить Виктору Паку', 'call', -2, 'u3', 'd16', 'c18', true),
    tk('tk20', 't1', 'Отправить договор МедЦентру', 'message', -4, 'u3', 'd4', 'c5', true),
    tk('tk21', 't1', 'Квалификация лида с сайта', 'call', -5, 'u3', 'd8', 'c16', true),
    tk('tk22', 't1', 'Пригласить на день открытых дверей', 'message', -6, 'u2', null, 'c17', true),
    tk('tk23', 't2', 'Финальный звонок по цене цемента', 'call', 0, 'u5', 'd19', 'c24'),
    tk('tk24', 't2', 'Отправить смету Марату', 'proposal', 0, 'u5', 'd20', 'c23'),
    tk('tk25', 't2', 'Подготовить спецификацию для ЖСИ', 'proposal', 2, 'u5', 'd21', 'c25'),
    tk('tk26', 't2', 'Уточнить спецификацию у Динары', 'message', -1, 'u5', 'd22', 'c26'),
    tk('tk27', 't2', 'Расчет объемов для Дорстрой', 'proposal', 1, 'u5', 'd24', 'c28'),
    tk('tk28', 't2', 'Первый контакт — частный заказ', 'call', 1, 'u5', 'd25', 'c29'),
    tk('tk29', 't2', 'Встреча на объекте Евроремонт', 'meeting', -3, 'u5', 'd23', 'c27', true),
    tk('tk30', 't2', 'Follow-up по опту с Абылаем', 'followup', 3, 'u5', null, 'c30'),
  ]

  const msg = (id: string, from: Conversation['messages'][0]['from'], text: string, minAgo: number, authorId: string | null = null): Conversation['messages'][0] => ({
    id, from, authorId, text,
    at: new Date(now - minAgo * 60000).toISOString(),
    status: 'read',
  })

  const conversations: Conversation[] = [
    {
      id: 'cv1', companyId: 't1', contactId: 'c15', channel: 'instagram', handledBy: 'ai', assigneeId: null, unread: 2,
      aiSummary: 'Клиентка интересуется индивидуальным курсом английского. Уровень — Pre-Intermediate. Бюджет до 250 000 ₸. Создан лид.',
      messages: [
        msg('m1', 'client', 'Здравствуйте! Сколько стоит индивидуальный курс английского?', 95),
        msg('m2', 'ai', 'Здравствуйте, Дана! Индивидуальный курс — от 240 000 ₸ за 3 месяца (24 занятия). Какой у вас текущий уровень?', 94),
        msg('m3', 'client', 'Наверное Pre-Intermediate, проходила тест год назад', 60),
        msg('m4', 'ai', 'Отлично! Предлагаю бесплатный пробный урок с определением уровня. Удобно завтра в 18:00 или в субботу в 11:00?', 59),
        msg('m5', 'client', 'Суббота подойдет!', 12),
      ],
      updatedAt: new Date(now - 12 * 60000).toISOString(),
    },
    {
      id: 'cv2', companyId: 't1', contactId: 'c2', channel: 'email', handledBy: 'human', assigneeId: 'u3', unread: 0,
      aiSummary: 'Корпоративный клиент. Обсуждается программа обучения для 40 сотрудников. Ожидается согласование программы.',
      messages: [
        msg('m6', 'client', 'Марат, добрый день. Направляю список пожеланий отдела по программе.', 2880),
        msg('m7', 'manager', 'Гульнара, добрый день! Спасибо, изучу и вернусь с обновленной программой до пятницы.', 2760, 'u3'),
        msg('m8', 'client', 'Хорошо, ждем. Важно успеть до начала квартала.', 2700),
      ],
      updatedAt: new Date(now - 2700 * 60000).toISOString(),
    },
    {
      id: 'cv3', companyId: 't1', contactId: 'c16', channel: 'website', handledBy: 'ai', assigneeId: null, unread: 1,
      aiSummary: 'Запрос на подготовку к IELTS, цель — 7.0. Пробный урок пройден, ожидает звонка менеджера.',
      messages: [
        msg('m9', 'client', 'Нужна подготовка к IELTS, цель 7.0. Сколько времени займет?', 4320),
        msg('m10', 'ai', 'Здравствуйте, Олжас! При уровне Intermediate подготовка к 7.0 занимает 4-6 месяцев. Запишу вас на пробный урок?', 4319),
        msg('m11', 'client', 'Да, давайте', 4300),
        msg('m12', 'client', 'Прошел пробный, когда со мной свяжутся по расписанию?', 30),
      ],
      updatedAt: new Date(now - 30 * 60000).toISOString(),
    },
    {
      id: 'cv4', companyId: 't1', contactId: 'c3', channel: 'whatsapp', handledBy: 'human', assigneeId: 'u3', unread: 0,
      aiSummary: 'Обсуждение курса английского для персонала ресторанов. Ждет КП сегодня.',
      messages: [
        msg('m13', 'client', 'Марат, здравствуйте! Когда будет готово предложение?', 180),
        msg('m14', 'manager', 'Тимур, добрый день! Отправлю сегодня до 18:00, финализирую расчет по группам.', 175, 'u3'),
      ],
      updatedAt: new Date(now - 175 * 60000).toISOString(),
    },
    {
      id: 'cv5', companyId: 't1', contactId: 'c14', channel: 'telegram', handledBy: 'ai', assigneeId: null, unread: 3,
      aiSummary: 'Турагентство ищет курс для гидов-переводчиков, группа 8 человек. Создан лид, требуется менеджер.',
      messages: [
        msg('m15', 'client', 'Добрый день! Есть ли у вас курсы для гидов-переводчиков?', 55),
        msg('m16', 'ai', 'Здравствуйте, Руслан! Да, есть специализированный курс «Гид-переводчик» — 8 недель, английский + история Казахстана. Для группы 8 человек будет скидка 10%.', 54),
        msg('m17', 'client', 'Интересно! А можно программу?', 40),
        msg('m18', 'client', 'И еще вопрос по расписанию — есть вечерние группы?', 38),
        msg('m19', 'client', 'Алло?', 15),
      ],
      updatedAt: new Date(now - 15 * 60000).toISOString(),
    },
    {
      id: 'cv6', companyId: 't1', contactId: 'c10', channel: 'whatsapp', handledBy: 'ai', assigneeId: null, unread: 0,
      aiSummary: 'Стоматология запрашивает курс сервиса для администраторов. Лид создан и передан менеджеру.',
      messages: [
        msg('m20', 'client', 'Здравствуйте, нужен тренинг по сервису для 5 администраторов', 1440),
        msg('m21', 'ai', 'Здравствуйте, Жанна! У нас есть курс «Сервис в медицине» — 2 недели, 8 занятий. Стоимость для группы 5 человек — 420 000 ₸. Передаю ваш запрос менеджеру Динаре.', 1439),
        msg('m22', 'client', 'Спасибо, жду звонка', 1430),
      ],
      updatedAt: new Date(now - 1430 * 60000).toISOString(),
    },
    {
      id: 'cv7', companyId: 't1', contactId: 'c22', channel: 'website', handledBy: 'ai', assigneeId: null, unread: 1,
      aiSummary: 'Запрос на деловой английский с сайта (2ГИС-переход). Уровень не определен.',
      messages: [
        msg('m23', 'client', 'Интересует деловой английский, занимался давно', 200),
        msg('m24', 'ai', 'Здравствуйте, Санжар! Курс делового английского — 350 000 ₸ за 3 месяца. Чтобы подобрать группу, предлагаю пройти бесплатный тест уровня. Отправить ссылку?', 199),
        msg('m25', 'client', 'Отправляйте', 190),
      ],
      updatedAt: new Date(now - 190 * 60000).toISOString(),
    },
    {
      id: 'cv8', companyId: 't1', contactId: 'c6', channel: 'telegram', handledBy: 'human', assigneeId: 'u2', unread: 0,
      aiSummary: 'Партнерский диалог с языковым центром. Летний интенсив успешно запущен.',
      messages: [
        msg('m26', 'client', 'Динара, интенсив стартовал отлично, 22 студента!', 5760),
        msg('m27', 'manager', 'Мадина, супер! В сентябре обсудим осенний поток.', 5700, 'u2'),
      ],
      updatedAt: new Date(now - 5700 * 60000).toISOString(),
    },
    {
      id: 'cv9', companyId: 't1', contactId: 'c17', channel: 'whatsapp', handledBy: 'ai', assigneeId: null, unread: 0,
      aiSummary: 'Клиентка купила годовой абонемент Speaking Club. Вопросы по расписанию.',
      messages: [
        msg('m28', 'client', 'А в четверг клуб в 19:00 будет?', 300),
        msg('m29', 'ai', 'Здравствуйте, Инкар! Да, Speaking Club по четвергам в 19:00, тема этой недели — «Travel stories». Ждем вас!', 299),
      ],
      updatedAt: new Date(now - 299 * 60000).toISOString(),
    },
    {
      id: 'cv10', companyId: 't1', contactId: 'c8', channel: 'instagram', handledBy: 'ai', assigneeId: null, unread: 0,
      aiSummary: 'Владелица салона интересовалась курсом для мастеров. Диалог приостановлен клиентом.',
      messages: [
        msg('m30', 'client', 'Есть курсы английского для бьюти-мастеров?', 10080),
        msg('m31', 'ai', 'Здравствуйте, Айгерим! Да, есть разговорный курс с бьюти-лексикой. Группа стартует через 2 недели.', 10079),
        msg('m32', 'client', 'Подумаю, спасибо', 10000),
      ],
      updatedAt: new Date(now - 10000 * 60000).toISOString(),
    },
    {
      id: 'cv11', companyId: 't2', contactId: 'c24', channel: 'email', handledBy: 'human', assigneeId: 'u5', unread: 0,
      aiSummary: 'Крупный оптовый клиент. Переговоры по цене на цемент М400, объем 400 тонн.',
      messages: [
        msg('m33', 'client', 'Айгерим, здравствуйте. Готовы обсудить цену при объеме 400 тонн?', 1500),
        msg('m34', 'manager', 'Алия, добрый день! Да, при таком объеме дадим 8% скидку. Направлю расчет завтра.', 1450, 'u5'),
      ],
      updatedAt: new Date(now - 1450 * 60000).toISOString(),
    },
    {
      id: 'cv12', companyId: 't2', contactId: 'c26', channel: 'instagram', handledBy: 'ai', assigneeId: null, unread: 1,
      aiSummary: 'Дизайнер интерьеров запрашивает материалы для проекта. Требуется спецификация.',
      messages: [
        msg('m35', 'client', 'Добрый день! Нужны материалы для проекта квартиры 120 м²', 2000),
        msg('m36', 'ai', 'Здравствуйте, Динара! С удовольствием поможем. Пришлите, пожалуйста, спецификацию или дизайн-проект — подготовим смету за 1 день.', 1999),
        msg('m37', 'client', 'Отправлю на неделе', 45),
      ],
      updatedAt: new Date(now - 45 * 60000).toISOString(),
    },
    {
      id: 'cv13', companyId: 't2', contactId: 'c29', channel: 'website', handledBy: 'ai', assigneeId: null, unread: 2,
      aiSummary: 'Частный клиент, ремонт квартиры. Интересуют ламинат и плитка. Создан лид.',
      messages: [
        msg('m38', 'client', 'Сколько стоит ламинат 33 класс?', 120),
        msg('m39', 'ai', 'Здравствуйте! Ламинат 33 класса — от 4 500 ₸/м². Какая площадь вам нужна?', 119),
        msg('m40', 'client', 'Около 80 м², и еще плитка в ванную 12 м²', 20),
        msg('m41', 'client', 'Доставка по Астане есть?', 18),
      ],
      updatedAt: new Date(now - 18 * 60000).toISOString(),
    },
    {
      id: 'cv14', companyId: 't2', contactId: 'c23', channel: 'whatsapp', handledBy: 'human', assigneeId: 'u5', unread: 0,
      aiSummary: 'Постоянный клиент ждет смету на отделочные материалы.',
      messages: [
        msg('m42', 'client', 'Айгерим, смета готова?', 240),
        msg('m43', 'manager', 'Марат, добрый день! Заканчиваю, отправлю до конца дня.', 230, 'u5'),
      ],
      updatedAt: new Date(now - 230 * 60000).toISOString(),
    },
    {
      id: 'cv15', companyId: 't2', contactId: 'c30', channel: 'telegram', handledBy: 'ai', assigneeId: null, unread: 0,
      aiSummary: 'Менеджер проекта БетонСтрой уточняет сроки поставки арматуры.',
      messages: [
        msg('m44', 'client', 'Какие сроки поставки арматуры 12мм, 20 тонн?', 3000),
        msg('m45', 'ai', 'Здравствуйте, Абылай! Арматура 12мм в наличии, поставка 20 тонн по Астане — 2 рабочих дня.', 2999),
        msg('m46', 'client', 'Отлично, на следующей неделе оформим', 2950),
      ],
      updatedAt: new Date(now - 2950 * 60000).toISOString(),
    },
  ]

  const cl = (
    id: string, companyId: string, direction: Call['direction'], contactId: string | null, phone: string,
    durationSec: number, result: string, byAi: boolean, dealId: string | null, hoursAgo: number,
    transcript: string, aiSummary: string,
  ): Call => ({
    id, companyId, direction, contactId, phone, durationSec, result, byAi, dealId,
    at: new Date(now - hoursAgo * 3600000).toISOString(),
    transcript, aiSummary,
  })

  const calls: Call[] = [
    cl('cl1', 't1', 'incoming', 'c15', '+7 701 234 56 15', 245, 'Записана на пробный урок', true, 'd7', 2,
      'Клиент: Здравствуйте, я писала в Instagram про курс... AI: Да, Дана, ваша запись на субботу 11:00 подтверждена...',
      'Подтверждена запись на пробный урок в субботу 11:00. Клиентка задала вопросы про преподавателя.'),
    cl('cl2', 't1', 'outgoing', 'c2', '+7 701 234 56 02', 612, 'Согласована встреча', false, 'd1', 5,
      'Менеджер: Гульнара, добрый день, по программе корпоративного обучения... Клиент: Да, давайте обсудим модули...',
      'Обсуждены модули программы. Клиент просит добавить блок деловой переписки. Встреча в четверг.'),
    cl('cl3', 't1', 'incoming', 'c22', '+7 701 234 56 22', 180, 'Создан лид', true, 'd18', 8,
      'Клиент: Увидел вас в 2ГИС, интересует деловой английский... AI: Отлично, расскажу про форматы обучения...',
      'Новый лид: деловой английский, уровень требует уточнения. Передано менеджеру.'),
    cl('cl4', 't1', 'outgoing', 'c5', '+7 701 234 56 05', 420, 'Договор на подписании', false, 'd4', 26,
      'Менеджер: Ержан Касымович, договор направили... Клиент: Да, юристы смотрят, к пятнице подпишем...',
      'Договор у юристов клиента. Ожидаемое подписание — пятница. Напоминание поставлено.'),
    cl('cl5', 't1', 'incoming', null, '+7 705 111 22 33', 95, 'Не целевой звонок', true, null, 12,
      'Клиент: Это автомойка? AI: Нет, это Академия Успех, образовательный центр...',
      'Ошибочный звонок, не целевой.'),
    cl('cl6', 't1', 'incoming', 'c12', '+7 701 234 56 12', 310, 'Запрошена программа', true, 'd12', 30,
      'Клиент: Нам нужна методика для воспитателей... AI: Расскажу о курсе повышения квалификации...',
      'Детский сад запрашивает программу для 12 воспитателей. Лид обновлен, менеджеру поставлена задача.'),
    cl('cl7', 't1', 'outgoing', 'c16', '+7 701 234 56 16', 0, 'Не дозвонились', false, 'd8', 25,
      '', 'Клиент не ответил. Рекомендуется повторный звонок после 18:00.'),
    cl('cl8', 't1', 'incoming', 'c17', '+7 701 234 56 17', 150, 'Вопрос по расписанию', true, null, 50,
      'Клиент: Подскажите расписание Speaking Club... AI: По четвергам в 19:00...',
      'Вопрос по расписанию клуба. Решен AI без участия менеджера.'),
    cl('cl9', 't2', 'incoming', 'c28', '+7 702 345 67 06', 380, 'Создан лид', true, 'd24', 20,
      'Клиент: Нужен расчет на щебень и песок для дорожных работ... AI: Уточню объемы и фракции...',
      'Крупный запрос: щебень фр. 5-20, песок, ~2000 тонн. Создан лид, передан менеджеру.'),
    cl('cl10', 't2', 'outgoing', 'c24', '+7 702 345 67 02', 540, 'Переговоры по цене', false, 'd19', 28,
      'Менеджер: Алия, по вашему объему готовы дать 8%... Клиент: Хотелось бы 10% при предоплате...',
      'Клиент просит 10% при 100% предоплате. Требуется согласование с руководителем.'),
    cl('cl11', 't2', 'incoming', 'c29', '+7 702 345 67 07', 210, 'Консультация', true, 'd25', 6,
      'Клиент: По ламинату вопрос, вы говорили от 4500... AI: Да, есть варианты Kronospan и Tarkett...',
      'Консультация по маркам ламината. Клиент склоняется к Kronospan. Ожидает смету.'),
    cl('cl12', 't2', 'outgoing', 'c25', '+7 702 345 67 03', 460, 'Спецификация согласована', false, 'd21', 45,
      'Менеджер: Серик, спецификацию утвердили?... Клиент: Да, направляйте на подпись...',
      'Спецификация согласована. Документы на подписи. Сделка близка к закрытию.'),
  ]

  const kd = (
    id: string, companyId: string, title: string, category: KnowledgeDoc['category'],
    content: string, daysAgo: number, indexed = true,
  ): KnowledgeDoc => ({
    id, companyId, title, category, content, indexed,
    assistant: companyId === 't1' ? 'Ассистент Академии' : 'Ассистент СтройКомплект',
    updatedAt: days(-daysAgo),
  })

  const knowledgeDocs: KnowledgeDoc[] = [
    kd('kd1', 't1', 'Прайс-лист на курсы 2026', 'Цены', 'Индивидуальный курс английского — 240 000 ₸ / 3 мес. Групповой — 120 000 ₸ / 3 мес. Деловой английский — 350 000 ₸. IELTS — 320 000 ₸. Корпоративное обучение — от 80 000 ₸/чел.', 4),
    kd('kd2', 't1', 'Описание услуг', 'Услуги', 'Академия Успех: курсы английского, казахского, IT-курсы, корпоративное обучение, Speaking Club, подготовка к IELTS/TOEFL, курсы для гидов-переводчиков.', 12),
    kd('kd3', 't1', 'FAQ по обучению', 'FAQ', 'Q: Есть ли пробный урок? A: Да, бесплатный пробный урок с тестом уровня. Q: Какое расписание? A: Утренние, дневные и вечерние группы, включая выходные. Q: Возврат средств? A: Возврат за неиспользованные занятия по договору.', 7),
    kd('kd4', 't1', 'Правила общения AI-ассистента', 'Правила', 'Всегда обращаться по имени. Не обещать скидки выше 10% без менеджера. При запросе от компаний 10+ человек — передавать менеджеру. Тон: дружелюбный, профессиональный.', 20),
    kd('kd5', 't1', 'Запрещённые ответы', 'Запрещённые ответы', 'Не гарантировать результат экзамена. Не критиковать конкурентов. Не обсуждать внутренние процессы. Не давать медицинские и юридические советы.', 20),
    kd('kd6', 't1', 'Договор оферты', 'Документы', 'Публичная оферта на оказание образовательных услуг ТОО «Академия Успех». Редакция от января 2026 г.', 45, false),
    kd('kd7', 't2', 'Прайс на материалы', 'Цены', 'Цемент М400 — 2 400 ₸/мешок. Кирпич М150 — 85 ₸/шт. Ламинат 33 кл — от 4 500 ₸/м². Арматура 12мм — 285 000 ₸/т. Щебень фр. 5-20 — 6 500 ₸/т.', 2),
    kd('kd8', 't2', 'Условия доставки', 'Услуги', 'Доставка по Астане — от 15 000 ₸, бесплатно при заказе от 500 000 ₸. По области — расчет по км. Разгрузка манипулятором — 25 000 ₸/час.', 9),
    kd('kd9', 't2', 'FAQ по оптовым заказам', 'FAQ', 'Q: Скидки на опт? A: От 100 тонн — 5%, от 300 тонн — 8%, индивидуально — через менеджера. Q: Отсрочка платежа? A: Для постоянных клиентов до 30 дней.', 14),
    kd('kd10', 't2', 'Запрещённые ответы', 'Запрещённые ответы', 'Не подтверждать наличие без проверки склада. Не давать скидки выше 8% без менеджера. Не называть сроки поставки под заказ без уточнения.', 25),
  ]

  const integ = (companyId: string, idx: number, name: string, status: Integration['status'], description: string, lastH: number | null): Integration => ({
    id: `${companyId}-i${idx}`, companyId, name, status, description,
    lastEventAt: lastH === null ? null : new Date(now - lastH * 3600000).toISOString(),
  })

  const integrations: Integration[] = [
    integ('t1', 1, 'AAA AI Control Center', 'connected', 'Синхронизация AI-менеджеров и аналитики', 0.2),
    integ('t1', 2, 'Telegram', 'connected', 'Бот @akadem_uspeh_bot принимает заявки', 0.5),
    integ('t1', 3, 'Instagram', 'connected', 'Direct-сообщения @akademia.uspeh', 0.1),
    integ('t1', 4, 'WhatsApp', 'connected', 'WhatsApp Business API', 0.3),
    integ('t1', 5, 'Website Widget', 'connected', 'Чат-виджет на akademia-uspeh.kz', 1),
    integ('t1', 6, 'Email', 'connected', 'info@akademia-uspeh.kz', 4),
    integ('t1', 7, 'Bitrix24', 'setup_required', 'Импорт исторических данных', null),
    integ('t1', 8, 'Google Calendar', 'connected', 'Синхронизация встреч и занятий', 2),
    integ('t1', 9, 'Voice AI', 'connected', 'Голосовой ассистент на входящей линии', 2),
    integ('t2', 1, 'AAA AI Control Center', 'connected', 'Синхронизация AI-менеджеров и аналитики', 0.4),
    integ('t2', 2, 'Telegram', 'connected', 'Бот @stroykomplekt_bot', 3),
    integ('t2', 3, 'Instagram', 'connected', 'Direct-сообщения @stroykomplekt.kz', 0.7),
    integ('t2', 4, 'WhatsApp', 'error', 'Ошибка токена, требуется переавторизация', 26),
    integ('t2', 5, 'Website Widget', 'connected', 'Чат-виджет на stroykomplekt.kz', 0.3),
    integ('t2', 6, 'Email', 'setup_required', 'Подключение корпоративной почты', null),
    integ('t2', 7, 'Bitrix24', 'setup_required', 'Миграция из Bitrix24', null),
    integ('t2', 8, 'Google Calendar', 'connected', 'Синхронизация встреч', 8),
    integ('t2', 9, 'Voice AI', 'connected', 'Голосовой ассистент, входящие звонки', 6),
  ]

  const ev = (id: string, companyId: string, actorId: string | null, byAi: boolean, text: string, entity: ActivityEvent['entity'], entityId: string | null, minAgo: number): ActivityEvent => ({
    id, companyId, actorId, byAi, text, entity, entityId,
    at: new Date(now - minAgo * 60000).toISOString(),
  })

  const events: ActivityEvent[] = [
    ev('e1', 't1', null, true, 'AI создал лид «Индивидуальный курс — Дана» из Instagram', 'deal', 'd7', 60),
    ev('e2', 't1', 'u3', false, 'Марат перевел сделку «Корпоративное обучение — Казахтелеком» на этап «Переговоры»', 'deal', 'd1', 150),
    ev('e3', 't1', null, true, 'Voice AI обработал входящий звонок и записал клиента на пробный урок', 'call', 'cl1', 120),
    ev('e4', 't1', 'u2', false, 'Динара завершила задачу «Встреча с методистом Полиглот»', 'task', 'tk18', 300),
    ev('e5', 't1', null, true, 'AI создал лид «Курс гидов-переводчиков» из Telegram', 'deal', 'd14', 45),
    ev('e6', 't1', 'u3', false, 'Марат добавил заметку к сделке «Обучение медперсонала — Асыл»', 'deal', 'd4', 400),
    ev('e7', 't1', null, true, 'AI передал диалог с Жанной Ким менеджеру', 'conversation', 'cv6', 1430),
    ev('e8', 't1', 'u2', false, 'Динара закрыла сделку «Speaking Club — годовой абонемент» как выигранную', 'deal', 'd15', 2800),
    ev('e9', 't1', null, true, 'AI создал лид «Курс для администраторов — Дента Люкс» из WhatsApp', 'deal', 'd10', 1440),
    ev('e10', 't1', 'u3', false, 'Марат создал задачу «Собрать требования Казахтелеком IT»', 'task', 'tk13', 500),
    ev('e11', 't2', null, true, 'AI создал лид «Ламинат и плитка — частный заказ» с сайта', 'deal', 'd25', 90),
    ev('e12', 't2', 'u5', false, 'Айгерим перевела сделку «Кирпич М150 — ЖилСтройИнвест» на этап «Согласование»', 'deal', 'd21', 700),
    ev('e13', 't2', null, true, 'Voice AI обработал крупный запрос от «Дорстрой КЗ»', 'call', 'cl9', 1200),
    ev('e14', 't2', 'u5', false, 'Айгерим закрыла сделку «Сухие смеси — Евроремонт Плюс» как выигранную', 'deal', 'd23', 3000),
    ev('e15', 't2', null, false, 'Ошибка интеграции WhatsApp: токен истек', 'system', null, 1560),
  ]

  const assistants: AiAssistant[] = [
    {
      id: 'as1', companyId: 't1', name: 'Ассистент Академии', active: true,
      handled: 342, leadsCreated: 58, transferred: 41, conversionPct: 17,
      avgResponseSec: 4,
      channels: ['telegram', 'instagram', 'whatsapp', 'website'],
      prompt: 'Ты — консультант образовательного центра «Академия Успех» в Алматы. Отвечай дружелюбно и профессионально, обращайся по имени. Твоя цель — записать клиента на бесплатный пробный урок или передать корпоративный запрос менеджеру. Используй базу знаний: цены, расписание, программы. Не обещай скидки выше 10%.',
    },
    {
      id: 'as2', companyId: 't2', name: 'Ассистент СтройКомплект', active: true,
      handled: 218, leadsCreated: 34, transferred: 27, conversionPct: 16,
      avgResponseSec: 6,
      channels: ['telegram', 'instagram', 'website'],
      prompt: 'Ты — консультант компании «СтройКомплект» в Астане. Помогай клиентам подобрать стройматериалы, называй цены из базы знаний, уточняй объемы. Запросы от 1 млн ₸ передавай менеджеру. Не подтверждай наличие без проверки склада.',
    },
  ]

  return {
    tenants, users, deals, contacts, clientCompanies, tasks,
    conversations, calls, knowledgeDocs, integrations, events, assistants,
  }
}
