-- Liga/desliga se Direção e Gestor enxergam /financeiro (Super Admin sempre vê,
-- independente disso — é quem controla o toggle) — Super Admin liga/desliga em
-- /configuracoes (ver FinanceiroVisibilityToggle). Mesmo padrão de linha única de
-- conversao_status_settings (0023) e alle_documentos_sync_settings (0007). Ligada
-- (visível) por padrão, preservando o comportamento atual pra quem já usa
-- /financeiro.
create table financeiro_visibility_settings (
  id                     smallint primary key default 1 check (id = 1),
  visivel_outros_cargos  boolean not null default true,
  updated_at             timestamptz not null default now()
);

comment on table financeiro_visibility_settings is 'Configuração global (linha única): se /financeiro fica visível pra Direção e Gestor — Super Admin sempre vê, independente disso.';

insert into financeiro_visibility_settings (id) values (1) on conflict (id) do nothing;
