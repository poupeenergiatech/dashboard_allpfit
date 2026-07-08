import type { Period } from './types'

const DAYS_BY_PERIOD: Record<Period, number> = {
  hoje: 1,
  '7dias': 7,
  '30dias': 30,
}

// `from` em ISO (para created_at de contacts/conversions) e `fromDate` em
// yyyy-mm-dd (para a coluna `data`, tipo date, de manual_data).
export function periodRange(period: Period): { from: string; fromDate: string } {
  const days = DAYS_BY_PERIOD[period]
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  from.setHours(0, 0, 0, 0)

  return { from: from.toISOString(), fromDate: from.toISOString().slice(0, 10) }
}
