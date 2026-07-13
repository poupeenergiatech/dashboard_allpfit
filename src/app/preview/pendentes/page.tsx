import { PendenciaSection } from '@/components/dashboard/pendencia-section'
import { PendenciasPorAcademiaChart } from '@/components/dashboard/pendencias-por-academia-chart'
import { PendenciasTotalCard } from '@/components/dashboard/pendencias-total-card'
import { PendenciasTrendChart } from '@/components/dashboard/pendencias-trend-chart'
import {
  MOCK_ACADEMIAS,
  MOCK_PENDENCIAS_HISTORY,
  MOCK_PENDENCIAS_POR_ACADEMIA,
  MOCK_PENDENCIAS_TREND,
} from '@/lib/preview/mock-data'
import { mockSave } from '@/lib/preview/mock-actions'

export default function PreviewPendentesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Pendentes de assinatura</h2>
        <p className="page-subtitle">Quantos alunos estão com assinatura de termo pendente, por academia.</p>
      </div>

      <PendenciasTotalCard rows={MOCK_PENDENCIAS_POR_ACADEMIA} />

      <PendenciasPorAcademiaChart rows={MOCK_PENDENCIAS_POR_ACADEMIA} />
      <PendenciasTrendChart series={MOCK_PENDENCIAS_TREND} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Lançar pendências</h3>
        <PendenciaSection
          academias={MOCK_ACADEMIAS}
          fixedAcademiaId={null}
          history={MOCK_PENDENCIAS_HISTORY}
          onSave={mockSave}
        />
      </div>
    </div>
  )
}
