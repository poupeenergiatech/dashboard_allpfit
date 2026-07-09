-- Suporte a upsert idempotente em POST /api/webhooks/agregador: se o mesmo lote diário for
-- reenviado (retry de rede do lado do agregador, por exemplo), não deve duplicar contatos.
--
-- NULLs em `telefone` não conflitam entre si no Postgres — um contato sem telefone ainda pode
-- duplicar em reenvios. Risco aceito: o agregador é a fonte da verdade e reprocessamento do
-- mesmo lote é raro; documentado aqui para não surpreender ninguém.
alter table public.contacts
  add constraint contacts_academia_telefone_created_at_key
  unique (academia_id, telefone, created_at);
