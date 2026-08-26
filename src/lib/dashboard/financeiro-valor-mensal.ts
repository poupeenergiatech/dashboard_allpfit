// Tipo e formatadores puros (sem pool/profile) — importados tanto pelos componentes
// server (cards, tabela) quanto pelo gráfico ('use client'). O cálculo/persistência
// de verdade fica em fetch-financeiro-valor-mensal.ts: esse arquivo aqui não pode
// puxar `pool` (node:pg) nem `profile.ts` (next/headers), ou o bundle do client
// tenta empacotar os dois e quebra o build.

// R$10 por conversão no mês — pedido do usuário. Fica em centavos (não R$ float) pra
// não arrastar erro de ponto flutuante na coluna numérica; guardado por linha na
// tabela (não só lido daqui na hora de exibir) pra manter o valor histórico correto
// se essa constante mudar no futuro.
export const VALOR_POR_CONVERSAO_CENTAVOS = 1000

export type ValorMensalUnidade = {
  academiaId: string
  academiaNome: string
  ano: number
  mes: number
  // Quantidade de clientes que viraram 'ativo' PELA PRIMEIRA VEZ nesse mês
  // específico (ver clientes_alle_status_history e fetch-financeiro-valor-mensal.ts)
  // — diferente do "conversão" usado no resto do app (dashboard, /gestores,
  // /performance), que não exige status ativo. Só aqui em /financeiro esse nome
  // tem esse sentido mais restrito.
  quantidadeConversoes: number
  valorPorConversaoCentavos: number
  valorTotalCentavos: number
  calculadoEm: string
}

const MESES_ABREV = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

// "ago/2026" — usado no card do mês corrente, na tabela de histórico e no eixo do
// gráfico de linha, sempre com o mesmo formato curto.
export function formatCompetencia(ano: number, mes: number): string {
  return `${MESES_ABREV[mes - 1]}/${ano}`
}

export function formatCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
