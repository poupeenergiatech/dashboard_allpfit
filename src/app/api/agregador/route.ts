import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// PREMISSA A VALIDAR COM A EQUIPE DO AGREGADOR — não temos o contrato real da API.
// O documento de sprints só garante: "o agregador de números já possui endpoint que
// retorna contatos do dia por academia". O shape abaixo (path, campos, forma de
// identificar a academia) é um placeholder razoável; ajuste para o formato real assim
// que a URL/chave forem fornecidas.
type AgregadorContato = {
  id: string
  nome?: string
  numero_telefone: string // deve bater com academias.numero_telefone
  criado_em: string
}

export async function GET() {
  const aggregatorUrl = process.env.AGREGADOR_API_URL
  const aggregatorKey = process.env.AGREGADOR_API_KEY

  if (!aggregatorUrl) {
    return NextResponse.json({ synced: 0, skipped: 'AGREGADOR_API_URL não configurada' })
  }

  try {
    const response = await fetch(`${aggregatorUrl}/contatos/hoje`, {
      headers: aggregatorKey ? { Authorization: `Bearer ${aggregatorKey}` } : undefined,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Agregador respondeu ${response.status}`)
    }

    const contatosDoDia: AgregadorContato[] = await response.json()
    const supabaseAdmin = createAdminClient()

    const { data: academias, error: academiasError } = await supabaseAdmin
      .from('academias')
      .select('id, numero_telefone')

    if (academiasError) throw academiasError

    const academiaIdByPhone = new Map((academias ?? []).map((a) => [a.numero_telefone, a.id]))

    const rows = contatosDoDia
      .map((c) => ({
        id: c.id,
        nome: c.nome ?? null,
        academia_id: academiaIdByPhone.get(c.numero_telefone) ?? null,
        created_at: c.criado_em,
      }))
      .filter((row): row is typeof row & { academia_id: string } => row.academia_id !== null)

    if (rows.length > 0) {
      const { error: upsertError } = await supabaseAdmin.from('contacts').upsert(rows, { onConflict: 'id' })
      if (upsertError) throw upsertError
    }

    return NextResponse.json({ synced: rows.length })
  } catch (err) {
    // Risco documentado: "Endpoint do agregador fora do ar" — não derruba o
    // dashboard, só reporta a falha. O Realtime continua funcionando com o
    // que já está no Supabase (fallback para o último valor salvo).
    return NextResponse.json(
      { synced: 0, error: err instanceof Error ? err.message : 'Falha ao sincronizar agregador' },
      { status: 200 }
    )
  }
}
