export function LogoutButton() {
  return (
    <form action="/auth/logout" method="post">
      <button type="submit" className="btn-ghost-danger btn-sm" title="Sair">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m6 14l5-5-5-5m5 5H9"
          />
        </svg>
        <span className="hidden sm:inline">Sair</span>
      </button>
    </form>
  )
}
