-- Funções auxiliares para as policies de RLS.
--
-- security definer + search_path fixo faz a função rodar com o privilégio de quem a criou
-- (bypassando RLS de user_profiles), o que evita recursão infinita quando uma policy de
-- user_profiles (ou de qualquer outra tabela) precisa consultar a própria user_profiles
-- para saber o role/academia do usuário logado.
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.user_profiles where user_id = auth.uid();
$$;

create or replace function public.current_user_academia_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select academia_id from public.user_profiles where user_id = auth.uid();
$$;

create or replace function public.is_admin_or_gestor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_role() in ('super_admin', 'gestor');
$$;
