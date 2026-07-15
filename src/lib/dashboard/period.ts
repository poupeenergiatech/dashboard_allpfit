import type { DateRange, Period } from './types'

const PRESET_DAYS: Record<'hoje' | '7dias' | '30dias' | '90dias' | '1ano', number> = {
  hoje: 1,
  '7dias': 7,
  '30dias': 30,
  '90dias': 90,
  '1ano': 365,
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function daysBetweenInclusive(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00`)
  const to = new Date(`${toDate}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
}

export type PeriodRange = {
  // ISO timestamp — limite inferior (inclusive) pra created_at de contacts/conversions.
  from: string
  // ISO timestamp — limite superior (exclusive) pra created_at, sempre início do dia
  // seguinte a `toDate` (evita cortar contatos criados mais tarde no próprio `toDate`).
  toExclusive: string
  // yyyy-mm-dd — limite inferior/superior (inclusive) pra `data`, tipo date, de
  // manual_data e pendencias_assinatura.
  fromDate: string
  toDate: string
  days: number
}

// `period` fixo (hoje/7dias/30dias) sempre termina hoje; 'personalizado' usa o range
// escolhido no filtro de data (ver DateRange, FilterBar) — pode ser qualquer intervalo
// passado, não só "últimos N dias a partir de agora".
export function periodRange(period: Period, customRange?: DateRange): PeriodRange {
  if (period === 'personalizado') {
    if (!customRange) {
      throw new Error('Período personalizado requer data inicial e final.')
    }
    const { from: fromDate, to: toDate } = customRange
    if (fromDate > toDate) {
      throw new Error('Data inicial não pode ser depois da data final.')
    }

    const toExclusiveDate = new Date(`${toDate}T00:00:00`)
    toExclusiveDate.setDate(toExclusiveDate.getDate() + 1)

    return {
      from: `${fromDate}T00:00:00.000Z`,
      toExclusive: toExclusiveDate.toISOString(),
      fromDate,
      toDate,
      days: daysBetweenInclusive(fromDate, toDate),
    }
  }

  // 'ontem' não cabe no modelo "N dias terminando hoje" do PRESET_DAYS abaixo — é um
  // único dia, deslocado -1 em vez de terminar em hoje.
  if (period === 'ontem') {
    const from = new Date()
    from.setDate(from.getDate() - 1)
    from.setHours(0, 0, 0, 0)

    const toExclusive = new Date(from)
    toExclusive.setDate(toExclusive.getDate() + 1)

    return {
      from: from.toISOString(),
      toExclusive: toExclusive.toISOString(),
      fromDate: toIsoDate(from),
      toDate: toIsoDate(from),
      days: 1,
    }
  }

  const days = PRESET_DAYS[period]
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  from.setHours(0, 0, 0, 0)

  const toExclusive = new Date()
  toExclusive.setDate(toExclusive.getDate() + 1)
  toExclusive.setHours(0, 0, 0, 0)

  return {
    from: from.toISOString(),
    toExclusive: toExclusive.toISOString(),
    fromDate: toIsoDate(from),
    toDate: toIsoDate(new Date()),
    days,
  }
}
