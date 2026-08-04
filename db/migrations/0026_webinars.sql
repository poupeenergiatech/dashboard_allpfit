-- Links externos de webinar/conteúdo, cadastrados por Super Admin em /webinar e
-- visíveis (leitura) pra qualquer role autenticada — ver
-- src/app/(app)/webinar/actions.ts e src/components/dashboard/webinars-grid.tsx.
-- O conteúdo em si vive fora do sistema (YouTube, Drive etc.), aqui só o link.
create table webinars (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  url         text not null,
  descricao   text,
  created_by  uuid references users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index webinars_created_at_idx on webinars (created_at desc);

comment on table webinars is 'Links externos de conteúdo de webinar, cadastrados por Super Admin — ver canManageWebinars em src/lib/auth/profile.ts.';
