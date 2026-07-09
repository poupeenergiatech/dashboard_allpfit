-- Configuração do destino (webhook) do relatório diário de novos contatos.
-- Tabela singleton (sempre id = 1) — só existe uma URL de destino no sistema inteiro,
-- editável pelo Super Admin em /configuracoes. Consumida sem sessão de usuário pela rota de
-- sistema /api/relatorio (via service role), por isso não precisa de policy pra esse caso.
create table if not exists public.report_settings (
  id smallint primary key default 1 check (id = 1),
  webhook_url text,
  updated_at timestamptz not null default now()
);

comment on table public.report_settings is 'Configuração global (linha única) do webhook que recebe o relatório diário de novos contatos.';

insert into public.report_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.report_settings enable row level security;

drop policy if exists report_settings_select on public.report_settings;
create policy report_settings_select on public.report_settings
  for select to authenticated
  using (public.current_user_role() = 'super_admin');

drop policy if exists report_settings_write on public.report_settings;
create policy report_settings_write on public.report_settings
  for all to authenticated
  using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');
