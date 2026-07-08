import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { ToastProvider } from '@/components/ui/toast'
import { getCurrentUserProfile } from '@/lib/supabase/profile'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentUserProfile().catch(() => null)

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role={profile?.role ?? null} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}
