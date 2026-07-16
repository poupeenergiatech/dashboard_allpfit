import { AcademiaAliasesSection } from '@/components/dashboard/academia-aliases-section'
import { AcademiasTable } from '@/components/dashboard/academias-table'
import { CreateAcademiaForm } from '@/components/dashboard/create-academia-form'
import { ImportAcademiasForm } from '@/components/dashboard/import-academias-form'
import { fetchAcademiaAliases, fetchAllAcademias } from '@/lib/dashboard/fetch-academias'
import { canManageUsers, getCurrentUserProfile } from '@/lib/auth/profile'

export default async function AcademiasPage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  if (!profile || !canManageUsers(profile.role)) {
    return (
      <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/10 p-6 text-sm font-medium text-amber-800 dark:text-amber-300">
        Acesso restrito ao Super Admin.
      </div>
    )
  }

  const [academias, aliases] = await Promise.all([fetchAllAcademias(), fetchAcademiaAliases()])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Academias</h2>
        <p className="page-subtitle">Unidades cadastradas — gestão restrita a Super Admin.</p>
      </div>

      <AcademiasTable academias={academias} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Cadastrar academia</h3>
        <CreateAcademiaForm />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Importar em lote (CSV)</h3>
        <ImportAcademiasForm />
      </div>

      <AcademiaAliasesSection aliases={aliases} />
    </div>
  )
}
