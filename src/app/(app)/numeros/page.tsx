import { NumerosList } from '@/components/dashboard/numeros-list'
import { fetchNumeros } from '@/lib/dashboard/fetch-numeros'

export default async function NumerosPage() {
  const rows = await fetchNumeros()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Números (WhatsApp)</h2>
        <p className="text-sm text-slate-500">
          Status é um proxy do campo &quot;ativo&quot; da academia — o agregador ainda não expõe
          online/offline em tempo real (ver <code>docs/SPRINT4_NOTES.md</code>).
        </p>
      </div>

      <NumerosList rows={rows} />
    </div>
  )
}
