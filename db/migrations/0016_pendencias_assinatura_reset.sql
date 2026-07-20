-- Migration de dados (sem mudança de schema): zera os lançamentos manuais de
-- pendencias_assinatura antes de /pendentes passar a somar também os clientes com
-- status 'pendente' em clientes_alle (ver fetch-pendencias-assinatura.ts). Sem
-- isso, o número manual antigo dobraria com a nova contagem por nome.
update pendencias_assinatura set quantidade = 0, updated_at = now() where quantidade != 0;
