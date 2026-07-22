// Busca por nome (substring, case-insensitive) ou telefone (só dígitos, pra achar
// mesmo se o usuário digitar com formatação — "(11) 99123-4567" bate com
// "5511991234567").
export function matchesNomeOuTelefone(term: string, nome: string | null, telefone: string | null): boolean {
  const trimmed = term.trim()
  if (!trimmed) return true

  if (nome && nome.toLowerCase().includes(trimmed.toLowerCase())) return true

  const digits = trimmed.replace(/\D/g, '')
  if (digits && telefone && telefone.replace(/\D/g, '').includes(digits)) return true

  return false
}
