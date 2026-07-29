import { getCurrentUserProfile } from '@/lib/auth/profile'
import { ROLE_BADGE_CLASS, ROLE_LABEL } from '@/lib/dashboard/role-labels'
import { LogoutButton } from './logout-button'
import { TopbarShell } from './topbar-shell'
import { ThemeToggle } from './theme-toggle'

export async function Topbar() {
  const profile = await getCurrentUserProfile().catch(() => null)
  const email = profile?.email ?? null

  const initial = email ? email[0]!.toUpperCase() : '?'

  return (
    <TopbarShell>
      {email && (
        <div className="hidden items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm sm:flex dark:border-slate-700 dark:bg-slate-800">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            {initial}
          </span>
          <span className="max-w-[160px] truncate text-sm text-slate-600 dark:text-slate-300">{email}</span>
          {profile && (
            <span className={`badge shrink-0 ${ROLE_BADGE_CLASS[profile.role]}`}>{ROLE_LABEL[profile.role]}</span>
          )}
        </div>
      )}
      <ThemeToggle />
      <LogoutButton />
    </TopbarShell>
  )
}
