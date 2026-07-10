'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchFunnelCounts } from './fetch-funnel-counts'
import type { FunnelCounts, Period } from './types'

const FUNNEL_POLL_MS = 10_000
const AGREGADOR_POLL_MS = 30_000

export function useFunnelData(academiaId: string | null, period: Period) {
  const [counts, setCounts] = useState<FunnelCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const reload = useCallback(async () => {
    try {
      const next = await fetchFunnelCounts(academiaId, period)
      setCounts(next)
      setLastUpdatedAt(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o funil')
    } finally {
      setLoading(false)
    }
  }, [academiaId, period])

  // Refetch sempre que academia ou período mudam.
  useEffect(() => {
    setLoading(true)
    reload()
  }, [reload])

  // Postgres próprio não tem equivalente pronto ao Supabase Realtime — substitui a
  // subscription por polling simples. Indicador "AO VIVO" continua fazendo sentido:
  // só depende de lastUpdatedAt, que segue atualizando a cada rodada.
  useEffect(() => {
    const interval = setInterval(reload, FUNNEL_POLL_MS)
    return () => clearInterval(interval)
  }, [reload])

  // Polling do agregador: dispara a ingestão de contatos do dia a cada 30s.
  // O INSERT resultante aparece na próxima rodada do polling do funil acima — aqui só
  // disparamos a chamada, sem tratar a resposta diretamente.
  useEffect(() => {
    const poll = () => {
      fetch('/api/agregador').catch(() => {
        // Falha de rede no polling não deve quebrar o dashboard.
      })
    }
    poll()
    const interval = setInterval(poll, AGREGADOR_POLL_MS)
    return () => clearInterval(interval)
  }, [])

  return { counts, loading, error, lastUpdatedAt, reload }
}
