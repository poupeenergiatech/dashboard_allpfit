// Ponto de entrada oficial do Next.js pra rodar código uma vez quando o servidor
// sobe (não por request) — usado só pra ligar o scheduler do sync automático diário
// do Alle Documentos (ver sync-scheduler.ts). Precisa de
// `experimental.instrumentationHook: true` no next.config.mjs nesta versão do Next.
//
// NEXT_RUNTIME === 'nodejs' evita rodar isso (e puxar o pool do pg, que é Node-only)
// durante a compilação do runtime Edge — este projeto não usa Edge além do
// middleware de auth, mas o guard é o padrão recomendado e não custa nada.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startAutoSyncScheduler } = await import('@/lib/dashboard/sync-scheduler')
    startAutoSyncScheduler()
  }
}
