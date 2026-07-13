export type Period = 'hoje' | '7dias' | '30dias' | 'personalizado'

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
}

export type FunnelCounts = {
  totalAlunos: number
  totalScans: number
  totalContatos: number
  totalConversoes: number
  series: DailyFunnelPoint[]
}
