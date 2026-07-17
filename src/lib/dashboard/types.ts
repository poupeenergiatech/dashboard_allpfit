export type Period = 'hoje' | 'ontem' | '7dias' | '30dias' | '90dias' | '1ano' | 'personalizado'

// yyyy-mm-dd, inclusive nos dois lados — só usado quando period === 'personalizado'.
export type DateRange = {
  from: string
  to: string
}

export type Academia = {
  id: string
  nome: string
}

export type DailyFunnelPoint = {
  date: string
  totalAlunos: number
  totalScans: number
  contatos: number
  conversoes: number
  reprovados: number
  scansPorAcademia: { academiaId: string; academiaNome: string; totalScans: number }[]
}

export type FunnelCounts = {
  totalAlunos: number
  totalScans: number
  totalContatos: number
  totalConversoes: number
  totalReprovados: number
  series: DailyFunnelPoint[]
}
