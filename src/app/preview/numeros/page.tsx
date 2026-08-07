import { NumerosList } from '@/components/dashboard/numeros-list'
import { MOCK_NUMEROS } from '@/lib/preview/mock-data'

export default function PreviewNumerosPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          WhatsApp <span className="mx-1 text-zinc-300 dark:text-zinc-700">/</span> Unidades
        </p>
        <h2 className="page-title">Contatos por unidade</h2>
        <p className="page-subtitle">
          Quais números de WhatsApp estão vinculados a cada unidade, status de conexão e volume de contatos do dia.
        </p>
      </div>

      <NumerosList rows={MOCK_NUMEROS} />
    </div>
  )
}
