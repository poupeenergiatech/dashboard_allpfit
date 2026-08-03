'use server'

import { pool } from '@/lib/db/pool'
import { getCurrentUserProfile, scopeAcademiaId } from '@/lib/auth/profile'

export type NotaFiscalTipo = 'unidade' | 'individual'

export type NotaFiscalEntry = {
  id: string
  tipo: NotaFiscalTipo
  competenciaAno: number
  competenciaMes: number
  arquivoUrl: string
  nomeArquivo: string
  tamanhoBytes: number
  uploadedByEmail: string | null
  createdAt: string
}

// requestedAcademiaId sempre resolvido de novo via scopeAcademiaId (mesmo motivo de
// fetchFunnelCounts) — sem RLS, essa é a barreira real contra um coordenador pedindo
// notas de outra academia manipulando o valor no client. null (sem academia
// selecionável, ou nenhuma academia ativa) devolve lista vazia em vez de todas —
// diferente do resto do funil, nota fiscal é sempre por academia específica, "todas"
// não faz sentido aqui.
export async function fetchNotasFiscais(requestedAcademiaId: string | null, ano: number): Promise<NotaFiscalEntry[]> {
  const profile = await getCurrentUserProfile()
  if (!profile) throw new Error('Sem sessão válida.')

  const academiaId = scopeAcademiaId(profile, requestedAcademiaId)
  if (!academiaId) return []

  const { rows } = await pool.query<{
    id: string
    tipo: NotaFiscalTipo
    competencia_ano: number
    competencia_mes: number
    arquivo_url: string
    nome_arquivo: string
    tamanho_bytes: number
    uploaded_by_email: string | null
    created_at: string
  }>(
    `select nf.id, nf.tipo, nf.competencia_ano, nf.competencia_mes, nf.arquivo_url, nf.nome_arquivo,
            nf.tamanho_bytes, nf.created_at, u.email as uploaded_by_email
     from notas_fiscais nf
     left join users u on u.id = nf.uploaded_by
     where nf.academia_id = $1 and nf.competencia_ano = $2
     order by nf.competencia_mes, nf.tipo`,
    [academiaId, ano]
  )

  return rows.map((row) => ({
    id: row.id,
    tipo: row.tipo,
    competenciaAno: row.competencia_ano,
    competenciaMes: row.competencia_mes,
    arquivoUrl: row.arquivo_url,
    nomeArquivo: row.nome_arquivo,
    tamanhoBytes: row.tamanho_bytes,
    uploadedByEmail: row.uploaded_by_email,
    createdAt: row.created_at,
  }))
}
