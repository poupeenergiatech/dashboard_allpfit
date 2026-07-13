'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchFunnelCounts } from './fetch-funnel-counts'
import type { DateRange, FunnelCounts, Period } from './types'

const FUNNEL_POLL_MS = 10_000
const AGREGADOR_POLL_MS = 30_000

export function useFunnelData(academiaId: string | null, period: Period, customRange: DateRange | null) {
  const [counts, setCounts] = useState<FunnelCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  // Personalizado com data inicial/final incompletas (usuário ainda editando o
  // input) não deve disparar fetch nem sobrescrever o erro anterior com um genérico.
  const rangeIncomplete = period === 'personalizado' && (!customRange?.from || !customRange?.to)

  const reload = useCallback(async () => {
    if (rangeIncomplete) {
      setLoading(false)
      return
    }
    try {
      const next = await fetchFunnelCounts(academiaId, period, customRange)
      setCounts(next)
      setLastUpdatedAt(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o funil')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academiaId, period, customRange?.from, customRange?.to, rangeIncomplete])

  // Refetch sempre que academia, período ou o range personalizado mudam.
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
