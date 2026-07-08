'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchFunnelCounts } from './fetch-funnel-counts'
import type { FunnelCounts, Period } from './types'

const REALTIME_DEBOUNCE_MS = 800
const AGREGADOR_POLL_MS = 30_000

export function useFunnelData(academiaId: string | null, period: Period) {
  const [counts, setCounts] = useState<FunnelCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const scheduleReload = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(reload, REALTIME_DEBOUNCE_MS)
  }, [reload])

  // Refetch sempre que academia ou período mudam.
  useEffect(() => {
    setLoading(true)
    reload()
  }, [reload])

  // Realtime: qualquer mudança em contacts/conversions/manual_data agenda um
  // refetch (debounced, para não disparar uma rajada de queries se muitos
  // eventos chegarem juntos — mitigação de risco do documento de sprints).
  // O Supabase Realtime já aplica a RLS do usuário logado, então um coordenador
  // só recebe eventos da própria academia.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('funil-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversions' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_data' }, scheduleReload)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [scheduleReload])

  // Polling do agregador: dispara a ingestão de contatos do dia a cada 30s.
  // O INSERT resultante no Supabase já é pego pela subscription acima — aqui só
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
