-- Contagem de clientes reprovados/que cancelaram o benefício, lançada manualmente
-- junto com o resto de manual_data (mesma linha academia_id/data). Diferente de
-- contatos_ajuste/conversoes_ajuste (que substituem uma contagem automática vinda
-- do agregador quando não nula), reprovados não tem nenhuma fonte automática — é
-- só um número aditivo, no mesmo padrão de total_scans.

alter table manual_data add column reprovados integer not null default 0;

comment on column manual_data.reprovados is 'Clientes reprovados/que cancelaram o benefício naquele dia, lançado manualmente — sem contagem automática pra substituir (diferente de contatos_ajuste/conversoes_ajuste).';
