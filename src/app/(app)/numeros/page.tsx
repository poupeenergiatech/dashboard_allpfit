import { NumerosList } from '@/components/dashboard/numeros-list'
import { fetchNumeros } from '@/lib/dashboard/fetch-numeros'
import { getCurrentUserProfile } from '@/lib/auth/profile'

export default async function NumerosPage() {
  const profile = await getCurrentUserProfile().catch(() => null)
  const rows = profile ? await fetchNumeros(profile) : []

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Números (WhatsApp)</h2>
        <p className="page-subtitle">
          Status é um proxy do campo &quot;ativo&quot; da academia — o agregador ainda não expõe
          online/offline em tempo real (ver <code>docs/SPRINT4_NOTES.md</code>).
        </p>
      </div>

      <NumerosList rows={rows} />
    </div>
  )
}
