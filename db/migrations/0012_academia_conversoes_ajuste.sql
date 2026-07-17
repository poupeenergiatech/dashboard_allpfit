-- Correção manual do total de conversões de uma unidade, não presa a nenhum dia
-- (diferente de manual_data.conversoes_ajuste, que substitui a contagem automática
-- de um academia+dia específico). Mesmo raciocínio de 0010_academia_total_alunos:
-- um valor que vive na própria academia, cadastrado/editado em /academias.
-- Pode ser negativo (corrige um total inflado) ou positivo (soma conversões que a
-- reconciliação diária não capturou, ex.: o desalinhamento de data do sync do Alle
-- Documentos). Só é aplicado na visão "Todo período" de /performance — ver
-- fetch-academia-performance.ts.
alter table academias add column conversoes_ajuste_total integer not null default 0;

comment on column academias.conversoes_ajuste_total is 'Ajuste manual (positivo ou negativo) somado ao total de conversões da unidade em /performance, só na visão "Todo período" — não é presa a nenhum dia. Cadastrado/editado em /academias.';
