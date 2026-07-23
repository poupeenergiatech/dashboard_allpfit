import { NumerosList } from '@/components/dashboard/numeros-list'
import { MOCK_NUMEROS } from '@/lib/preview/mock-data'

export default function PreviewNumerosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Contatos por unidade</h2>
        <p className="page-subtitle">
          Números de WhatsApp do agregador agrupados por unidade, com os contatos recebidos hoje. Status é um proxy
          do campo &quot;ativo&quot; da academia — o agregador ainda não expõe online/offline em tempo real.
        </p>
      </div>

      <NumerosList rows={MOCK_NUMEROS} />
    </div>
  )
}
