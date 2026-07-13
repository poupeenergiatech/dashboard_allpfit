'use client'

import { useState } from 'react'
import type { DateRange, Period } from './types'

const DEFAULT_CUSTOM_RANGE_DAYS = 7

function defaultCustomRange(): DateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - (DEFAULT_CUSTOM_RANGE_DAYS - 1))
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

export function useAcademiaFilter(initialAcademiaId: string | null) {
  const [academiaId, setAcademiaId] = useState<string | null>(initialAcademiaId)
  const [period, setPeriod] = useState<Period>('hoje')
  const [customRange, setCustomRange] = useState<DateRange | null>(null)

  // Ao entrar em "Personalizado" pela primeira vez, inicializa com um range razoável
  // (últimos 7 dias) em vez de deixar os campos de data vazios sem nenhum resultado.
  function changePeriod(next: Period) {
    setPeriod(next)
    if (next === 'personalizado' && !customRange) {
      setCustomRange(defaultCustomRange())
    }
  }

  return { academiaId, setAcademiaId, period, setPeriod: changePeriod, customRange, setCustomRange }
}
