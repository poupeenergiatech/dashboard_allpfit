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
import { downloadCsv, toCsv } from './csv'
import { PODIUM_METRIC_KEYS, PODIUM_METRICS, rankRowsByMetric } from '@/components/dashboard/gestores-podium'
import type { GestoresPanelRow } from './fetch-gestores-panel'

function timestamp(): string {
  return new Date().toISOString().slice(0, 10)
}

export function exportPodiosCsv(rows: GestoresPanelRow[], periodLabel: string): void {
  const header = ['Métrica', 'Posição', 'Academia', 'Valor', 'Período']
  const dataRows = PODIUM_METRIC_KEYS.flatMap((metricKey) => {
    const metric = PODIUM_METRICS[metricKey]
    return rankRowsByMetric(rows, metricKey).map((row, i) => [
      metric.title.replace('Pódio de ', ''),
      i + 1,
      row.nome,
      row[metricKey],
      periodLabel,
    ])
  })
  downloadCsv(`podios-gestores-${timestamp()}.csv`, toCsv([header, ...dataRows]))
}

export async function exportPodiosPdf(rows: GestoresPanelRow[], periodLabel: string): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let cursorY = 16

  doc.setFontSize(16)
  doc.text('Pódios — Dashboard de Gestores', pageWidth / 2, cursorY, { align: 'center' })
  cursorY += 7
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Período: ${periodLabel}`, pageWidth / 2, cursorY, { align: 'center' })
  doc.setTextColor(0)
  cursorY += 8

  for (const metricKey of PODIUM_METRIC_KEYS) {
    const metric = PODIUM_METRICS[metricKey]
    const ranked = rankRowsByMetric(rows, metricKey)

    // Cabeçalho da seção não cabendo mais na página → pula pra próxima antes de
    // desenhar o título, senão fica um título órfão colado no rodapé.
    if (cursorY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      cursorY = 16
    }

    doc.setFontSize(12)
    doc.text(metric.title, 14, cursorY)
    cursorY += 4

    autoTable(doc, {
      startY: cursorY,
      head: [['Posição', 'Academia', metric.unitLabel[0].toUpperCase() + metric.unitLabel.slice(1)]],
      body: ranked.map((row, i) => [String(i + 1), row.nome, row[metricKey].toLocaleString('pt-BR')]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 85, 105] },
      margin: { left: 14, right: 14 },
    })

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  doc.save(`podios-gestores-${timestamp()}.pdf`)
}
