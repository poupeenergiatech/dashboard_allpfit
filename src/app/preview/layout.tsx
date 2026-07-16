import { notFound } from 'next/navigation'
import { MobileNavProvider } from '@/components/layout/nav-context'
import { Sidebar } from '@/components/layout/sidebar'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { TopbarShell } from '@/components/layout/topbar-shell'
import { ToastProvider } from '@/components/ui/toast'
import { Icon } from '@/components/ui/icons'
import { ROLE_BADGE_CLASS, ROLE_LABEL } from '@/lib/dashboard/role-labels'

// Rota de demonstração com dados fictícios — nunca deve existir em produção.
// A checagem de NODE_ENV no middleware já bloqueia isso antes de chegar aqui;
// isso é uma segunda camada de defesa caso alguém rode um build de produção
// com NODE_ENV errado.
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return (
    <ToastProvider>
      <MobileNavProvider>
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
          <Sidebar role="super_admin" basePath="/preview" />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-center gap-1.5 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 md:px-6">
              <Icon name="warning" className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Modo prévia — dados fictícios, nenhuma ação aqui é salva de verdade
            </div>
            <TopbarShell basePath="/preview" subtitle="Allp Fit × Alle Energia (prévia)">
              <div className="hidden items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm sm:flex dark:border-slate-700 dark:bg-slate-800">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                  P
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300">preview@allpfit.dev</span>
                <span className={`badge shrink-0 ${ROLE_BADGE_CLASS.super_admin}`}>{ROLE_LABEL.super_admin}</span>
              </div>
              <ThemeToggle />
            </TopbarShell>
            <main className="flex-1 p-4 md:p-8">
              <div className="mx-auto w-full max-w-6xl animate-fade-up">{children}</div>
            </main>
          </div>
        </div>
      </MobileNavProvider>
    </ToastProvider>
  )
}
