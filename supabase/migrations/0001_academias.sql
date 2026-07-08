-- Sprint 2 — S2-01: tabela de unidades Allp Fit
create extension if not exists pgcrypto;

create table if not exists public.academias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  numero_telefone text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.academias is 'Unidades Allp Fit, cada uma com um número de WhatsApp vinculado no agregador.';
