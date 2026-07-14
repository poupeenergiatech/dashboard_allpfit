function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatDateBR(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

export function formatDateTimeBR(date: Date): string {
  return `${formatDateBR(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const DATETIME_BR_RE = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
const DATE_BR_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/

// Parseia "DD/MM/YYYY HH:mm" (formato usado nos payloads de relatório, ida e volta).
// Retorna null em vez de lançar — quem chama decide se um contato malformado derruba o
// lote inteiro ou só é ignorado.
export function parseDateTimeBR(value: string): Date | null {
  const match = DATETIME_BR_RE.exec(value.trim())
  if (!match) return null

  const [, day, month, year, hour, minute] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  return Number.isNaN(date.getTime()) ? null : date
}

// Mesma ideia sem horário — payloads que só carregam "o dia a que o número se refere"
// (ex.: webhook de scans). Retorna 'YYYY-MM-DD', pronto pra uma coluna `date` do Postgres.
export function parseDateBRToISODate(value: string): string | null {
  const match = DATE_BR_RE.exec(value.trim())
  if (!match) return null

  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  if (Number.isNaN(date.getTime())) return null

  return `${year}-${month}-${day}`
}
