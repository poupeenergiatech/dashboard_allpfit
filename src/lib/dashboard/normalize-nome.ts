// Normaliza nomes de unidade pra comparação entre sistemas que não compartilham
// convenção de formatação (cadastro manual, CSV, Alle Documentos). NFC resolve
// acentos vindos decompostos (é = "e" + acento combinante) que passariam batido só
// com trim/lowercase mas exibem igual; \s+ cobre espaço duplo/tab de copiar-colar
// de planilha.
export function normalizeNome(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()
}

// Fallback pra quando o nome estrito não bate: ignora acento (Ilhéus ~ Ilheus) e
// hífen/travessão de separador de sufixo (João Pessoa - PB ~ João Pessoa   PB).
// Só usar como segunda tentativa, e apenas quando o resultado for único — sem
// acento, nomes de cidades diferentes podem colidir.
export function normalizeNomeLoose(value: string): string {
  return normalizeNome(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
