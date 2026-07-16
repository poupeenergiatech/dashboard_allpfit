// Registro único de ícones (outline, 24x24, stroke currentColor) — antes cada
// componente (sidebar, funnel-grid, scans-summary-cards, tabelas expansíveis)
// definia sua própria cópia dos mesmos paths. Adicionar um ícone novo ou ajustar
// stroke-width agora é uma mudança num lugar só.
export type IconName =
  | 'chart'
  | 'bars'
  | 'pen'
  | 'chat'
  | 'badge'
  | 'users'
  | 'settings'
  | 'building'
  | 'qr'
  | 'trophy'
  | 'trend'
  | 'chevron-down'
  | 'menu'
  | 'close'
  | 'warning'
  | 'sun'
  | 'moon'

const PATHS: Record<IconName, React.ReactNode> = {
  chart: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 3v16a2 2 0 002 2h16M7 15l3.5-4.5 3 3L19 8"
    />
  ),
  bars: <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10m6 10V4m6 16v-7" />,
  pen: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5m-1.5-9.5a2.121 2.121 0 013 3L12 16l-4 1 1-4 9.5-9.5z"
    />
  ),
  chat: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
    />
  ),
  badge: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m5.5 2a9.5 9.5 0 11-19 0 9.5 9.5 0 0119 0z"
    />
  ),
  users: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8zm7 3a4 4 0 00-3-3.87"
    />
  ),
  settings: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  ),
  building: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 21V6a1 1 0 011-1h6a1 1 0 011 1v15m-8 0h16M12 10h7a1 1 0 011 1v10M8 7v.01M8 10v.01M8 13v.01M8 16v.01"
    />
  ),
  qr: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3m-3 3h6v-6h-3"
    />
  ),
  trophy: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 21h8m-4-4v4M7 4h10v4a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 3M17 6h3a3 3 0 01-3 3"
    />
  ),
  trend: <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v16a2 2 0 002 2h16M7 15l3.5-4.5 3 3L19 8" />,
  'chevron-down': <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />,
  menu: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />,
  close: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
  warning: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  sun: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1.5M12 19.5V21M4.219 4.219l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.219 19.781l1.06-1.06M18.72 5.28l1.06-1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
    />
  ),
  moon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
    />
  ),
}

export function Icon({
  name,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
      {PATHS[name]}
    </svg>
  )
}
