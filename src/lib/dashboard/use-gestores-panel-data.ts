'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchGestoresPanel, type GestoresPanelData, type GestoresPanelPeriod } from './fetch-gestores-panel'
import type { DateRange } from './types'

const POLL_MS = 10_000

// Mesmo padrão de use-funnel-data.ts: sem equivalente a Realtime no Postgres
// próprio, então "ao vivo" é polling simples — pensado pra ficar aberto num telão
// da sala dos gestores, atualizando sozinho sem precisar de F5.
export function useGestoresPanelData(
  period: GestoresPanelPeriod,
  customRange: DateRange | null,
  academiaId: string | null
) {
  const [data, setData] = useState<GestoresPanelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const rangeIncomplete = period === 'personalizado' && (!customRange?.from || !customRange?.to)

  const reload = useCallback(async () => {
    if (rangeIncomplete) {
      setLoading(false)
      return
    }
    try {
      const next = await fetchGestoresPanel(period, customRange, academiaId)
      setData(next)
      setLastUpdatedAt(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o Dashboard')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customRange?.from, customRange?.to, academiaId, rangeIncomplete])

  useEffect(() => {
    setLoading(true)
    reload()
  }, [reload])

  useEffect(() => {
    const interval = setInterval(reload, POLL_MS)
    return () => clearInterval(interval)
  }, [reload])

  return { data, loading, error, lastUpdatedAt }
}
