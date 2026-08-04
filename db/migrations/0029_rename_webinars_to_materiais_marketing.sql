-- Página /webinar virou /central-marketing: o escopo cresceu de só links de
-- webinar pra qualquer material de marketing (aula, vídeo, treinamento,
-- instrução). Renomeia a tabela em vez de recriar — já tinha ido pra produção
-- via migration 0026, então isso preserva os dados/histórico existentes.
alter table webinars rename to materiais_marketing;
alter index webinars_created_at_idx rename to materiais_marketing_created_at_idx;

comment on table materiais_marketing is 'Links externos de material de marketing/treinamento — ver canManageMateriaisMarketing em src/lib/auth/profile.ts.';
