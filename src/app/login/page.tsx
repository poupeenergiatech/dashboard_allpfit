import Link from 'next/link'
import { login } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; sucesso?: string }
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-200/50 via-accent-100/40 to-transparent blur-3xl dark:from-brand-900/40 dark:via-accent-900/20" />
      </div>

      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- asset local pequeno e fixo, sem next/image em nenhum outro lugar do app */}
          <img src="/logo.png" alt="Dashboard Alle Energia" className="h-14 w-14" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard Alle Energia</h1>
          </div>
        </div>

        <div className="card p-8 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
          <form action={login} className="space-y-4">
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="voce@exemplo.com"
                className="input"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="field-label mb-0">
                  Senha
                </label>
                <Link
                  href="/esqueci-senha"
                  className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="input"
              />
            </div>

            {searchParams.error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {searchParams.error}
              </p>
            )}

            {searchParams.sucesso && (
              <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                {searchParams.sucesso}
              </p>
            )}

            <button type="submit" className="btn-primary w-full">
              Entrar
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">Dashboard Alle Energia</p>
      </div>
    </div>
  )
}
