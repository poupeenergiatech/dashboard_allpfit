import { WebinarsGrid } from '@/components/dashboard/webinars-grid'
import { canManageWebinars, getCurrentUserProfile } from '@/lib/auth/profile'
import { fetchWebinars } from '@/lib/dashboard/fetch-webinars'

export default async function WebinarPage() {
  const profile = await getCurrentUserProfile().catch(() => null)
  const webinars = await fetchWebinars()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Webinar</h2>
        <p className="page-subtitle">Conteúdos e gravações — link externo, aberto numa nova aba.</p>
      </div>

      <WebinarsGrid webinars={webinars} canManage={!!profile && canManageWebinars(profile.role)} />
    </div>
  )
}
