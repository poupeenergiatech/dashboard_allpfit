// Serializa linhas pro formato CSV (RFC 4180) — só entre aspas quem precisa (tem
// vírgula, aspas ou quebra de linha), aspas internas dobradas ("") na volta, espelho
// do parser abaixo. \r\n porque é o que Excel espera; sem isso ele às vezes cola
// tudo numa linha só ao abrir.
export function toCsv(rows: (string | number | null)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell === null ? '' : String(cell)
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
        })
        .join(',')
    )
    .join('\r\n')
}

// Dispara o download de um CSV no browser — BOM UTF-8 na frente pra Excel não
// abrir acento (é, ç, ã) corrompido, já que ele assume Latin-1 sem essa marca.
export function downloadCsv(filename: string, csvText: string): void {
  const blob = new Blob(['﻿' + csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Parser CSV mínimo (sem dependência nova) — cobre campos entre aspas com vírgula/aspas
// escapadas ("") dentro, que é o suficiente pra exports do Excel/Google Sheets.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const normalized = text.replace(/\r\n/g, '\n')

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i]

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}
