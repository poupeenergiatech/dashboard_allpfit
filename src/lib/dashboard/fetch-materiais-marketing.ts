'use server'

import { pool } from '@/lib/db/pool'

export type MaterialEntry = {
  id: string
  titulo: string
  url: string
  descricao: string | null
  imagemUrl: string | null
  createdByEmail: string | null
  createdAt: string
}

// Sem escopo por academia/role — material de marketing é conteúdo geral, visível
// pra qualquer usuário autenticado (só o cadastro em /central-marketing fica
// restrito, ver canManageMateriaisMarketing em src/lib/auth/profile.ts).
export async function fetchMateriais(): Promise<MaterialEntry[]> {
  const { rows } = await pool.query<{
    id: string
    titulo: string
    url: string
    descricao: string | null
    imagem_url: string | null
    created_by_email: string | null
    created_at: string
  }>(
    `select m.id, m.titulo, m.url, m.descricao, m.imagem_url, u.email as created_by_email, m.created_at
     from materiais_marketing m
     left join users u on u.id = m.created_by
     order by m.created_at desc`
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
