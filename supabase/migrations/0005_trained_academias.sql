-- Sprint 2 — S2-05: quais academias já foram treinadas (toggle no dashboard)
create table if not exists public.trained_academias (
  academia_id uuid primary key references public.academias (id),
  treinada boolean not null default false,
  updated_at timestamptz not null default now()
);
