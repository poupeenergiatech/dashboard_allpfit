'use server'

import { pool } from '@/lib/db/pool'
import type { MaterialEntry } from './types'

// Mesma mecânica de fetch-materiais-marketing.ts, tabela própria
// (treinamentos_webinar) — conteúdo separado, ver canManageTreinamentosWebinar em
// src/lib/auth/profile.ts. Sem escopo por academia/role: visível pra qualquer
// usuário autenticado, só o cadastro em /treinamentos-webinar fica restrito.
export async function fetchTreinamentosWebinar(): Promise<MaterialEntry[]> {
  const { rows } = await pool.query<{
    id: string
    titulo: string
    url: string
    descricao: string | null
    imagem_url: string | null
    created_by_email: string | null
    created_at: string
  }>(
    `select t.id, t.titulo, t.url, t.descricao, t.imagem_url, u.email as created_by_email, t.created_at
     from treinamentos_webinar t
     left join users u on u.id = t.created_by
     order by t.created_at desc`
  )

  return rows.map((row) => ({
    id: row.id,
    titulo: row.titulo,
    url: row.url,
    descricao: row.descricao,
    imagemUrl: row.imagem_url,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
  }))
}
