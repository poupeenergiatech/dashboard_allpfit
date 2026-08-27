'use server'

import { pool } from '@/lib/db/pool'
import { canViewNotasFiscaisHistorico, getCurrentUserProfile, scopeAcademiaId } from '@/lib/auth/profile'
import type { NotaFiscalTipo } from './fetch-notas-fiscais'

export type NotaFiscalHistoricoAcao =
  | 'upload'
  | 'substituicao'
  | 'exclusao'
  | 'status_validado'
  | 'status_reprovado'
  | 'status_pendente'

export type NotaFiscalHistoricoEntry = {
  id: string
  acao: NotaFiscalHistoricoAcao
  nomeArquivo: string
  tamanhoBytes: number
  performedByEmail: string
  createdAt: string
}

// Histórico de um slot específico (academia + tipo + mês/ano), mais recente
// primeiro — usado pelo modal "ver histórico" em notas-fiscais-calendar.tsx.
// Gate de VISUALIZAÇÃO exclusivo de Direção/Super Admin (canViewNotasFiscaisHistorico),
// mesmo padrão de scopeAcademiaId de fetchNotasFiscais.
export async function fetchNotaFiscalHistorico(
  requestedAcademiaId: string,
  tipo: NotaFiscalTipo,
  ano: number,
  mes: number
): Promise<NotaFiscalHistoricoEntry[]> {
  const profile = await getCurrentUserProfile()
  if (!profile || !canViewNotasFiscaisHistorico(profile.role)) {
    throw new Error('Sem permissão para ver o histórico de notas fiscais.')
  }

  const academiaId = scopeAcademiaId(profile, requestedAcademiaId)
  if (!academiaId) return []

  const { rows } = await pool.query<{
    id: string
    acao: NotaFiscalHistoricoAcao
    nome_arquivo: string
    tamanho_bytes: number
    performed_by_email: string
    created_at: string
  }>(
    `select id, acao, nome_arquivo, tamanho_bytes, performed_by_email, created_at
     from notas_fiscais_historico
     where academia_id = $1 and tipo = $2 and competencia_ano = $3 and competencia_mes = $4
     order by created_at desc`,
    [academiaId, tipo, ano, mes]
  )

  return rows.map((row) => ({
    id: row.id,
    acao: row.acao,
    nomeArquivo: row.nome_arquivo,
    tamanhoBytes: row.tamanho_bytes,
    performedByEmail: row.performed_by_email,
    createdAt: row.created_at,
  }))
}
