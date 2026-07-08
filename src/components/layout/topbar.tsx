import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './logout-button'

export async function Topbar() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white pl-16 pr-4 md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-slate-900">Dashboard de Performance</h1>
        <p className="truncate text-xs text-slate-500">Allp Fit × Alle Energia</p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <span className="hidden text-sm text-slate-600 sm:inline">{user?.email}</span>
        <LogoutButton />
      </div>
    </header>
  )
}
