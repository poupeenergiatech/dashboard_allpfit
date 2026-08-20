'use client'

// Export do pódio de conversões de /gestores em CSV e PDF — mesma classificação
// por academia que aparece na tela (ver rankRowsByMetric em gestores-podium.tsx),
// então o arquivo exportado sempre bate com o que o usuário está vendo no
// momento do clique (inclusive o filtro de academia e período já aplicados, já
// que `rows` chega filtrado do painel).
//
// Antes exportava os 3 pódios (contatos/conversões/scans); a pedido do
// usuário, o relatório ficou só com o de conversões — os outros dois
// continuam visíveis na tela, só não entram mais no CSV/PDF.
//
// jsPDF + jspdf-autotable NÃO entram no import estático deste arquivo (só o
// PDF precisa deles, CSV não) — import() dinâmico dentro de exportPodiosPdf
// pra esse ~150kB só ser baixado no clique em "Exportar PDF", em vez de
// engordar o bundle de /gestores pra todo mundo que só olha a página.
// `import type` continua estático (apagado na compilação, não vira import de
// verdade) só pra anotar o parâmetro dos helpers de desenho abaixo.
import { downloadCsv, toCsv } from './csv'
import { rankRowsByMetric } from '@/components/dashboard/gestores-podium'
import type { GestoresPanelRow } from './fetch-gestores-panel'
import type { PodiumMetricKey } from '@/components/dashboard/gestores-podium'
import type { jsPDF } from 'jspdf'

const METRIC_KEY: PodiumMetricKey = 'totalConversoes'

function timestamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function ordinal(n: number): string {
  return `${n}º`
}

// ---------------------------------------------------------------------------
// CSV — sem como desenhar um pódio de verdade em texto plano, mas a forma
// (não só a lista corrida) reaproveita a mesma ideia: uma seção "PÓDIO (TOP 3)"
// e uma seção separada só pro 4º lugar em diante, do mesmo jeito que o card na
// tela separa o pódio da lista rolável abaixo dele.
// ---------------------------------------------------------------------------
export function exportPodiosCsv(rows: GestoresPanelRow[], periodLabel: string): void {
  const ranked = rankRowsByMetric(rows, METRIC_KEY)
  const top3 = ranked.slice(0, 3)
  const rest = ranked.slice(3)

  const csvRows: (string | number | null)[][] = [
    ['Pódio de Conversões — Dashboard de Gestores'],
    ['Período', periodLabel],
    [],
    ['PÓDIO (TOP 3)'],
    ['Colocação', 'Academia', 'Conversões'],
    ...top3.map((row, i) => [ordinal(i + 1), row.nome, row[METRIC_KEY]]),
  ]
  if (rest.length > 0) {
    csvRows.push(
      [],
      ['DEMAIS COLOCAÇÕES (4º em diante)'],
      ['Colocação', 'Academia', 'Conversões'],
      ...rest.map((row, i) => [ordinal(i + 4), row.nome, row[METRIC_KEY]])
    )
  }

  downloadCsv(`podio-conversoes-gestores-${timestamp()}.csv`, toCsv(csvRows))
}

// ---------------------------------------------------------------------------
// PDF — desenha o pódio de verdade (barras em degrau, 2º/1º/3º da esquerda pra
// direita, igual gestores-podium.tsx) em vez de só uma tabela de ranking.
// Cores são o hex real da escala accent usada na tela (accent-600/400/300 em
// tailwind.config.ts), do mais saturado (1º) ao mais claro (3º) — mesma
// leitura visual de "mais saturado = melhor colocação" do card da tela.
// ---------------------------------------------------------------------------
const PLACE_COLORS: [string, string, string] = ['#ef6700', '#fea25c', '#ffc294'] // accent-600 / 400 / 300

const BADGE_FILL: [number, number, number] = [51, 65, 85] // slate-700 — badge escuro, contraste garantido com número branco independente da cor da barra

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '')
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}

// Nome centralizado, quebrado em até 2 linhas — largura da barra raramente
// cabe o nome inteiro de uma unidade numa linha só.
function drawCenteredWrapped(doc: jsPDF, text: string, centerX: number, startY: number, maxWidth: number): number {
  const lines = doc.splitTextToSize(text, maxWidth).slice(0, 2)
  const lineHeight = 3.4
  lines.forEach((line: string, i: number) => doc.text(line, centerX, startY + i * lineHeight, { align: 'center' }))
  return lines.length * lineHeight
}

