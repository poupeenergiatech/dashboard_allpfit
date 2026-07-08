'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  // signInWithPassword só retorna { error } para falhas de auth (credenciais
  // inválidas etc). Falhas de rede/DNS ao contatar o Supabase lançam uma
  // exceção de verdade — sem o try/catch isso derrubava a página com um erro
  // não tratado em vez de mostrar uma mensagem amigável.
  let failed = false
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    failed = Boolean(error)
  } catch {
    failed = true
  }

  if (failed) {
    redirect(`/login?error=${encodeURIComponent('Não foi possível entrar. Verifique suas credenciais ou tente novamente.')}`)
  }

  redirect('/')
}
