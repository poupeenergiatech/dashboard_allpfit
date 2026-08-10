import Link from 'next/link'
import { isValidResetToken } from '@/lib/auth/password-reset-token'
import { resetPasswordWithToken } from './actions'

// Server Component: valida o token contra o banco já no carregamento (existe, não foi
// usado, não expirou) — assim visitar a URL direto com um token forjado ou expirado
// mostra o estado de "link inválido" de cara, sem precisar passar pelo formulário e
// levar um erro só depois do submit.
export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: { token?: string; error?: string }
}) {
  const token = searchParams.token ?? ''
  const tokenInvalido = !(await isValidResetToken(token))

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-200/50 via-accent-100/40 to-transparent blur-3xl dark:from-brand-900/40 dark:via-accent-900/20" />
      </div>

      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- mesmo padrão do /login, asset local pequeno e fixo */}
          <img src="/logo.png" alt="Dashboard Alle Energia" className="h-14 w-14" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Redefinir senha</h1>
          </div>
        </div>

        <div className="card p-8 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
          {tokenInvalido ? (
            <div className="space-y-4 text-center">
              <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                Esse link de redefinição é inválido ou já expirou. Solicite um novo.
              </p>
              <Link href="/esqueci-senha" className="btn-primary w-full">
                Solicitar novo link
              </Link>
            </div>
          ) : (
            <form action={resetPasswordWithToken} className="space-y-4">
              <input type="hidden" name="token" value={token} />

              <div>
                <label htmlFor="password" className="field-label">
                  Nova senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="field-label">
                  Confirmar nova senha
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="input"
                />
              </div>

              {searchParams.error && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  {searchParams.error}
                </p>
              )}

              <button type="submit" className="btn-primary w-full">
                Redefinir senha
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">Dashboard Alle Energia</p>
      </div>
    </div>
  )
}
