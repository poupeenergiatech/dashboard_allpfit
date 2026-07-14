import { getCurrentUserProfile } from '@/lib/auth/profile'
import { ROLE_BADGE_CLASS, ROLE_LABEL } from '@/lib/dashboard/role-labels'
import { LogoutButton } from './logout-button'

export async function Topbar() {
  const profile = await getCurrentUserProfile().catch(() => null)
  const email = profile?.email ?? null

  const initial = email ? email[0]!.toUpperCase() : '?'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 pl-16 pr-4 backdrop-blur-md md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-slate-900">Dashboard de Performance</h1>
        <p className="truncate text-xs text-slate-500">Allp Fit × Alle Energia</p>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        {email && (
          <div className="hidden items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
              {initial}
            </span>
            <span className="max-w-[160px] truncate text-sm text-slate-600">{email}</span>
            {profile && (
              <span className={`badge shrink-0 ${ROLE_BADGE_CLASS[profile.role]}`}>{ROLE_LABEL[profile.role]}</span>
            )}
          </div>
        )}
        <LogoutButton />
      </div>
    </header>
  )
}
