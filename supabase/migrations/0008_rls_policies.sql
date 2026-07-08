-- Sprint 2 — S2-08 a S2-11: RLS habilitada + policies por role
--
-- Regras (conforme documento de sprints):
--   super_admin / gestor   -> leem e escrevem em todas as academias
--   coordenador            -> lê e escreve apenas na própria academia
--   visualizador           -> lê apenas a própria academia, não pode inserir/atualizar
--   trained_academias      -> só super_admin/gestor podem alterar (mesmo coordenador só lê)
--   user_profiles          -> gestão de usuários é exclusiva de super_admin

alter table public.academias enable row level security;
alter table public.user_profiles enable row level security;
alter table public.manual_data enable row level security;
alter table public.pending_signatures enable row level security;
alter table public.trained_academias enable row level security;
alter table public.contacts enable row level security;
alter table public.conversions enable row level security;

-- academias --------------------------------------------------------------
drop policy if exists academias_select on public.academias;
create policy academias_select on public.academias
  for select to authenticated
  using (public.is_admin_or_gestor() or id = public.current_user_academia_id());

drop policy if exists academias_write on public.academias;
create policy academias_write on public.academias
  for all to authenticated
  using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

-- user_profiles ------------------------------------------------------------
drop policy if exists user_profiles_select on public.user_profiles;
create policy user_profiles_select on public.user_profiles
  for select to authenticated
  using (user_id = auth.uid() or public.current_user_role() = 'super_admin');

drop policy if exists user_profiles_write on public.user_profiles;
create policy user_profiles_write on public.user_profiles
  for all to authenticated
  using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

-- helper genérico para as tabelas operacionais escopadas por academia_id
-- (contacts, conversions, manual_data, pending_signatures): repetimos a
-- mesma forma de policy em cada tabela pois o RLS do Postgres não permite
-- compartilhar a definição entre tabelas diferentes.

-- contacts -------------------------------------------------------------
drop policy if exists contacts_select on public.contacts;
create policy contacts_select on public.contacts
  for select to authenticated
  using (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id());

drop policy if exists contacts_write on public.contacts;
create policy contacts_write on public.contacts
  for insert to authenticated
  with check (
    public.current_user_role() in ('super_admin', 'gestor', 'coordenador')
    and (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id())
  );

drop policy if exists contacts_update on public.contacts;
create policy contacts_update on public.contacts
  for update to authenticated
  using (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id())
  with check (
    public.current_user_role() in ('super_admin', 'gestor', 'coordenador')
    and (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id())
  );

-- conversions ------------------------------------------------------------
drop policy if exists conversions_select on public.conversions;
create policy conversions_select on public.conversions
  for select to authenticated
  using (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id());

drop policy if exists conversions_write on public.conversions;
create policy conversions_write on public.conversions
  for insert to authenticated
  with check (
    public.current_user_role() in ('super_admin', 'gestor', 'coordenador')
    and (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id())
  );

drop policy if exists conversions_update on public.conversions;
create policy conversions_update on public.conversions
  for update to authenticated
  using (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id())
  with check (
    public.current_user_role() in ('super_admin', 'gestor', 'coordenador')
    and (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id())
  );

-- manual_data --------------------------------------------------------------
drop policy if exists manual_data_select on public.manual_data;
create policy manual_data_select on public.manual_data
  for select to authenticated
  using (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id());

drop policy if exists manual_data_write on public.manual_data;
create policy manual_data_write on public.manual_data
  for insert to authenticated
  with check (
    public.current_user_role() in ('super_admin', 'gestor', 'coordenador')
    and (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id())
  );

drop policy if exists manual_data_update on public.manual_data;
create policy manual_data_update on public.manual_data
  for update to authenticated
  using (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id())
  with check (
    public.current_user_role() in ('super_admin', 'gestor', 'coordenador')
    and (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id())
  );

-- pending_signatures ---------------------------------------------------------
drop policy if exists pending_signatures_select on public.pending_signatures;
create policy pending_signatures_select on public.pending_signatures
  for select to authenticated
  using (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id());

drop policy if exists pending_signatures_write on public.pending_signatures;
create policy pending_signatures_write on public.pending_signatures
  for insert to authenticated
  with check (
    public.current_user_role() in ('super_admin', 'gestor', 'coordenador')
    and (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id())
  );

drop policy if exists pending_signatures_update on public.pending_signatures;
create policy pending_signatures_update on public.pending_signatures
  for update to authenticated
  using (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id())
  with check (
    public.current_user_role() in ('super_admin', 'gestor', 'coordenador')
    and (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id())
  );

-- trained_academias — só super_admin/gestor alteram (S4-10) ------------------
drop policy if exists trained_academias_select on public.trained_academias;
create policy trained_academias_select on public.trained_academias
  for select to authenticated
  using (public.is_admin_or_gestor() or academia_id = public.current_user_academia_id());

drop policy if exists trained_academias_write on public.trained_academias;
create policy trained_academias_write on public.trained_academias
  for all to authenticated
  using (public.is_admin_or_gestor())
  with check (public.is_admin_or_gestor());
