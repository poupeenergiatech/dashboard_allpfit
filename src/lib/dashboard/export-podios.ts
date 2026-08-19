'use client'

// Export dos 3 pódios de /gestores (contatos, conversões, scans) em CSV e PDF —
// mesma classificação por academia que aparece na tela (ver rankRowsByMetric em
// gestores-podium.tsx), então o arquivo exportado sempre bate com o que o
// usuário está vendo no momento do clique (inclusive o filtro de academia e
// período já aplicados, já que `rows` chega filtrado do painel).
//
// jsPDF + jspdf-autotable NÃO entram no import estático deste arquivo (só o
// PDF precisa deles, CSV não) — import() dinâmico dentro de exportPodiosPdf
// pra esse ~150kB só ser baixado no clique em "Exportar PDF", em vez de
// engordar o bundle de /gestores pra todo mundo que só olha a página.
// `import type` continua estático (apagado na compilação, não vira import de
// verdade) só pra anotar o parâmetro dos helpers de desenho abaixo.
import { downloadCsv, toCsv } from './csv'
import { PODIUM_METRIC_KEYS, PODIUM_METRICS, rankRowsByMetric } from '@/components/dashboard/gestores-podium'
import type { GestoresPanelRow } from './fetch-gestores-panel'
import type { PodiumMetricKey } from '@/components/dashboard/gestores-podium'
import type { jsPDF } from 'jspdf'

function timestamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function ordinal(n: number): string {
  return `${n}º`
}

// ---------------------------------------------------------------------------
// CSV — sem como desenhar um pódio de verdade em texto plano, mas a forma
// (não só a lista corrida) reaproveita a mesma ideia: uma seção "PÓDIO (TOP 3)"
// em formato largo, 1º/2º/3º lugar lado a lado por métrica — o mais perto que
// uma planilha chega de mostrar os 3 degraus que aparecem na tela — e uma
// seção separada só pro 4º lugar em diante, do mesmo jeito que o card na tela
// separa o pódio da lista rolável abaixo dele.
// ---------------------------------------------------------------------------
export function exportPodiosCsv(rows: GestoresPanelRow[], periodLabel: string): void {
  const podioHeader = [
    'Métrica',
    '1º Lugar — Academia',
    '1º Lugar — Valor',
    '2º Lugar — Academia',
    '2º Lugar — Valor',
    '3º Lugar — Academia',
    '3º Lugar — Valor',
  ]
  const podioRows = PODIUM_METRIC_KEYS.map((metricKey) => {
    const metric = PODIUM_METRICS[metricKey]
    const top3 = rankRowsByMetric(rows, metricKey).slice(0, 3)
    const label = metric.title.replace('Pódio de ', '')
    const cells: (string | number | null)[] = [label]
    for (let i = 0; i < 3; i++) {
      cells.push(top3[i]?.nome ?? '', top3[i] ? top3[i][metricKey] : '')
    }
    return cells
  })

  const restHeader = ['Métrica', 'Colocação', 'Academia', 'Valor']
  const restRows = PODIUM_METRIC_KEYS.flatMap((metricKey) => {
    const metric = PODIUM_METRICS[metricKey]
    const label = metric.title.replace('Pódio de ', '')
    return rankRowsByMetric(rows, metricKey)
      .slice(3)
      .map((row, i) => [label, ordinal(i + 4), row.nome, row[metricKey]])
  })

  const csvRows: (string | number | null)[][] = [
    ['Pódios — Dashboard de Gestores'],
    ['Período', periodLabel],
    [],
    ['PÓDIO (TOP 3)'],
    podioHeader,
    ...podioRows,
  ]
  if (restRows.length > 0) {
    csvRows.push([], ['DEMAIS COLOCAÇÕES (4º em diante)'], restHeader, ...restRows)
  }

  downloadCsv(`podios-gestores-${timestamp()}.csv`, toCsv(csvRows))
}

