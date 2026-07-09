import { TreinadasGrid } from '@/components/dashboard/treinadas-grid'
import { MOCK_TREINADAS } from '@/lib/preview/mock-data'
import { mockToggle } from '@/lib/preview/mock-actions'

export default function PreviewTreinadasPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Academias treinadas</h2>
        <p className="page-subtitle">Marque as unidades que já passaram pelo treinamento.</p>
      </div>

      <TreinadasGrid rows={MOCK_TREINADAS} canEdit onToggle={mockToggle} />
    </div>
  )
}
