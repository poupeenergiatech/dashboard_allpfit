-- total_alunos passa a viver na própria academia (cadastrado uma vez, editado em
-- /academias) em vez de precisar de um lançamento novo em manual_data todo dia — o
-- funil (fetch-funnel-counts.ts) somava sempre o valor mais recente em manual_data
-- como se fosse um "snapshot", mas o webhook de scans insere uma linha nova por dia só
-- com total_scans, e o total_alunos dessa linha nova caía no default 0, zerando o
-- total exibido até alguém relançar manualmente.
alter table academias add column total_alunos integer not null default 0;

comment on column academias.total_alunos is 'Total de alunos matriculados na unidade — cadastrado/editado em /academias, fonte única pro funil. Não muda por lançamento diário.';

-- Backfill a partir do último lançamento manual com total_alunos > 0 (ignora linhas
-- criadas automaticamente pelo webhook de scans, que nunca preenchia essa coluna e
-- ficava com o default 0).
update academias a
set total_alunos = md.total_alunos
from (
  select distinct on (academia_id) academia_id, total_alunos
  from manual_data
  where total_alunos > 0
  order by academia_id, data desc
) md
where md.academia_id = a.id;

comment on column manual_data.total_alunos is 'Retirado de uso — total de alunos agora é academias.total_alunos. Coluna mantida só como histórico dos lançamentos manuais anteriores a essa migration.';
