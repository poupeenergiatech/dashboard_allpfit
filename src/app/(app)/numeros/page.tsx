import { NumerosList } from '@/components/dashboard/numeros-list'
import { fetchNumeros } from '@/lib/dashboard/fetch-numeros'
import { getCurrentUserProfile } from '@/lib/auth/profile'

export default async function NumerosPage() {
  const profile = await getCurrentUserProfile().catch(() => null)
  const rows = profile ? await fetchNumeros(profile) : []

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Contatos por unidade</h2>
      </div>

      <NumerosList rows={rows} />
    </div>
  )
}
