export type Period = 'hoje' | '7dias' | '30dias'

export type Academia = {
  id: string
  nome: string
}

export type DailyFunnelPoint = {
  date: string
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
