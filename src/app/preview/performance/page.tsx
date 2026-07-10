import { AcademiaPerformanceChart } from '@/components/dashboard/academia-performance-chart'
import { AcademiaTable } from '@/components/dashboard/academia-table'
import { ManualDataSection } from '@/components/dashboard/manual-data-section'
import { MOCK_ACADEMIAS, MOCK_MANUAL_DATA_HISTORY, MOCK_PERFORMANCE } from '@/lib/preview/mock-data'
import { mockSave } from '@/lib/preview/mock-actions'

export default function PreviewPerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Performance por academia</h2>
        <p className="page-subtitle">Totais acumulados de contatos e conversões por unidade.</p>
      </div>

      <AcademiaPerformanceChart rows={MOCK_PERFORMANCE} />

      <AcademiaTable rows={MOCK_PERFORMANCE} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Dados manuais</h3>
        <ManualDataSection
          academias={MOCK_ACADEMIAS}
          fixedAcademiaId={null}
          history={MOCK_MANUAL_DATA_HISTORY}
          onSave={mockSave}
        />
      </div>
    </div>
  )
}
