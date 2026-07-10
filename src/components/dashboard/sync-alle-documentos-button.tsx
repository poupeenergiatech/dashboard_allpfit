'use client'

import { useState, useTransition } from 'react'
import { syncAlleDocumentosConvertidos, type SyncAlleDocumentosResult } from '@/app/(app)/configuracoes/actions'
import { useToast } from '@/components/ui/toast'

export function SyncAlleDocumentosButton({
  onSync = syncAlleDocumentosConvertidos,
}: {
  onSync?: () => Promise<SyncAlleDocumentosResult>
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<SyncAlleDocumentosResult | null>(null)
  const { showToast } = useToast()

  function handleClick() {
    startTransition(async () => {
      try {
        const next = await onSync()
        setResult(next)
        showToast(`Sincronizado: ${next.inseridas} nova(s) conversão(ões).`)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao sincronizar conversões.', 'error')
      }
    })
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900">Sincronizar conversões (Alle Documentos)</p>
        <p className="mt-1 text-xs text-slate-500">
          Busca no Supabase (tabela <code className="rounded bg-slate-100 px-1 py-0.5">alle_documentos_clientes</code>
          ) os clientes com &quot;completo&quot; e &quot;pós-venda&quot; preenchidos e cria a conversão
          correspondente, vinculando pelo nome da unidade. Pode rodar quantas vezes quiser — quem já foi
          sincronizado não duplica.
        </p>
      </div>

      <button type="button" onClick={handleClick} disabled={pending} className="btn-secondary">
        {pending ? 'Buscando…' : 'Buscar convertidos agora'}
      </button>

      {result && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">{result.totalConvertidos}</span> convertido(s)
            encontrado(s) no Supabase — <span className="font-semibold text-emerald-700">{result.inseridas}</span>{' '}
            nova(s), <span className="font-semibold text-slate-500">{result.jaExistentes}</span> já sincronizada(s)
            antes.
          </p>
          {result.naoEncontradas.length > 0 && (
            <p className="mt-2 text-amber-700">
              Unidade não encontrada em <code className="rounded bg-white/70 px-1 py-0.5">academias</code> pra:{' '}
              {result.naoEncontradas.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
