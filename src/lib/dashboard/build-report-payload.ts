import { formatDateBR, formatDateTimeBR } from './date-br'
import { pool } from '@/lib/db/pool'

export type ReportContact = {
  nome: string
  telefone: string | null
  recebido_em: string
}

export type ReportAcademia = {
  academia: string
  telefone_numero: string | null
  novos_contatos: number
  contatos: ReportContact[]
}

export type ReportPayload = {
  data_relatorio: string
  gerado_em: string
  total_novos_contatos: number
  por_academia: ReportAcademia[]
}

// Monta o relatório de novos contatos de um dia específico, agrupado por academia — payload
// enviado pelo webhook configurado em /configuracoes (ver /api/relatorio). Roda fora de uma
// sessão de usuário (chamado por um cron externo), sem checagem de role.
export async function buildReportPayload(reportDate: Date): Promise<ReportPayload> {
  const dayStart = new Date(reportDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const [{ rows: academias }, { rows: contacts }] = await Promise.all([
    pool.query<{ id: string; nome: string; numero_telefone: string | null }>(
      'select id, nome, numero_telefone from academias where ativo = true order by nome'
    ),
    pool.query<{ nome: string; telefone: string | null; academia_id: string | null; created_at: string }>(
      'select nome, telefone, academia_id, created_at from contacts where created_at >= $1 and created_at < $2',
      [dayStart.toISOString(), dayEnd.toISOString()]
    ),
  ])

  const contactsByAcademia = new Map<string, typeof contacts>()
  for (const contact of contacts) {
    if (!contact.academia_id) continue
    const list = contactsByAcademia.get(contact.academia_id) ?? []
    list.push(contact)
    contactsByAcademia.set(contact.academia_id, list)
  }

  const porAcademia: ReportAcademia[] = (academias ?? [])
    .map((academia) => {
      const rows = contactsByAcademia.get(academia.id) ?? []
      return {
        academia: academia.nome,
        telefone_numero: academia.numero_telefone,
        novos_contatos: rows.length,
        contatos: rows.map((row) => ({
          nome: row.nome,
          telefone: row.telefone,
          recebido_em: formatDateTimeBR(new Date(row.created_at)),
        })),
      }
    })
    .filter((academia) => academia.novos_contatos > 0)

  return {
    data_relatorio: formatDateBR(dayStart),
    gerado_em: formatDateTimeBR(new Date()),
    total_novos_contatos: porAcademia.reduce((sum, a) => sum + a.novos_contatos, 0),
    por_academia: porAcademia,
  }
}
