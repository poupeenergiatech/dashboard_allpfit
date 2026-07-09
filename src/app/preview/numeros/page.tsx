import { NumerosList } from '@/components/dashboard/numeros-list'
import { MOCK_NUMEROS } from '@/lib/preview/mock-data'

export default function PreviewNumerosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Números (WhatsApp)</h2>
        <p className="page-subtitle">
          Status é um proxy do campo &quot;ativo&quot; da academia — o agregador ainda não expõe
          online/offline em tempo real.
        </p>
      </div>

      <NumerosList rows={MOCK_NUMEROS} />
    </div>
  )
}