// Um card do pódio (avatar + nome + valor em cima, barra colorida embaixo com
// o número da colocação) — mesma composição visual de cada coluna em
// gestores-podium.tsx, só que em vez de 3 divs lado a lado, 3 blocos
// desenhados no PDF.
function drawPlaceCard(
  doc: jsPDF,
  opts: {
    x: number
    width: number
    topY: number
    barHeight: number
    baseline: number
    color: string
    rank: number
    row: GestoresPanelRow
  }
): void {
  const { x, width, topY, barHeight, baseline, color, rank, row } = opts
  const centerX = x + width / 2
  const [r, g, b] = hexToRgb(color)

  // Avatar: círculo com a inicial do nome, mesmo papel do <Avatar> na tela.
  doc.setFillColor(r, g, b)
  doc.circle(centerX, topY + 3.2, 3.2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text((row.nome[0] ?? '?').toUpperCase(), centerX, topY + 4.3, { align: 'center' })

  // Nome + valor, sempre em texto escuro (fica sobre fundo branco, fora da barra).
  doc.setTextColor(15, 23, 42) // slate-900
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const nameHeight = drawCenteredWrapped(doc, row.nome, centerX, topY + 9.5, width - 4)

  // Valor (fonte maior, negrito) logo abaixo do nome.
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(row[METRIC_KEY].toLocaleString('pt-BR'), centerX, topY + 9.5 + nameHeight + 4, { align: 'center' })

  // Barra (riser) — cantos levemente arredondados, mesma cor do avatar.
  doc.setFillColor(r, g, b)
  doc.roundedRect(x, baseline - barHeight, width, barHeight, 1.5, 1.5, 'F')

  // Badge de colocação no topo da barra.
  doc.setFillColor(...BADGE_FILL)
  doc.circle(centerX, baseline - barHeight + 4.5, 3.6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(String(rank), centerX, baseline - barHeight + 5.7, { align: 'center' })
  doc.setTextColor(15, 23, 42)
}

export async function exportPodiosPdf(rows: GestoresPanelRow[], periodLabel: string): Promise<void> {
  const [{ jsPDF: JsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new JsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  let cursorY = 16

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Pódio de Conversões — Dashboard de Gestores', pageWidth / 2, cursorY, { align: 'center' })
  cursorY += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Período: ${periodLabel}`, pageWidth / 2, cursorY, { align: 'center' })
  doc.setTextColor(0)
  cursorY += 10

  const ranked = rankRowsByMetric(rows, METRIC_KEY)
  const top3 = ranked.slice(0, 3)
  const rest = ranked.slice(3)

  const barWidth = 46
  const gap = 8
  const podiumWidth = barWidth * 3 + gap * 2
  const startX = margin + (pageWidth - margin * 2 - podiumWidth) / 2
  const nameBlockHeight = 24
  const barHeights = [32, 22, 16] // altura do 1º/2º/3º, igual à hierarquia visual da tela

  const topY = cursorY
  const baseline = topY + nameBlockHeight + barHeights[0]

  // Ordem visual igual à tela: 2º à esquerda, 1º no centro (mais alto), 3º à
  // direita — não a ordem de colocação (1,2,3).
  const visualOrder = [1, 0, 2]
  visualOrder.forEach((rankIndex, slot) => {
    const row = top3[rankIndex]
    if (!row) return
    const x = startX + slot * (barWidth + gap)
    drawPlaceCard(doc, {
      x,
      width: barWidth,
      topY,
      barHeight: barHeights[rankIndex],
      baseline,
      color: PLACE_COLORS[rankIndex],
      rank: rankIndex + 1,
      row,
    })
  })

  cursorY = baseline + 8

  if (rest.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Colocação', 'Academia', 'Conversões']],
      body: rest.map((row, i) => [ordinal(i + 4), row.nome, row[METRIC_KEY].toLocaleString('pt-BR')]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: hexToRgb(PLACE_COLORS[0]) },
      margin: { left: margin, right: margin },
    })
  }

  doc.save(`podio-conversoes-gestores-${timestamp()}.pdf`)
}
