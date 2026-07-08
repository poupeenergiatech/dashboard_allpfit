-- Sprint 2 — S2-13: popular a tabela `academias` com as 31 unidades Allp Fit.
--
-- Este arquivo fica fora de supabase/migrations/ de propósito: não temos a lista real
-- de unidades e números de WhatsApp vinculados, então ele NÃO deve rodar automaticamente
-- num `db push`. Preencha as 31 linhas abaixo (nome + número no formato que o agregador
-- usa, ex.: 5511999999999) e rode manualmente no SQL Editor do Supabase, ou via:
--   psql "$DATABASE_URL" -f supabase/seed/academias.sql
--
-- numero_telefone deve bater exatamente com o identificador que o agregador de números
-- envia, pois é a partir dele que o backfill de academia_id em contacts/conversions
-- (ver 0006_contacts_conversions_academia_id.sql) vai mapear os contatos existentes.

insert into public.academias (nome, numero_telefone, ativo) values
  ('Allp Fit - Unidade 01', '55XXXXXXXXXXX', true)
  -- , ('Allp Fit - Unidade 02', '55XXXXXXXXXXX', true)
  -- , ('Allp Fit - Unidade 03', '55XXXXXXXXXXX', true)
  -- ... completar até a unidade 31
on conflict do nothing;
