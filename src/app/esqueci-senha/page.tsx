import Link from 'next/link'
import { requestPasswordReset } from './actions'

export default function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: { enviado?: string }
}) {
  const enviado = searchParams.enviado === '1'

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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Esqueci minha senha</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Informe seu email de acesso e enviaremos um link para redefinir sua senha.
            </p>
          </div>
        </div>

        <div className="card p-8 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
          {enviado ? (
            <div className="space-y-4 text-center">
              <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                Se esse email estiver cadastrado, você vai receber um link de redefinição em instantes. Confira
                também a caixa de spam.
              </p>
              <Link href="/login" className="btn-secondary w-full">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form action={requestPasswordReset} className="space-y-4">
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

              <button type="submit" className="btn-primary w-full">
                Enviar link de redefinição
              </button>

              <Link
                href="/login"
                className="block text-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Voltar para o login
              </Link>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">Dashboard Alle Energia</p>
      </div>
    </div>
  )
}
