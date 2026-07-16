import { redirect } from 'next/navigation'
import { MobileNavProvider } from '@/components/layout/nav-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { ToastProvider } from '@/components/ui/toast'
import { getSessionUserId } from '@/lib/auth/session'
import { getCurrentUserProfile } from '@/lib/auth/profile'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // O middleware (Edge runtime) só checa se existe um cookie de sessão — quem confirma
  // que ela é válida (existe no banco, não expirou) é este layout, que roda em Node.js
  // runtime. Sem sessão válida, redireciona pra /login (mesmo comportamento que antes
  // vinha do middleware sozinho).
  const userId = await getSessionUserId()
  if (!userId) redirect('/login')

  // Autenticado mas sem user_profiles (usuário nunca vinculado a uma role) — cada
  // página trata essa mensagem separadamente (getCurrentUserProfile é cache()'d, então
  // essa segunda chamada não custa outra query); aqui só evita quebrar o Sidebar.
  const profile = await getCurrentUserProfile().catch(() => null)

  return (
    <ToastProvider>
      <MobileNavProvider>
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
          <Sidebar role={profile?.role ?? null} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex-1 p-4 md:p-8">
              <div className="mx-auto w-full max-w-6xl animate-fade-up">{children}</div>
            </main>
          </div>
        </div>
      </MobileNavProvider>
    </ToastProvider>
  )
}
