import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { runAlleDocumentosSync } from '@/lib/dashboard/sync-alle-documentos'

export const dynamic = 'force-dynamic'

// Disparada por um cron externo (mesmo esquema de /api/relatorio, ver docs/DEPLOY.md)
// pra rodar o sync Alle Documentos -> conversions sem depender de alguém clicar o
// botão manual em /configuracoes. Mesma lógica de matching (runAlleDocumentosSync),
// e cada execução — manual ou automática — vira uma linha em alle_documentos_sync_log.
//
// Protegida por CRON_SECRET (header `Authorization: Bearer <secret>`), igual ao
// /api/relatorio — mesmo secret, mesma barreira.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
  }

  try {
    const result = await runAlleDocumentosSync('automatico')

    revalidatePath('/configuracoes')
    revalidatePath('/performance')
    revalidatePath('/')

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Falha ao sincronizar conversões.' },
      { status: 500 }
    )
  }
}
