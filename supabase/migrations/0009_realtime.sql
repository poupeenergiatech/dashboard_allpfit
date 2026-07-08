-- Sprint 2 — S2-12: habilita Realtime (WAL replication) nas tabelas que o
-- dashboard escuta via subscription (Sprint 3: funil ao vivo).
--
-- Guardado com DO blocks porque `alter publication ... add table` dá erro se
-- a tabela já for membro da publication (ex.: contacts/conversions podem já
-- estar publicadas, já que o Supabase citado no documento "já está
-- configurado com dados de contatos e conversões").
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'contacts'
  ) then
    alter publication supabase_realtime add table public.contacts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversions'
  ) then
    alter publication supabase_realtime add table public.conversions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'manual_data'
  ) then
    alter publication supabase_realtime add table public.manual_data;
  end if;
end $$;
