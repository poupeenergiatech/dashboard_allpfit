import type { UserRole } from '@/lib/auth/profile'
import type { IconName } from '@/components/ui/icons'

export type NavItem = { label: string; href: string; roles?: UserRole[]; icon: IconName; hint?: string }

// Fonte única da navegação — usada pela Sidebar (lista de links) e pelo Topbar
// (título dinâmico da seção atual), pra não ter duas listas que podem divergir.
//
// hint é só pra Convertidos/Pendentes/Clientes Alle: as três telas guardam a mesma
// pessoa em momentos diferentes da jornada (convertida -> pendente de assinar ->
// cliente Alle) e não é óbvio pra quem chega agora quando ir em qual — um tooltip
// curto (title nativo do link, ver Sidebar) resolve sem precisar de mais uma tela
// ou modal só pra explicar isso.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Funil / Dashboard', href: '', icon: 'chart' },
  { label: 'Performance por Academia', href: '/performance', icon: 'bars' },
  { label: 'Scans QR', href: '/scans', icon: 'qr' },
  {
    label: 'Clientes Convertidos',
    href: '/convertidos',
    icon: 'trophy',
    hint: 'Todo mundo que converteu (pela Ane ou manual). Defina aqui o termo de adesão pra virar Cliente Alle.',
  },
  {
    label: 'Pendentes de Assinatura',
    href: '/pendentes',
    icon: 'pen',
    hint: 'Quem já converteu mas ainda não assinou o termo de adesão — o que falta pra virar Cliente Alle ativo.',
  },
  { label: 'Números (WhatsApp)', href: '/numeros', icon: 'chat' },
  {
    label: 'Clientes Alle',
    href: '/clientes-alle',
    icon: 'id-card',
    hint: 'Cadastro de quem já é (ou foi) cliente Alle — ativo, pendente, reprovado etc. Alimenta o funil de conversão.',
  },
  { label: 'Academias Treinadas', href: '/treinadas', icon: 'badge' },
  { label: 'Academias', href: '/academias', roles: ['super_admin'], icon: 'building' },
  { label: 'Usuários', href: '/usuarios', roles: ['super_admin'], icon: 'users' },
  { label: 'Configurações', href: '/configuracoes', roles: ['super_admin'], icon: 'settings' },
]
