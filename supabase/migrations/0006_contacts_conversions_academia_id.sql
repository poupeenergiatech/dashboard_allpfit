-- Sprint 2 — S2-06/S2-07: garantir academia_id em contacts e conversions (tabelas já existentes)
--
-- ATENÇÃO (risco "Alto" no documento de sprints): se essas tabelas já tiverem dados sem
-- academia_id preenchido, o ALTER abaixo cria a coluna mas os registros antigos ficam com
-- academia_id NULL — eles não vão aparecer para coordenador/visualizador (RLS por academia)
-- nem em nenhum filtro por unidade. É necessário rodar um UPDATE de backfill mapeando o
-- número de telefone/instância de cada contato para a academia correta ANTES de seguir para
-- a Sprint 3. Esse mapeamento não pode ser inferido aqui — precisa ser validado com a equipe
-- que administra o agregador de números.
alter table public.contacts
  add column if not exists academia_id uuid references public.academias (id);

alter table public.conversions
  add column if not exists academia_id uuid references public.academias (id);

create index if not exists contacts_academia_id_idx on public.contacts (academia_id);
create index if not exists conversions_academia_id_idx on public.conversions (academia_id);

-- Exemplo de backfill (ajustar de acordo com a coluna real que identifica o número/instância
-- em `contacts`, ex.: `numero_whatsapp` ou `instance_id`):
--
-- update public.contacts c
-- set academia_id = a.id
-- from public.academias a
-- where c.academia_id is null
--   and c.numero_whatsapp = a.numero_telefone;