// ---------------------------------------------------------------------------
// PDF — desenha o pódio de verdade (barras em degrau, 2º/1º/3º da esquerda pra
// direita, igual gestores-podium.tsx) em vez de só uma tabela de ranking.
// Cores por métrica são o hex real das mesmas 3 escalas usadas na tela
// (brand/accent em tailwind.config.ts; violet é a escala padrão do Tailwind,
// não customizada), do mais saturado (1º) ao mais claro (3º) — mesma leitura
// visual de "mais saturado = melhor colocação" que os cards da tela.
// ---------------------------------------------------------------------------
const PDF_PLACE_COLORS: Record<PodiumMetricKey, [string, string, string]> = {
  totalContatos: ['#7b00ae', '#ab5ccb', '#c894dd'], // brand-600 / 400 / 300
  totalConversoes: ['#ef6700', '#fea25c', '#ffc294'], // accent-600 / 400 / 300
  totalScansPeriodo: ['#7c3aed', '#a78bfa', '#c4b5fd'], // violet-600 / 400 / 300
}

const BADGE_FILL: [number, number, number] = [51, 65, 85] // slate-700 — mesmo badge escuro nos 3 pódios, contraste garantido com número branco independente da cor da barra

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
    metricKey: PodiumMetricKey
  }
): void {
  const { x, width, topY, barHeight, baseline, color, rank, row, metricKey } = opts
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
  doc.text(row[metricKey].toLocaleString('pt-BR'), centerX, topY + 9.5 + nameHeight + 4, { align: 'center' })

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
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  let cursorY = 16

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Pódios — Dashboard de Gestores', pageWidth / 2, cursorY, { align: 'center' })
  cursorY += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Período: ${periodLabel}`, pageWidth / 2, cursorY, { align: 'center' })
  doc.setTextColor(0)
  cursorY += 10

  const barWidth = 46
  const gap = 8
  const podiumWidth = barWidth * 3 + gap * 2
  const startX = margin + (pageWidth - margin * 2 - podiumWidth) / 2
  const nameBlockHeight = 24
  const barHeights = [32, 22, 16] // altura do 1º/2º/3º, igual à hierarquia visual da tela

  for (const metricKey of PODIUM_METRIC_KEYS) {
    const metric = PODIUM_METRICS[metricKey]
    const colors = PDF_PLACE_COLORS[metricKey]
    const ranked = rankRowsByMetric(rows, metricKey)
    const top3 = ranked.slice(0, 3)
    const rest = ranked.slice(3)

    // Bloco inteiro (título + 3 cards) não cabendo mais na página → pula pra
    // próxima antes de começar, senão o pódio fica cortado ao meio.
    const blockHeight = 10 + nameBlockHeight + barHeights[0] + 8
    if (cursorY + blockHeight > pageHeight - margin) {
      doc.addPage()
      cursorY = 16
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(metric.title, margin, cursorY)
    cursorY += 6

    const topY = cursorY
    const baseline = topY + nameBlockHeight + barHeights[0]

    // Ordem visual igual à tela: 2º à esquerda, 1º no centro (mais alto), 3º
    // à direita — não a ordem de colocação (1,2,3).
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
        color: colors[rankIndex],
        rank: rankIndex + 1,
        row,
        metricKey,
      })
    })

    cursorY = baseline + 8

    if (rest.length > 0) {
      autoTable(doc, {
        startY: cursorY,
        head: [['Colocação', 'Academia', metric.unitLabel[0].toUpperCase() + metric.unitLabel.slice(1)]],
        body: rest.map((row, i) => [ordinal(i + 4), row.nome, row[metricKey].toLocaleString('pt-BR')]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: hexToRgb(colors[0]) },
        margin: { left: margin, right: margin },
      })
      cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    } else {
      cursorY += 6
    }
  }

  doc.save(`podios-gestores-${timestamp()}.pdf`)
}
