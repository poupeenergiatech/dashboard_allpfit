import { createAdminClient } from '@/lib/supabase/admin'

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

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatDateBR(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

function formatDateTimeBR(date: Date): string {
  return `${formatDateBR(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Monta o relatório de novos contatos de um dia específico, agrupado por academia — payload
// enviado pelo webhook configurado em /configuracoes (ver /api/relatorio). Usa o client admin
// porque roda fora de uma sessão de usuário (chamado por um cron externo).
export async function buildReportPayload(reportDate: Date): Promise<ReportPayload> {
  const supabase = createAdminClient()

  const dayStart = new Date(reportDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const [{ data: academias, error: academiasError }, { data: contacts, error: contactsError }] = await Promise.all([
    supabase.from('academias').select('id, nome, numero_telefone').eq('ativo', true).order('nome'),
    supabase
      .from('contacts')
      .select('nome, telefone, academia_id, created_at')
      .gte('created_at', dayStart.toISOString())
      .lt('created_at', dayEnd.toISOString()),
  ])

  if (academiasError) throw academiasError
  if (contactsError) throw contactsError

  const contactsByAcademia = new Map<string, typeof contacts>()
  for (const contact of contacts ?? []) {
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
