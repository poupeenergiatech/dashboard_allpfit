-- Auditoria de login — toda tentativa de autenticação em /login (sucesso e falha),
-- pra dar visibilidade de quem entrou, quando, de onde, e detectar tentativas de acesso
-- indevido. Mesmo espírito de agregador_webhook_log / scans_webhook_log / alle_documentos_sync_log.
-- user_id fica nullable porque tentativas com email inexistente ou senha errada não têm
-- usuário resolvido; on delete set null preserva o registro mesmo se o usuário for apagado depois.
create table login_audit_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references users (id) on delete set null,
  email         text not null,
  status        text not null check (status in ('sucesso', 'erro')),
  ip_address    text,
  user_agent    text,
  error_message text,
  created_at    timestamptz not null default now()
);

create index login_audit_log_created_at_idx on login_audit_log (created_at desc);
create index login_audit_log_user_id_idx on login_audit_log (user_id);

comment on table login_audit_log is 'Histórico de tentativas de login (sucesso e falha) — ver logLoginAttempt em src/app/login/actions.ts.';
