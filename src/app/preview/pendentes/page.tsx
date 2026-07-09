import { PreviewPendentesList } from './preview-pendentes-list'
import { MOCK_PENDENTES } from '@/lib/preview/mock-data'

export default function PreviewPendentesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Pendentes de assinatura</h2>
        <p className="page-subtitle">Clientes que ainda não assinaram o termo.</p>
      </div>

      <PreviewPendentesList initialRows={MOCK_PENDENTES} />
    </div>
  )
}
