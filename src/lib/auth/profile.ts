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
  return role !== 'visualizador' && role !== 'direcao'
}

// Editar/reprovar/excluir e definir status (termo de adesão) em /convertidos —
// exclusivo de Super Admin. Direção enxerga tudo (ver seesAllAcademias) mas só
// em modo leitura: pedido explícito do usuário é que Direção nunca crie, edite
// ou exclua nada, em nenhuma área do sistema — ver também canManageTraining,
// canManagePendencias, canManageUserAccount, canManageAcademias,
// canManageClientesAlle, canManageNotasFiscais e canManageMateriaisMarketing,
// que seguem a mesma regra.
export function canManageManualData(role: UserRole): boolean {
  return role === 'super_admin'
}

// Marcar/desmarcar academia como treinada em /treinadas — exclusivo de Super
// Admin (ver nota em canManageManualData sobre Direção ser só leitura).
export function canManageTraining(role: UserRole): boolean {
  return role === 'super_admin'
}

// Lançar/editar pendências de assinatura (/pendentes) — exclusivo de Super
// Admin (ver nota em canManageManualData). Leitura do histórico continua
// liberada pra qualquer role. O reset em massa ("zona de risco") é mais
// restrito ainda, ver canManageConfiguracoes.
export function canManagePendencias(role: UserRole): boolean {
  return role === 'super_admin'
}

// Gate de VISUALIZAÇÃO das páginas /academias, /usuarios e /auditoria — Super
// Admin e Direção enxergam essas telas por inteiro. Escrita em cada uma delas é
// exclusiva de Super Admin: ver canManageAcademias (academias) e
// canManageUserAccount (usuarios); /auditoria é só leitura pra quem entra,
// não tem ação de escrita nenhuma.
export function canManageUsers(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao'
}

// Cadastrar/editar/ativar-desativar/excluir academias, vincular/remover nomes
// alternativos e importar CSV em /academias — exclusivo de Super Admin (ver
// nota em canManageManualData; canManageUsers acima continua liberando a
// visualização da página pra Direção).
export function canManageAcademias(role: UserRole): boolean {
  return role === 'super_admin'
}

// Cadastrar/editar/reprovar/excluir/importar (inclusive ações em massa) em
// /clientes-alle — exclusivo de Super Admin (ver nota em canManageManualData).
// A página em si é aberta pra qualquer role autenticada, sem gate; esta função
// controla só a escrita.
export function canManageClientesAlle(role: UserRole): boolean {
  return role === 'super_admin'
}

// Trava dentro de /usuarios: criar, editar, redefinir senha ou excluir QUALQUER
// conta — exclusivo de Super Admin (pedido explícito do usuário: Direção só
// visualiza a lista de usuários, nunca gerencia nenhuma conta, nem mesmo as que
// não são Super Admin).
export function canManageUserAccount(actorRole: UserRole): boolean {
  return actorRole === 'super_admin'
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
// de fora do alcance de coordenador (pedido explícito do usuário). Gate de
// VISUALIZAÇÃO só; escrita (anexar nota fiscal) é canManageNotasFiscais.
export function canAccessFinanceiro(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao' || role === 'gestor'
}

// Anexar/remover PDF de nota fiscal no calendário de /financeiro — Super Admin
// e Gestor. Direção enxerga o financeiro inteiro (canAccessFinanceiro) mas só
// em leitura, mesma regra de canManageManualData; Gestor mantém a escrita que
// já tinha, sem mudança.
export function canManageNotasFiscais(role: UserRole): boolean {
  return role === 'super_admin' || role === 'gestor'
}

// Cadastrar/remover material (aula, vídeo, marketing, treinamento, instrução) em
// /central-marketing — exclusivo de Super Admin (ver nota em
// canManageManualData; Gestor já ficava de fora antes). Leitura da lista
// continua aberta a qualquer role autenticada.
export function canManageMateriaisMarketing(role: UserRole): boolean {
  return role === 'super_admin'
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
