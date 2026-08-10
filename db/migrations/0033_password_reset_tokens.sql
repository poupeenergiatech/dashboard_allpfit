-- Suporte a "esqueci minha senha" self-service no /login (antes só existia reset feito
-- por um Super Admin logado em /usuarios, ver resetUserPassword em
-- src/app/(app)/usuarios/actions.ts).
create table password_reset_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users (id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

comment on table password_reset_tokens is 'Token do link de "esqueci minha senha" enviado por email — id da linha É o token que vai na URL (mesmo padrão de sessions.id), de uso único (used_at) e expira em 1h (ver RESET_TOKEN_TTL_MS em src/app/esqueci-senha/actions.ts).';

create index password_reset_tokens_user_id_idx on password_reset_tokens (user_id);
