import type { UserRole } from '@/lib/auth/profile'
import type { IconName } from '@/components/ui/icons'

export type NavItem = { label: string; href: string; roles?: UserRole[]; icon: IconName }

// Fonte única da navegação — usada pela Sidebar (lista de links) e pelo Topbar
// (título dinâmico da seção atual), pra não ter duas listas que podem divergir.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Funil / Dashboard', href: '', icon: 'chart' },
  { label: 'Performance por Academia', href: '/performance', icon: 'bars' },
  { label: 'Scans QR', href: '/scans', icon: 'qr' },
  { label: 'Clientes Convertidos', href: '/convertidos', icon: 'trophy' },
  { label: 'Pendentes de Assinatura', href: '/pendentes', icon: 'pen' },
  { label: 'Números (WhatsApp)', href: '/numeros', icon: 'chat' },
  { label: 'Clientes Alle', href: '/clientes-alle', icon: 'id-card' },
  { label: 'Academias Treinadas', href: '/treinadas', icon: 'badge' },
  { label: 'Academias', href: '/academias', roles: ['super_admin'], icon: 'building' },
  { label: 'Usuários', href: '/usuarios', roles: ['super_admin'], icon: 'users' },
  { label: 'Configurações', href: '/configuracoes', roles: ['super_admin'], icon: 'settings' },
]
