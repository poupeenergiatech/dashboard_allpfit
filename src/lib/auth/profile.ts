import { cache } from 'react'
import { pool } from '@/lib/db/pool'
import { getSessionUserId } from './session'

export type UserRole = 'super_admin' | 'direcao' | 'gestor' | 'coordenador' | 'visualizador'

export type UserProfile = {
  userId: string
  email: string | null
  role: UserRole
  academiaId: string | null
}

// null quando não há sessão válida (sem cookie, cookie expirado ou sessão revogada).
// Lança se a sessão existe mas não tem user_profiles correspondente (usuário criado
// mas nunca vinculado a uma role — ver gestão de usuários).
//
// Envolvida em React.cache() porque é chamada tanto no layout (app) quanto em cada
// página — sem isso seria uma query a mais por navegação.
export const getCurrentUserProfile = cache(async (): Promise<UserProfile | null> => {
  const userId = await getSessionUserId()
  if (!userId) return null

  const { rows } = await pool.query<{
    email: string
    role: UserRole | null
    academia_id: string | null
  }>(
    `select u.email, p.role, p.academia_id
     from users u
     left join user_profiles p on p.user_id = u.id
     where u.id = $1`,
    [userId]
  )

  const row = rows[0]
  if (!row) return null

  if (!row.role) {
    throw new Error(
      `Usuário ${row.email} autenticado mas sem user_profiles. Peça a um Super Admin para vinculá-lo a uma role.`
    )
  }

  return {
    userId,
    email: row.email,
    role: row.role,
    academiaId: row.academia_id,
  }
})

export function canWrite(role: UserRole): boolean {
  return role !== 'visualizador'
}

// Editar/reprovar/excluir e definir status (termo de adesão) em /convertidos —
// Super Admin e Direção (Gestor fica só com leitura, pedido explícito do usuário).
export function canManageManualData(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao'
}

// Marcar/desmarcar academia como treinada em /treinadas — Super Admin e Direção
// (Gestor fica só com leitura, pedido explícito do usuário).
export function canManageTraining(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao'
}

// Lançar/editar pendências de assinatura (/pendentes) — Super Admin e Direção.
// Leitura do histórico continua liberada pra qualquer role, mesmo padrão de
// canManageManualData. O reset em massa ("zona de risco") é mais restrito, ver
// canManageConfiguracoes.
export function canManagePendencias(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao'
}

// Gate geral de "administração de cadastro": /usuarios (ver também
// canManageUserAccount, que protege contas Super Admin dentro dessa tela),
// /academias, /auditoria e /clientes-alle. Direção tem o mesmo acesso que Super
// Admin nessas quatro áreas (pedido explícito do usuário).
export function canManageUsers(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao'
}

// Trava fina dentro de /usuarios: Direção pode ver, criar e editar qualquer
// conta, MENOS criar/promover/editar/excluir uma conta Super Admin — isso fica
// exclusivo de quem já é Super Admin (pedido explícito do usuário). `targetRole`
// é o role atual da conta sendo editada/excluída, ou o role sendo atribuído na
// criação/promoção; null (conta nova sem user_profiles) não tem restrição extra.
export function canManageUserAccount(actorRole: UserRole, targetRole: UserRole | null): boolean {
  if (actorRole === 'super_admin') return true
  if (actorRole === 'direcao') return targetRole !== 'super_admin'
  return false
}

// Configurações do sistema (/configuracoes: sync do Alle Documentos, webhooks,
// zona de risco) e ações de reset em massa equivalentes em outras páginas
// (resetPendencias em /pendentes) — fica restrito a Super Admin mesmo pra
// Direção, por serem ações destrutivas cobrindo todas as academias de uma vez.
export function canManageConfiguracoes(role: UserRole): boolean {
  return role === 'super_admin'
}

// Lançar dados manuais (scans/ajustes) em /performance e na seção equivalente do
// Dashboard (/) — decisão histórica de manter restrito a Super Admin, não
// incluída no pedido de acesso da Direção; revisar se fizer sentido alinhar com
// canManageManualData/canManagePendencias no futuro.
export function canLaunchManualScans(role: UserRole): boolean {
  return role === 'super_admin'
}

export function seesAllAcademias(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao' || role === 'gestor'
}

// Dashboard (/gestores, exibido como "Dashboard" no menu): resumo comparativo entre TODAS as unidades, feito
// pra gerar competição — inclui coordenador de propósito, diferente de
// seesAllAcademias, porque o objetivo ali é justamente deixar um coordenador ver como
// a própria unidade se compara às outras, não só a si mesmo. visualizador fica de
// fora (leitura já é ampla demais pra também ganhar um placar entre unidades).
export function canAccessPainelGestores(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao' || role === 'gestor' || role === 'coordenador'
}

// Financeiro: Super Admin, Direção e Gestor — dado sensível o bastante pra ficar
// de fora do alcance de coordenador (pedido explícito do usuário).
export function canAccessFinanceiro(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao' || role === 'gestor'
}

// Anexar/remover PDF de nota fiscal no calendário de /financeiro — mesmo escopo
// de canAccessFinanceiro menos coordenador (que só lê): Super Admin, Direção e
// Gestor.
export function canManageNotasFiscais(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao' || role === 'gestor'
}

// Cadastrar/remover link de webinar em /webinar — Super Admin e Direção (pedido
// explícito; Gestor fica de fora, mesmo padrão de canManageNotasFiscais não se
// aplica aqui). Leitura da lista continua aberta a qualquer role autenticada.
export function canManageWebinars(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao'
}

// Sem RLS, essa é a barreira real de escopo por academia — antes o Postgres do
// Supabase filtrava/rejeitava sozinho qualquer linha fora da academia do usuário; agora
// cada leitura/escrita que recebe um academiaId de fora (form, query param, argumento de
// client) precisa passar por aqui. Quem vê todas as academias mantém o valor pedido
// (ou null = "todas"); quem não vê, é forçado pra própria academia, ignorando o que foi
// pedido.
export function scopeAcademiaId(profile: UserProfile, requestedAcademiaId: string | null): string | null {
  if (seesAllAcademias(profile.role)) return requestedAcademiaId
  return profile.academiaId
}
