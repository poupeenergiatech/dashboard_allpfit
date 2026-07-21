import { AcademiaFilterLinks } from '@/components/dashboard/academia-filter-links'
import { ClientesConvertidosTable } from '@/components/dashboard/clientes-convertidos-table'
import { MOCK_ACADEMIAS, MOCK_CLIENTES_CONVERTIDOS } from '@/lib/preview/mock-data'
import { mockSave } from '@/lib/preview/mock-actions'

export default function PreviewConvertidosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Clientes convertidos</h2>
        <p className="page-subtitle">
          Convertidos pela Ane (sync do Alle Documentos) e manualmente (cadastro/CSV de Clientes Alle), com nome e
          telefone — inclui quem da Ane ainda está sem unidade vinculada, quando o filtro é &quot;Todas as
          academias&quot;.
        </p>
      </div>

      <AcademiaFilterLinks basePath="/preview/convertidos" academias={MOCK_ACADEMIAS} academiaId={null} />

      <ClientesConvertidosTable
        clientes={MOCK_CLIENTES_CONVERTIDOS}
        academias={MOCK_ACADEMIAS}
        onUpdate={mockSave}
        onPromote={mockSave}
        onReprovarAne={mockSave}
        onDesfazerReprovacaoAne={mockSave}
        onReprovarManual={mockSave}
      />
    </div>
  )
}
