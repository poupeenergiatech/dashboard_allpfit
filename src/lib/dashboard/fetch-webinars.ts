'use server'

import { pool } from '@/lib/db/pool'

export type WebinarEntry = {
  id: string
  titulo: string
  url: string
  descricao: string | null
  createdByEmail: string | null
  createdAt: string
}

// Sem escopo por academia/role — webinar é conteúdo geral, visível pra qualquer
// usuário autenticado (só o cadastro em /webinar fica restrito, ver
// canManageWebinars em src/lib/auth/profile.ts).
export async function fetchWebinars(): Promise<WebinarEntry[]> {
  const { rows } = await pool.query<{
    id: string
    titulo: string
    url: string
    descricao: string | null
    created_by_email: string | null
    created_at: string
  }>(
    `select w.id, w.titulo, w.url, w.descricao, u.email as created_by_email, w.created_at
     from webinars w
     left join users u on u.id = w.created_by
     order by w.created_at desc`
  )

  return rows.map((row) => ({
    id: row.id,
    titulo: row.titulo,
    url: row.url,
    descricao: row.descricao,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
  }))
}
