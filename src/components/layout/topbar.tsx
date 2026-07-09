import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './logout-button'

export async function Topbar() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const initial = user?.email ? user.email[0]!.toUpperCase() : '?'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 pl-16 pr-4 backdrop-blur-md md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-slate-900">Dashboard de Performance</h1>
        <p className="truncate text-xs text-slate-500">Allp Fit × Alle Energia</p>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        {user?.email && (
          <div className="hidden items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
              {initial}
            </span>
            <span className="max-w-[160px] truncate text-sm text-slate-600">{user.email}</span>
          </div>
        )}
        <LogoutButton />
      </div>
    </header>
  )
}
