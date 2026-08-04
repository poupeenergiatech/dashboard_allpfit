import type { UserRole } from '@/lib/auth/profile'
import type { IconName } from '@/components/ui/icons'

export type NavGroup = 'PRINCIPAL' | 'OPERAÇÃO' | 'GESTÃO' | 'SISTEMA'

export type NavItem = { label: string; href: string; roles?: UserRole[]; icon: IconName; hint?: string; group: NavGroup }

// Fonte única da navegação — usada pela Sidebar (lista de links, agrupada por
// `group`) e pelo Topbar (título dinâmico da seção atual), pra não ter duas
// listas que podem divergir.
//
// hint é só pra Convertidos/Pendentes/Clientes Alle: as três telas guardam a mesma
// pessoa em momentos diferentes da jornada (convertida -> pendente de assinar ->
// cliente Alle) e não é óbvio pra quem chega agora quando ir em qual — um tooltip
// curto (title nativo do link, ver Sidebar) resolve sem precisar de mais uma tela
// ou modal só pra explicar isso.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Funil / Dashboard', href: '', icon: 'chart', group: 'PRINCIPAL' },
  {
    label: 'Dashboard',
    href: '/gestores',
    roles: ['super_admin', 'direcao', 'gestor', 'coordenador'],
    icon: 'trend',
    hint: 'Resumo comparativo entre unidades — performance, scans, conversões e treinamento num só lugar.',
    group: 'PRINCIPAL',
  },
  { label: 'Performance por Academia', href: '/performance', icon: 'bars', group: 'PRINCIPAL' },
  { label: 'Central de Marketing', href: '/central-marketing', icon: 'file', group: 'PRINCIPAL' },
  { label: 'Scans QR', href: '/scans', icon: 'qr', group: 'OPERAÇÃO' },
  {
    label: 'Clientes Convertidos',
    href: '/convertidos',
    icon: 'trophy',
    hint: 'Todo mundo que converteu (pela Ane ou manual). Defina aqui o termo de adesão pra virar Cliente Alle.',
    group: 'OPERAÇÃO',
  },
  {
    label: 'Pendentes de Assinatura',
    href: '/pendentes',
    icon: 'pen',
    hint: 'Quem já converteu mas ainda não assinou o termo de adesão — o que falta pra virar Cliente Alle ativo.',
    group: 'OPERAÇÃO',
  },
  { label: 'Contatos por Unidade', href: '/numeros', icon: 'chat', group: 'OPERAÇÃO' },
  {
    label: 'Clientes Alle',
    href: '/clientes-alle',
    icon: 'id-card',
    hint: 'Cadastro de quem já é (ou foi) cliente Alle — ativo, pendente, reprovado etc. Alimenta o funil de conversão.',
    group: 'GESTÃO',
  },
  {
    label: 'Financeiro',
    href: '/financeiro',
    roles: ['super_admin', 'direcao', 'gestor'],
    icon: 'money',
    group: 'GESTÃO',
  },
  { label: 'Academias Treinadas', href: '/treinadas', icon: 'badge', group: 'GESTÃO' },
  { label: 'Academias', href: '/academias', roles: ['super_admin', 'direcao'], icon: 'building', group: 'GESTÃO' },
  { label: 'Usuários', href: '/usuarios', roles: ['super_admin', 'direcao'], icon: 'users', group: 'GESTÃO' },
  { label: 'Configurações', href: '/configuracoes', roles: ['super_admin'], icon: 'settings', group: 'SISTEMA' },
  {
    label: 'Auditoria de Login',
    href: '/auditoria',
    roles: ['super_admin', 'direcao'],
    icon: 'shield',
    hint: 'Histórico de tentativas de login — quem entrou, quando, de onde, e falhas de autenticação.',
    group: 'SISTEMA',
  },
]
