-- Histórico de mudanças de status de clientes_alle, com a data exata de cada
-- mudança — pedido do usuário pra sustentar uma nova regra em /financeiro: só
-- conta como conversão quem tiver virado 'ativo' NAQUELE mês (não mais "quando o
-- registro entrou no sistema", que era a base do cálculo até aqui). Sem isso não
-- tinha como saber quando um cliente específico passou a ser ativo — só
-- created_at (data de CADASTRO, não de ativação) e updated_at (qualquer edição,
-- não só status).
create table clientes_alle_status_history (
  id              uuid primary key default gen_random_uuid(),
  cliente_alle_id uuid not null references clientes_alle (id) on delete cascade,
  status          text not null,
  changed_at      timestamptz not null default now()
);

create index clientes_alle_status_history_cliente_id_idx on clientes_alle_status_history (cliente_alle_id);
-- Índice principal de leitura: "quem virou 'ativo' pela 1ª vez em tal mês" é um
-- min(changed_at) filtrado por status — ver fetch-financeiro-valor-mensal.ts e
-- fetch-clientes-convertidos-mes.ts.
create index clientes_alle_status_history_status_changed_at_idx on clientes_alle_status_history (status, changed_at);

comment on table clientes_alle_status_history is 'Uma linha por mudança de status de clientes_alle (inclusive o status inicial no cadastro), com a data exata em que passou a valer — usado por /financeiro pra contar conversão só no mês em que o cliente virou "ativo" pela primeira vez.';

-- Trigger em vez de gravar isso em cada actions.ts: clientes_alle já tem 6 pontos
-- de escrita de status espalhados em 2 arquivos (createClienteAlle,
-- updateClienteAlle, reprovarClienteAlle, importClientesAlleCsv,
-- bulkUpdateClientesAlleStatus em clientes-alle/actions.ts,
-- definirStatusClienteConvertido em convertidos/actions.ts) — exatamente o tipo
-- de duplicação que já causou um bug real nessa tabela antes (telefone fantasma,
-- migration 0034: um dos pontos de escrita esqueceu de propagar uma mudança pro
-- lugar certo). Um trigger garante que NENHUM ponto de escrita — presente ou
-- futuro, inclusive um UPDATE direto via SQL/migration — escapa do histórico,
-- sem depender de todo mundo lembrar de chamar alguma função auxiliar.
create function record_clientes_alle_status_history() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into clientes_alle_status_history (cliente_alle_id, status, changed_at) values (new.id, new.status, now());
  end if;
  return new;
end;
$$;

create trigger clientes_alle_status_history_trigger
  after insert or update on clientes_alle
  for each row execute function record_clientes_alle_status_history();

-- Backfill pra quem já existia antes desse deploy (o trigger acima só grava daqui
-- pra frente): sem uma máquina do tempo, updated_at é a melhor aproximação
-- disponível de "quando esse status passou a valer" — decisão explícita do
-- usuário. created_at seria pior (é a data de CADASTRO, não da mudança de
-- status; um cliente cadastrado em janeiro e promovido a ativo só em julho
-- teria created_at de janeiro, mês errado pro cálculo). Fica registrado como
-- aproximação, pode estar errado se o cliente foi editado por outro motivo
-- (nome/telefone) depois de ativar sem trocar o status de novo — mas é só o
-- backfill único deste deploy; todo histórico novo a partir daqui é exato
-- (gravado pelo trigger no momento real da mudança).
insert into clientes_alle_status_history (cliente_alle_id, status, changed_at)
select id, status, updated_at from clientes_alle;
