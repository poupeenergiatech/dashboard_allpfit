import { NumerosList } from '@/components/dashboard/numeros-list'
import { MOCK_NUMEROS } from '@/lib/preview/mock-data'

export default function PreviewNumerosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Contatos por unidade</h2>
      </div>

      <NumerosList rows={MOCK_NUMEROS} />
    </div>
  )
}
