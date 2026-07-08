import { FunnelDashboard } from '@/components/dashboard/funnel-dashboard'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile, seesAllAcademias } from '@/lib/supabase/profile'

export default async function DashboardHomePage() {
  const profile = await getCurrentUserProfile().catch((err: unknown) => {
    return err instanceof Error ? err.message : 'Erro ao carregar perfil do usuário'
  })

  if (typeof profile === 'string' || !profile) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        {typeof profile === 'string' ? profile : 'Nenhum perfil encontrado para este usuário.'}
      </div>
    )
  }

  const supabase = createClient()
  const { data: academias } = await supabase
    .from('academias')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')

  return (
    <FunnelDashboard
      academias={academias ?? []}
      initialAcademiaId={seesAllAcademias(profile.role) ? null : profile.academiaId}
    />
  )
}
