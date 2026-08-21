-- Repara o desvio entre conversions e o clientes_alle vinculado (conversions.cliente_alle_id,
-- ver migration 0019 e definirStatusClienteConvertido em convertidos/actions.ts): editar
-- academia/nome/telefone de um cliente Alle já vinculado (via /clientes-alle ou, desde a
-- sessão que passou a permitir isso, via /convertidos) sempre atualizou só clientes_alle,
-- nunca a linha de conversions que aponta pra ele — updateClienteAlle e
-- updateClienteConvertidoAcademia foram corrigidas agora pra propagar a edição pras duas
-- tabelas, mas isso não conserta quem já ficou dessincronizado antes dessa correção.
--
-- Efeito prático do bug: conversions.telefone (o valor antigo, pré-edição) parava de
-- aparecer em qualquer tela (fetchClientesConvertidos já mostra o telefone novo, vindo do
-- clientes_alle vinculado — ver fetch-clientes-convertidos.ts), mas continuava "ocupando"
-- esse número antigo pro cheque de duplicado em createClienteAlle/importClientesAlleCsv
-- (clientes-alle/actions.ts, que leem direto de conversions.telefone) — um telefone
-- fantasma, invisível em qualquer busca, bloqueando o cadastro de um cliente novo com esse
-- número.
update conversions c
set academia_id = ca.academia_id,
    nome = ca.nome,
    telefone = ca.telefone
from clientes_alle ca
where ca.id = c.cliente_alle_id
  and (
    c.academia_id is distinct from ca.academia_id
    or c.nome is distinct from ca.nome
    or c.telefone is distinct from ca.telefone
  );
