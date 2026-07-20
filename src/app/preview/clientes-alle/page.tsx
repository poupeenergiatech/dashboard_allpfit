import { AcademiaFilterLinks } from '@/components/dashboard/academia-filter-links'
import { ClientesAlleForm } from '@/components/dashboard/clientes-alle-form'
import { ClientesAlleTable } from '@/components/dashboard/clientes-alle-table'
import { MOCK_ACADEMIAS, MOCK_CLIENTES_ALLE } from '@/lib/preview/mock-data'
import { mockConfirm, mockSave } from '@/lib/preview/mock-actions'

export default function PreviewClientesAllePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Clientes Alle</h2>
        <p className="page-subtitle">Clientes ativos na Alle Energia, cadastrados manualmente por academia.</p>
      </div>

      <AcademiaFilterLinks basePath="/preview/clientes-alle" academias={MOCK_ACADEMIAS} academiaId={null} />

      <ClientesAlleTable clientes={MOCK_CLIENTES_ALLE} academias={MOCK_ACADEMIAS} onUpdate={mockSave} onDelete={mockConfirm} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Cadastrar cliente</h3>
        <ClientesAlleForm academias={MOCK_ACADEMIAS} fixedAcademiaId={null} onCreate={mockSave} />
      </div>
    </div>
  )
}
