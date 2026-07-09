import { AcademiaTable } from '@/components/dashboard/academia-table'
import { ManualDataForm } from '@/components/dashboard/manual-data-form'
import { MOCK_ACADEMIAS, MOCK_PERFORMANCE } from '@/lib/preview/mock-data'
import { mockSave } from '@/lib/preview/mock-actions'

export default function PreviewPerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Performance por academia</h2>
        <p className="page-subtitle">Totais acumulados de contatos e conversões por unidade.</p>
      </div>

      <AcademiaTable rows={MOCK_PERFORMANCE} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Atualizar dados manuais do dia</h3>
        <ManualDataForm academias={MOCK_ACADEMIAS} fixedAcademiaId={null} onSave={mockSave} />
      </div>
    </div>
  )
}
