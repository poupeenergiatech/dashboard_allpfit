-- PDFs de nota fiscal anexados por mês em /financeiro (ver
-- src/components/dashboard/notas-fiscais-calendar.tsx e
-- src/app/(app)/financeiro/actions.ts). O arquivo em si fica num bucket S3
-- (ver src/lib/storage/s3.ts) — aqui só o metadado e a URL pública.
--
-- Duas notas por academia/mês (tipo): "unidade" (nota fiscal da própria
-- academia/CNPJ) e "individual" (nota do gestor responsável, recorrente,
-- pessoa física) — ver decisão registrada na conversa que criou esta
-- migration. unique(academia_id, tipo, competencia_ano, competencia_mes)
-- garante no máximo 1 arquivo por combinação; reanexar substitui (upsert em
-- uploadNotaFiscal), não duplica.
create table notas_fiscais (
  id               uuid primary key default gen_random_uuid(),
  academia_id      uuid not null references academias (id),
  tipo             text not null check (tipo in ('unidade', 'individual')),
  competencia_ano  smallint not null,
  competencia_mes  smallint not null check (competencia_mes between 1 and 12),
  arquivo_url      text not null,
  nome_arquivo     text not null,
  tamanho_bytes    integer not null,
  uploaded_by      uuid not null references users (id),
  created_at       timestamptz not null default now(),
  unique (academia_id, tipo, competencia_ano, competencia_mes)
);

create index notas_fiscais_academia_competencia_idx on notas_fiscais (academia_id, competencia_ano, competencia_mes);

comment on table notas_fiscais is 'PDF de nota fiscal por academia/mês/tipo (unidade ou individual do gestor) — arquivo em bucket S3, aqui só a URL e o metadado.';
comment on column notas_fiscais.tipo is '"unidade" = nota fiscal da academia (CNPJ); "individual" = nota do gestor responsável, recorrente (pessoa física).';
