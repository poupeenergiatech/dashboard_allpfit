-- Telefone individual do contato (cliente), necessário para o relatório diário de novos
-- contatos enviado por webhook (ver /api/relatorio). Distinto de academias.numero_telefone,
-- que é o número da instância de WhatsApp da unidade, não do cliente.
--
-- Mesmo risco documentado na migration 0006: registros de `contacts` já existentes ficam
-- com telefone NULL até o agregador passar a enviar esse campo (ver PREMISSA em
-- src/app/api/agregador/route.ts).
alter table public.contacts
  add column if not exists telefone text;

comment on column public.contacts.telefone is 'Telefone WhatsApp do contato individual (cliente).';
