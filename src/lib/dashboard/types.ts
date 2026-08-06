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

// Compartilhado entre /central-marketing e /treinamentos-webinar — mesma forma de
// conteúdo (link externo + prévia extraída automaticamente, ver
// src/lib/dashboard/link-preview.ts) em duas tabelas separadas, ver
// fetch-materiais-marketing.ts e fetch-treinamentos-webinar.ts.
export type MaterialEntry = {
  id: string
  titulo: string
  url: string
  descricao: string | null
  imagemUrl: string | null
  createdByEmail: string | null
  createdAt: string
}

export type DailyFunnelPoint = {
  date: string
  totalAlunos: number
  totalScans: number
  contatos: number
  conversoesAne: number
  conversoesManual: number
  conversoes: number
  reprovados: number
  scansPorAcademia: { academiaId: string; academiaNome: string; totalScans: number }[]
}

export type FunnelCounts = {
  totalAlunos: number
  totalScans: number
  totalContatos: number
  totalConversoesAne: number
  totalConversoesManual: number
  totalConversoes: number
  totalReprovados: number
  totalClientesAlle: number
  series: DailyFunnelPoint[]
}
