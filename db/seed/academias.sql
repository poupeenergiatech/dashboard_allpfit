-- Popula a tabela `academias` com as unidades Allp Fit.
--
-- Fica fora de db/migrations/ de propósito: não roda automaticamente no `migrate.mjs`.
-- Preencha as linhas abaixo (nome + número no formato que o agregador usa, ex.:
-- 5511999999999) e rode manualmente:
--   psql "$DATABASE_URL" -f db/seed/academias.sql
--
-- numero_telefone deve bater exatamente com o identificador que o agregador de números
-- envia — é a partir dele que /api/agregador e /api/webhooks/agregador resolvem a
-- academia_id de cada contato.

insert into academias (nome, numero_telefone, ativo) values
  ('Allp Fit - Unidade 01', '55XXXXXXXXXXX', true)
  -- , ('Allp Fit - Unidade 02', '55XXXXXXXXXXX', true)
  -- , ('Allp Fit - Unidade 03', '55XXXXXXXXXXX', true)
  -- ... completar com as demais unidades
on conflict do nothing;
