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
// exclusivo de Super Admin. Direção enxerga tudo (ver seesAllAcademias) mas só em
// modo leitura aqui: pedido explícito do usuário é que Direção não crie/edite/
// exclua nada nessa área — ver também canManageTraining, canManagePendencias,
// canManageAcademias, canManageClientesAlle, canManageNotasFiscais e
// canManageMateriaisMarketing, que seguem a mesma regra. Exceção: gestão de
// contas de usuário, onde Direção TEM escrita (menos em contas Super Admin) —
// ver canManageUserAccount, mais abaixo.
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

// Gate de VISUALIZAÇÃO das páginas /academias, /usuarios e /clientes-alle —
// Super Admin e Direção enxergam essas telas por inteiro. Escrita em cada uma
// é mais restrita: ver canManageAcademias (academias), canManageClientesAlle
// (clientes-alle) e canManageUserAccount (usuarios — única das três onde
// Direção também tem escrita, com a exceção de contas Super Admin). /auditoria
// usa canAccessAuditoria abaixo, não esta função (pedido explícito do
// usuário: log de login é exclusivo de Super Admin).
export function canManageUsers(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao'
}

// /auditoria (histórico de tentativas de login, sucesso e falha) — exclusivo
// de Super Admin. Direção tinha acesso de leitura antes (reaproveitava
// canManageUsers, como as outras telas de gestão); removido a pedido
// explícito do usuário, junto com /configuracoes que já era super_admin-only
// (ver canManageConfiguracoes).
export function canAccessAuditoria(role: UserRole): boolean {
  return role === 'super_admin'
}

// Cadastrar/editar/ativar-desativar/excluir academias, vincular/remover nomes
// alternativos e importar CSV em /academias — exclusivo de Super Admin (ver
// nota em canManageManualData; canManageUsers acima continua liberando a
// visualização da página pra Direção).
export function canManageAcademias(role: UserRole): boolean {
  return role === 'super_admin'
}

// Cadastrar/editar/reprovar/excluir/importar (inclusive ações em massa) em
// /clientes-alle — exclusivo de Super Admin (ver nota em canManageManualData). A
// página em si é restrita a Super Admin e Direção (ver canManageUsers em
// clientes-alle/page.tsx); esta função controla só a escrita dentro dela.
export function canManageClientesAlle(role: UserRole): boolean {
  return role === 'super_admin'
}

// Trava fina dentro de /usuarios: Direção pode criar, editar, redefinir senha e
// excluir qualquer conta, MENOS uma conta Super Admin — isso fica exclusivo de quem
// já é Super Admin (pedido explícito do usuário). `targetRole` é o role atual da
// conta sendo editada/excluída, ou o role sendo atribuído na criação/promoção; null
// (conta nova sem user_profiles) não tem restrição extra.
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

// Ver o histórico de eventos (upload/substituição/exclusão) de notas fiscais — só
// Direção e Super Admin, pedido explícito do usuário: Gestor já sabe o que fez (é
// quem manuseia os arquivos via canManageNotasFiscais), o histórico existe pra dar
// visibilidade de cima pra quem NÃO anexa/remove nada, não pra quem já mexe direto.
export function canViewNotasFiscaisHistorico(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao'
}

// Definir o status de revisão (Validado/Pendente/Reprovado) de uma nota fiscal já
// anexada — Super Admin e Direção, pedido explícito do usuário. Diferente de
// canManageNotasFiscais (que é sobre o ARQUIVO: anexar/reenviar/excluir, exclusivo
// de Super Admin/Gestor): aqui é sobre a REVISÃO do arquivo que já está lá, e é
// justamente Direção quem ganha esse poder de escrita em /financeiro (em todo o
// resto da página ela só lê).
export function canValidateNotasFiscais(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao'
}

// Cadastrar/remover material (aula, vídeo, marketing, treinamento, instrução) em
// /central-marketing — exclusivo de Super Admin (ver nota em
// canManageManualData; Gestor já ficava de fora antes). Leitura da lista
// continua aberta a qualquer role autenticada.
export function canManageMateriaisMarketing(role: UserRole): boolean {
  return role === 'super_admin'
}

// Mesma regra de canManageMateriaisMarketing, só que pra /treinamentos-webinar —
// conteúdo separado (tabela própria, treinamentos_webinar), mas mesma mecânica e
// mesma restrição de escrita. As duas páginas vivem juntas na categoria
// "Marketing" do menu (ver nav-items.ts).
export function canManageTreinamentosWebinar(role: UserRole): boolean {
  return role === 'super_admin'
}

// /pendentes: lista nominal (nome/telefone/academia), agrupada por unidade,
// dos clientes_alle com status 'pendente' — além dos números agregados que
// qualquer role já vê nessa página. Super Admin, Direção e Gestor (pedido
// explícito do usuário — Super Admin/Direção já tinham a mesma informação,
// com edição, em /clientes-alle, mas pediram essa visão agrupada aqui também
// por conveniência); Coordenador e Visualizador continuam só com os
// agregados. Sempre em modo leitura em /pendentes, mesmo pra quem teria
// canManageClientesAlle noutra tela — ver AlunosPendentesPorUnidade.
export function canViewAlunosPendentesList(role: UserRole): boolean {
  return role === 'super_admin' || role === 'direcao' || role === 'gestor'
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
