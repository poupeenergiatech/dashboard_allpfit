-- Conteúdo de treinamentos/webinars, separado da Central de Marketing (conteúdo
-- diferente, mesma mecânica) — ambas as páginas agora vivem sob a categoria
-- "Marketing" no menu (ver src/lib/dashboard/nav-items.ts). Mesmo esquema de
-- materiais_marketing (0026_webinars.sql + 0030_materiais_marketing_imagem_preview.sql),
-- tabela própria porque o conteúdo cadastrado aqui é distinto do de
-- /central-marketing, não um filtro da mesma lista.
create table treinamentos_webinar (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  url         text not null,
  descricao   text,
  imagem_url  text,
  created_by  uuid references users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index treinamentos_webinar_created_at_idx on treinamentos_webinar (created_at desc);

comment on table treinamentos_webinar is 'Links externos de treinamento/webinar — ver canManageTreinamentosWebinar em src/lib/auth/profile.ts.';
