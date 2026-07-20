-- Separa as conversões automáticas da Ane (conversions, sync Alle Documentos/Supabase) das
-- conversões de origem manual/Bitrix24. manual_data.conversoes_ajuste era um override nullable
-- que substituía a contagem automática do dia; agora vira um número sempre presente (aditivo),
-- representando conversões manuais que se somam à automática, sem substituí-la.
alter table manual_data rename column conversoes_ajuste to conversoes_manual;
update manual_data set conversoes_manual = 0 where conversoes_manual is null;
alter table manual_data alter column conversoes_manual set default 0;
alter table manual_data alter column conversoes_manual set not null;

comment on column manual_data.conversoes_manual is 'Conversões de origem manual/Bitrix24 (não-Ane), lançadas por dia — aditivo, soma ao total; não substitui a contagem automática de conversions (essa é só a Ane).';

-- academias.conversoes_ajuste_total: mesmo repurpose, nível academia (aplicado só na visão
-- "Todo período" de /performance, mesmo padrão de total_alunos).
alter table academias rename column conversoes_ajuste_total to conversoes_manual_ajuste_total;

comment on column academias.conversoes_manual_ajuste_total is 'Total histórico de conversões manuais/Bitrix24 anteriores ao lançamento diário por academia — somado só na visão "Todo período". Cadastrado/editado em /academias.';
