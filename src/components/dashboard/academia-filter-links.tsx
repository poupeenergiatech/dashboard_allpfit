'use client'

import { useRouter } from 'next/navigation'
import type { Academia } from '@/lib/dashboard/types'

// Filtro de academia via navegação (searchParams) em vez de estado no client — a
// página em si continua um Server Component que re-busca os dados com o novo
// `academiaId`; aqui só o <select> precisa de 'use client' pra chamar router.push.
// Dropdown em vez de uma linha de pills: com muitas academias, pills quebram em
// várias linhas e ficam poluídas — um select escala pra qualquer quantidade.
export function AcademiaFilterLinks({
  basePath,
  academias,
  academiaId,
  paramName = 'academia',
  extraParams = {},
  bare = false,
}: {
  basePath: string
  academias: Academia[]
  academiaId: string | null
  paramName?: string
  extraParams?: Record<string, string>
  // Só o <select>, sem o `.card` que o envolve — pra compor dentro de uma
  // barra de filtros maior (ver clientes-convertidos-table.tsx) em vez de
  // aparecer como seu próprio card empilhado.
  bare?: boolean
}) {
  const router = useRouter()

  // Gestor escopado a 1 unidade/visualizador só têm 1 academia visível — nesse caso não faz
  // sentido mostrar o filtro (mesma regra da FilterBar).
  if (academias.length <= 1) return null

  function hrefFor(id: string | null): string {
    const params = new URLSearchParams(extraParams)
    if (id) params.set(paramName, id)
    const query = params.toString()
    return query ? `${basePath}?${query}` : basePath
  }

  const select = (
    <select
      value={academiaId ?? ''}
      onChange={(e) => router.push(hrefFor(e.target.value || null))}
      aria-label="Filtrar por academia"
      className="select w-full sm:w-64"
    >
      <option value="">Todas as academias</option>
      {academias.map((academia) => (
        <option key={academia.id} value={academia.id}>
          {academia.nome}
        </option>
      ))}
    </select>
  )

  return bare ? select : <div className="card p-4">{select}</div>
}
