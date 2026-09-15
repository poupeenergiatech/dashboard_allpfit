-- Funde a role "coordenador" em "gestor" (pedido explícito do usuário) e torna
-- academia_id obrigatório pra gestor: não existe mais um "gestor pleno" que
-- enxerga todas as unidades, todo gestor fica escopado à própria academia, igual
-- já era pra coordenador/visualizador. O que muda de fato pra quem já era
-- coordenador é só o nome da role; academia_id é mantido como estava.
update user_profiles set role = 'gestor' where role = 'coordenador';

-- Gestor passa a exigir academia_id (mesma regra de visualizador) — se alguma
-- conta gestor já existente não tiver uma vinculada, essa migration para aqui até
-- alguém corrigir manualmente (update user_profiles set academia_id = '<id>'
-- where user_id = '<id>'), em vez de deixar a conta num estado que a aplicação
-- não sabe mais representar.
do $$
declare
  sem_academia int;
begin
  select count(*) into sem_academia from user_profiles where role = 'gestor' and academia_id is null;
  if sem_academia > 0 then
    raise exception 'Existem % conta(s) de gestor sem academia_id. Vincule uma academia a cada uma antes de aplicar essa migration (role Gestor agora exige academia obrigatória).', sem_academia;
  end if;
end $$;

alter table user_profiles drop constraint user_profiles_role_check;
alter table user_profiles add constraint user_profiles_role_check
  check (role in ('super_admin', 'direcao', 'gestor', 'visualizador'));

comment on table user_profiles is 'Role e academia vinculada de cada usuário. super_admin/direcao enxergam todas as academias; gestor e visualizador exigem academia_id (obrigatório) e só enxergam a própria.';
