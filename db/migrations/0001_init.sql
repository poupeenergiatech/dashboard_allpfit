-- Schema inicial do Postgres próprio, substituindo o projeto Supabase (auth + dados).
-- Consolida as antigas migrations do Supabase (supabase/migrations/0001-0013), removendo
-- RLS/auth.uid()/funções security definer (não existem fora do Supabase — autorização por
-- role/academia agora é responsabilidade do código da aplicação, ver src/lib/auth/profile.ts)
-- e trocando a referência a auth.users por uma tabela users própria.

create extension if not exists pgcrypto;

-- users / sessions ---------------------------------------------------------
-- Substituem auth.users e o mecanismo de token do Supabase Auth.
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users (id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index sessions_user_id_idx on sessions (user_id);

-- academias -----------------------------------------------------------------
create table academias (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  numero_telefone  text,
  ativo            boolean not null default true,
  created_at       timestamptz not null default now()
);

comment on table academias is 'Unidades Allp Fit, cada uma com um número de WhatsApp vinculado no agregador.';

-- user_profiles ---------------------------------------------------------------
create table user_profiles (
  user_id      uuid primary key references users (id) on delete cascade,
  role         text not null check (role in ('super_admin', 'gestor', 'coordenador', 'visualizador')),
  academia_id  uuid references academias (id),
  created_at   timestamptz not null default now()
);

comment on table user_profiles is 'Role e academia vinculada de cada usuário. super_admin/gestor enxergam todas as academias; coordenador/visualizador só a própria (academia_id).';

create index user_profiles_academia_id_idx on user_profiles (academia_id);

-- manual_data -----------------------------------------------------------------
create table manual_data (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias (id),
  data          date not null,
  total_alunos  integer not null default 0,
  total_scans   integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (academia_id, data)
);

comment on table manual_data is 'Um registro por academia por dia — total de alunos e scans de QR code, lançado manualmente.';

create index manual_data_academia_data_idx on manual_data (academia_id, data);

-- pending_signatures -------------------------------------------------------------
create table pending_signatures (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  academia_id   uuid not null references academias (id),
  data_contato  date not null default current_date,
  assinado      boolean not null default false,
  assinado_em   timestamptz,
  created_at    timestamptz not null default now()
);

create index pending_signatures_academia_idx on pending_signatures (academia_id);
create index pending_signatures_pendentes_idx on pending_signatures (academia_id) where not assinado;

-- trained_academias ------------------------------------------------------------
create table trained_academias (
  academia_id  uuid primary key references academias (id),
  treinada     boolean not null default false,
  updated_at   timestamptz not null default now()
);

-- contacts / conversions --------------------------------------------------------
-- No Supabase essas tabelas já existiam antes das migrations (alimentadas pelo
-- agregador) — aqui são criadas do zero só com as colunas que o código usa.
create table contacts (
  id           uuid primary key default gen_random_uuid(),
  nome         text,
  telefone     text,
  academia_id  uuid references academias (id),
  created_at   timestamptz not null default now(),
  constraint contacts_academia_telefone_created_at_key unique (academia_id, telefone, created_at)
);

comment on column contacts.telefone is 'Telefone WhatsApp do contato individual (cliente) — distinto de academias.numero_telefone, que é o número da instância da unidade.';
comment on constraint contacts_academia_telefone_created_at_key on contacts is 'Suporta upsert idempotente em POST /api/webhooks/agregador — reenvio do mesmo lote não duplica. NULLs em telefone não conflitam entre si (risco aceito).';

create index contacts_academia_id_idx on contacts (academia_id);

create table conversions (
  id           uuid primary key default gen_random_uuid(),
  academia_id  uuid references academias (id),
  created_at   timestamptz not null default now()
);

create index conversions_academia_id_idx on conversions (academia_id);

-- report_settings ---------------------------------------------------------------
create table report_settings (
  id          smallint primary key default 1 check (id = 1),
  webhook_url text,
  updated_at  timestamptz not null default now()
);

comment on table report_settings is 'Configuração global (linha única) do webhook que recebe o relatório diário de novos contatos.';

insert into report_settings (id) values (1) on conflict (id) do nothing;

-- academia_performance ----------------------------------------------------------
-- View simples (sem security_invoker — RLS não existe mais). O filtro por role/academia
-- é aplicado pelo código que consome essa view, ver src/lib/dashboard/fetch-academia-performance.ts.
create view academia_performance as
select
  a.id as academia_id,
  a.nome,
  coalesce(c.total_contatos, 0) as total_contatos,
  coalesce(cv.total_conversoes, 0) as total_conversoes
from academias a
left join (
  select academia_id, count(*) as total_contatos
  from contacts
  group by academia_id
) c on c.academia_id = a.id
left join (
  select academia_id, count(*) as total_conversoes
  from conversions
  group by academia_id
) cv on cv.academia_id = a.id
where a.ativo = true;
