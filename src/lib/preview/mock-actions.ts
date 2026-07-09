'use server'

// Ações fake usadas só pela rota /preview — simulam sucesso sem tocar no Supabase.
// Precisam ser Server Actions (não funções client comuns) porque são passadas como
// prop de Server Component (as páginas de /preview) pra Client Component. Os
// parâmetros das ações reais (FormData, id, academiaId...) são omitidos aqui de
// propósito — TS permite uma função com menos parâmetros satisfazer o tipo de uma
// com mais, e assim não sobra parâmetro sem uso pro lint reclamar.

export async function mockSave() {
  await new Promise((resolve) => setTimeout(resolve, 300))
}

export async function mockInvite() {
  await new Promise((resolve) => setTimeout(resolve, 300))
}

export async function mockConfirm() {
  await new Promise((resolve) => setTimeout(resolve, 300))
}

export async function mockToggle() {
  await new Promise((resolve) => setTimeout(resolve, 300))
}
