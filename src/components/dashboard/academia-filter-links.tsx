import Link from 'next/link'
import type { Academia } from '@/lib/dashboard/types'

// Filtro de academia via navegação simples (Server Component, sem JS no client) —
// pra páginas sem polling que só precisam re-renderizar com o novo `searchParams`,
// diferente da FilterBar client-side usada em / (que tem estado local + live polling).
export function AcademiaFilterLinks({
  basePath,
  academias,
  academiaId,
  paramName = 'academia',
  extraParams = {},
}: {
  basePath: string
  academias: Academia[]
  academiaId: string | null
  paramName?: string
  extraParams?: Record<string, string>
}) {
  // Coordenador/visualizador só têm 1 academia visível — nesse caso não faz
  // sentido mostrar o filtro (mesma regra da FilterBar).
  if (academias.length <= 1) return null

  function hrefFor(id: string | null): string {
    const params = new URLSearchParams(extraParams)
    if (id) params.set(paramName, id)
    const query = params.toString()
    return query ? `${basePath}?${query}` : basePath
  }

  return (
    <div className="card flex flex-wrap gap-2 p-4">
      <FilterTab href={hrefFor(null)} active={academiaId === null}>
        Todas
      </FilterTab>
      {academias.map((academia) => (
        <FilterTab key={academia.id} href={hrefFor(academia.id)} active={academiaId === academia.id}>
          {academia.nome}
        </FilterTab>
      ))}
    </div>
  )
}

function FilterTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active
          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </Link>
  )
}
