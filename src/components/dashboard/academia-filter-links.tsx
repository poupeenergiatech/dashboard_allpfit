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
}: {
  basePath: string
  academias: Academia[]
  academiaId: string | null
  paramName?: string
  extraParams?: Record<string, string>
}) {
  const router = useRouter()

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
    <div className="card p-4">
      <select
        value={academiaId ?? ''}
        onChange={(e) => router.push(hrefFor(e.target.value || null))}
        className="select w-full sm:w-64"
      >
        <option value="">Todas as academias</option>
        {academias.map((academia) => (
          <option key={academia.id} value={academia.id}>
            {academia.nome}
          </option>
        ))}
      </select>
    </div>
  )
}
