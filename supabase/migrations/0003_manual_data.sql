-- Sprint 2 — S2-03: alunos totais e scans QR, inseridos manualmente no dashboard
create table if not exists public.manual_data (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  data date not null,
  total_alunos integer not null default 0,
  total_scans integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academia_id, data)
);

comment on table public.manual_data is 'Um registro por academia por dia — total de alunos e scans de QR, sem API disponível.';

create index if not exists manual_data_academia_data_idx on public.manual_data (academia_id, data);
