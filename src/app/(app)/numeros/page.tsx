import { NumerosList } from '@/components/dashboard/numeros-list'
import { fetchNumeros } from '@/lib/dashboard/fetch-numeros'
import { getCurrentUserProfile } from '@/lib/auth/profile'

export default async function NumerosPage() {
  const profile = await getCurrentUserProfile().catch(() => null)
  const rows = profile ? await fetchNumeros(profile) : []

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

      <NumerosList rows={rows} />
    </div>
  )
}
