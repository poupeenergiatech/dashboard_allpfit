-- Sprint 2 — S2-02: perfil e role de cada usuário
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('super_admin', 'gestor', 'coordenador', 'visualizador')),
  academia_id uuid references public.academias (id),
  created_at timestamptz not null default now()
);

comment on table public.user_profiles is 'Role e academia vinculada de cada usuário autenticado. super_admin/gestor enxergam todas as academias; coordenador/visualizador só a própria (academia_id).';

-- coordenador e visualizador precisam de uma academia_id definida
create index if not exists user_profiles_academia_id_idx on public.user_profiles (academia_id);
