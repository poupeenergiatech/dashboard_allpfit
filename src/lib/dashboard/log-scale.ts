// Escala logarítmica compartilhada por gráficos que precisam comparar métricas de
// ordens de grandeza muito diferentes na mesma barra/coluna (ex.: Alunos ~1500 vs
// Clientes Alle ativos ~5) sem que a menor vire um traço invisível nem que a maior
// esconda de vez a proporção real entre elas — log1p comprime a diferença
// preservando a ordem (quem é maior continua maior, só que numa razão mais amena),
// então cada valor > 0 ainda fica com uma altura/largura proporcional legível. O piso
// de 4% é só pra um valor > 0 nunca desaparecer visualmente igual a um 0 de verdade.
export function computeMaxLog(values: number[]): number {
  return Math.log1p(Math.max(0, ...values))
}

export function toWeight(value: number, maxLog: number): number {
  if (value <= 0 || maxLog <= 0) return 0
  return Math.max(Math.log1p(value) / maxLog, 0.04)
}
