-- Novo cargo "Direção", entre Super Admin e Gestor na hierarquia (ver
-- src/lib/auth/profile.ts para o detalhe de cada permissão): enxerga todas as
-- academias como Super Admin/Gestor, gerencia usuários/academias/auditoria e as
-- ações operacionais hoje restritas a Super Admin (treinadas, convertidos,
-- pendências, clientes Alle, webinars), mas não acessa Configurações nem as
-- ações de "zona de risco" (reset de conversões/pendências, lançamento manual em
-- /performance), e não pode criar/editar/excluir uma conta Super Admin.
alter table user_profiles drop constraint user_profiles_role_check;
alter table user_profiles add constraint user_profiles_role_check
  check (role in ('super_admin', 'direcao', 'gestor', 'coordenador', 'visualizador'));

comment on table user_profiles is 'Role e academia vinculada de cada usuário. super_admin/direcao/gestor enxergam todas as academias; coordenador/visualizador só a própria (academia_id).';
