'use client'

import { useState, useTransition } from 'react'
import { createAcademiaAlias } from '@/app/(app)/academias/actions'
import { syncAlleDocumentosConvertidos, type SyncAlleDocumentosResult } from '@/app/(app)/configuracoes/actions'
import { AutoSyncToggle } from './auto-sync-toggle'
import { useToast } from '@/components/ui/toast'

type CreateAliasAction = (academiaId: string, aliasNome: string) => Promise<void>

export function SyncAlleDocumentosButton({
  academias,
  autoSyncEnabled,
  onSync = syncAlleDocumentosConvertidos,
  onCreateAlias = createAcademiaAlias,
}: {
  academias: { id: string; nome: string }[]
  autoSyncEnabled: boolean
  onSync?: () => Promise<SyncAlleDocumentosResult>
  onCreateAlias?: CreateAliasAction
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<SyncAlleDocumentosResult | null>(null)
  const [linked, setLinked] = useState<Set<string>>(new Set())
  const { showToast } = useToast()

  function handleClick() {
    startTransition(async () => {
      try {
        const next = await onSync()
        setResult(next)
        setLinked(new Set())
        showToast(`Sincronizado: ${next.inseridas} nova(s) conversão(ões).`)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao sincronizar conversões.', 'error')
      }
    })
  }

  const pendentes = result?.naoEncontradas.filter((nome) => !linked.has(nome)) ?? []

  return (
    <div className="card space-y-4 p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Sincronizar conversões (Alle Documentos)</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Busca no Supabase (tabela <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5">alle_documentos_clientes</code>
          ) os clientes com &quot;completo&quot; e &quot;pós-venda&quot; preenchidos e cria a conversão
          correspondente, vinculando pelo nome da unidade. Pode rodar quantas vezes quiser — quem já foi
          sincronizado não duplica.
        </p>
      </div>

      <button type="button" onClick={handleClick} disabled={pending} className="btn-secondary">
        {pending ? 'Buscando…' : 'Buscar convertidos agora'}
      </button>

      <AutoSyncToggle initialEnabled={autoSyncEnabled} />

      {result && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 text-sm text-slate-700 dark:text-slate-300">
          <p>
            <span className="font-semibold text-slate-900 dark:text-white">{result.totalConvertidos}</span> convertido(s)
            encontrado(s) no Supabase — <span className="font-semibold text-emerald-700 dark:text-emerald-400">{result.inseridas}</span>{' '}
            nova(s), <span className="font-semibold text-slate-500 dark:text-slate-400">{result.jaExistentes}</span> já sincronizada(s)
            antes.
          </p>

          {result.semUnidade > 0 && (
            <p className="mt-2 text-amber-700 dark:text-amber-400">
              <span className="font-semibold">{result.semUnidade}</span> convertido(s) com unidade em branco no Alle
              Documentos — não dá pra vincular automaticamente nem por alias (não tem nome pra vincular). Corrija o
              campo &quot;unidade_allpfit&quot; direto na origem.
            </p>
          )}

          {pendentes.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-amber-700 dark:text-amber-400">
                Unidade não encontrada em <code className="rounded bg-white/70 dark:bg-slate-900/70 px-1 py-0.5">academias</code> —
                vincule a uma unidade cadastrada pra resolver na próxima sincronização:
              </p>
              <div className="space-y-1.5">
                {pendentes.map((nome) => (
                  <NaoEncontradaRow
                    key={nome}
                    nome={nome}
                    academias={academias}
                    onLinked={() => setLinked((prev) => new Set(prev).add(nome))}
                    onCreateAlias={onCreateAlias}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NaoEncontradaRow({
  nome,
  academias,
  onLinked,
  onCreateAlias,
}: {
  nome: string
  academias: { id: string; nome: string }[]
  onLinked: () => void
  onCreateAlias: CreateAliasAction
}) {
  const [academiaId, setAcademiaId] = useState('')
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleLink() {
    if (!academiaId || pending) return
    startTransition(async () => {
      try {
        await onCreateAlias(academiaId, nome)
        showToast(`"${nome}" vinculado.`)
        onLinked()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao vincular.', 'error')
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white/70 dark:bg-slate-900/70 px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-slate-800 dark:text-slate-100">{nome}</span>
      <select
        value={academiaId}
        onChange={(e) => setAcademiaId(e.target.value)}
        disabled={pending}
        className="input h-8 max-w-[220px] py-0 text-xs"
      >
        <option value="">Vincular a…</option>
        {academias.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nome}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!academiaId || pending}
        onClick={handleLink}
        className="btn-secondary h-8 px-3 py-0 text-xs disabled:opacity-50"
      >
        {pending ? 'Vinculando…' : 'Vincular'}
      </button>
    </div>
  )
}
