'use client'

import { useState } from 'react'
import type { Period } from './types'

export function useAcademiaFilter(initialAcademiaId: string | null) {
  const [academiaId, setAcademiaId] = useState<string | null>(initialAcademiaId)
  const [period, setPeriod] = useState<Period>('hoje')

  return { academiaId, setAcademiaId, period, setPeriod }
}
