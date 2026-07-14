import { normalizeNome, normalizeNomeLoose } from './normalize-nome'

export type AcademiaNomeRow = { id: string; nome: string }
export type AcademiaAliasRow = { alias_nome: string; academia_id: string }

// Resolve texto livre de unidade (vindo de um sistema externo) pro id da academia
// cadastrada, em 3 passos: nome exato normalizado, nome sem acento/hífen (só se
// único — sem acento, cidades diferentes podem colidir), e por fim
// academia_aliases (vínculo manual feito pelo Super Admin). Compartilhado pelo
// sync do Alle Documentos e pelo webhook do agregador — os dois recebem nome de
// unidade em texto livre e precisam da mesma tolerância a formatação.
export function buildAcademiaNomeResolver(academias: AcademiaNomeRow[], aliases: AcademiaAliasRow[]) {
  const strictMap = new Map(academias.map((a) => [normalizeNome(a.nome), a.id]))
  for (const alias of aliases) strictMap.set(normalizeNome(alias.alias_nome), alias.academia_id)

  const looseMap = new Map<string, string | null>()
  for (const a of academias) {
    const key = normalizeNomeLoose(a.nome)
    looseMap.set(key, looseMap.has(key) ? null : a.id)
  }

  return function resolveAcademiaIdByNome(nome: string): string | undefined {
    const strict = strictMap.get(normalizeNome(nome))
    if (strict) return strict
    return looseMap.get(normalizeNomeLoose(nome)) ?? undefined
  }
}
