-- Prévia visual (thumbnail) de cada material — extraída automaticamente da URL
-- cadastrada no momento do cadastro (og:image da página, ou o thumbnail oficial do
-- YouTube quando aplicável, ver src/lib/dashboard/link-preview.ts). Fica nula quando
-- a extração falhou ou o site não expõe nenhuma imagem de prévia; o card cai pro
-- ícone genérico nesse caso (ver materiais-marketing-grid.tsx). Melhor esforço só —
-- nunca bloqueia o cadastro do material.
alter table materiais_marketing add column imagem_url text;
