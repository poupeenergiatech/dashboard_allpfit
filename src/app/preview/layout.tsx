import { notFound } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { ToastProvider } from '@/components/ui/toast'
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
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="super_admin" basePath="/preview" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-center gap-1.5 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800 md:px-6">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Modo prévia — dados fictícios, nenhuma ação aqui é salva de verdade
          </div>
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 pl-16 pr-4 backdrop-blur-md md:px-6">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-900">Dashboard de Performance</h1>
              <p className="truncate text-xs text-slate-500">Allp Fit × Alle Energia (prévia)</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <div className="hidden items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                  P
                </span>
                <span className="text-sm text-slate-600">preview@allpfit.dev</span>
                <span className={`badge shrink-0 ${ROLE_BADGE_CLASS.super_admin}`}>{ROLE_LABEL.super_admin}</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">
            <div className="mx-auto w-full max-w-6xl animate-fade-up">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
