-- Sprint 2 — S2-04: clientes pendentes de assinatura do termo
create table if not exists public.pending_signatures (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  academia_id uuid not null references public.academias (id),
  data_contato date not null default current_date,
  assinado boolean not null default false,
  assinado_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists pending_signatures_academia_idx on public.pending_signatures (academia_id);
create index if not exists pending_signatures_pendentes_idx on public.pending_signatures (academia_id) where not assinado;
