-- Sprint 4 — S4-01: view agregada para a tabela de performance por academia.
--
-- security_invoker faz a view rodar com o privilégio de quem a consulta (não de quem a
-- criou), então a RLS de academias/contacts/conversions continua sendo respeitada — um
-- coordenador que consultar essa view só vê a própria academia, sem precisar duplicar a
-- lógica de role aqui.
create or replace view public.academia_performance
with (security_invoker = true) as
select
  a.id as academia_id,
  a.nome,
  coalesce(c.total_contatos, 0) as total_contatos,
  coalesce(cv.total_conversoes, 0) as total_conversoes
from public.academias a
left join (
  select academia_id, count(*) as total_contatos
  from public.contacts
  group by academia_id
) c on c.academia_id = a.id
left join (
  select academia_id, count(*) as total_conversoes
  from public.conversions
  group by academia_id
) cv on cv.academia_id = a.id
where a.ativo = true;

grant select on public.academia_performance to authenticated;
