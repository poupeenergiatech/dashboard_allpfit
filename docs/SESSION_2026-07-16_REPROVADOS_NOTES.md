# Sessão 2026-07-16 (continuação) — contagem de reprovados/cancelamentos do benefício

## Pedido

"adicionar também a contagem dos clientes que são reprovados/cancelaram o benefício,
esse dado será adicionado manualmente" — igual a `total_scans`, é um número aditivo
lançado à mão por academia/dia em `manual_data`, sem nenhuma fonte automática pra
"ajustar" (diferente de `contatos_ajuste`/`conversoes_ajuste`, que substituem uma
contagem automática do agregador quando não nulos — aqui não existe contagem
automática nenhuma).

Escopo decidido: **não** entra no `FunnelStagesChart` (o funil de conversão
Alunos→Scans→Contatos→Conversões é sequencial; reprovados é um desfecho paralelo aos
contatos, não uma próxima etapa). Entra como: (1) coluna nova em `manual_data`, (2)
campo novo no formulário de lançamento manual, (3) coluna nova no histórico de
lançamentos manuais, (4) card novo no `FunnelGrid` do dashboard (accent `rose`), (5)
coluna nova no histórico diário do funil (`FunnelDailyHistoryTable`). Não entra no
`FunnelTrendChart` (linha do tempo) nem em `/scans` — fora de escopo do pedido, dá pra
adicionar depois se pedirem.

## Já feito (código + banco)

1. **Migration aplicada** (`db/migrations/0011_manual_data_reprovados.sql`):
   `alter table manual_data add column reprovados integer not null default 0`. Já
   rodada no Postgres local (`node --env-file=.env.local scripts/migrate.mjs`) —
   confirmado `✓ 0011_manual_data_reprovados.sql`.

2. **`src/lib/dashboard/types.ts`**: `DailyFunnelPoint.reprovados: number` e
   `FunnelCounts.totalReprovados: number` adicionados.

3. **`src/lib/dashboard/fetch-manual-data-history.ts`**: `ManualDataEntry.reprovados:
   number`; query e mapeamento do `select`/`return` atualizados pra trazer
   `md.reprovados`.

4. **`src/app/(app)/performance/actions.ts`** (`saveManualData`): lê
   `formData.get('reprovados')` com `Number(... ?? 0)` (mesmo padrão de
   `total_scans`, não `parseOptionalInt` — não é nullable, é sempre um número, 0
   quando em branco). `insert ... on conflict do update` já inclui a coluna
   `reprovados`.

5. **`src/lib/dashboard/fetch-funnel-counts.ts`**: query de `manualRows` agora
   seleciona `reprovados`; acumulação aditiva `totalReprovados` (mesmo padrão de
   `totalScans`) e mapa `reprovadosPorDia`; `series` e o `return` final já incluem
   os dois campos novos.

## Falta fazer

Nesta ordem (cada item depende do tipo já estar pronto, que já está):

1. **`src/components/ui/icons.tsx`** — adicionar um ícone novo pro card (sugestão:
   `'x-circle'`, um círculo com X, tipo Heroicons outline
   `M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z`).

2. **`src/components/dashboard/funnel-grid.tsx`** — novo `<FunnelCard>` com
   `label="Reprovados / cancelados"`, `value={counts.totalReprovados}`,
   `icon={<Icon name="x-circle" .../>}`, `accent="rose"` (sem `conversionRate` — não
   é sequencial). Grid passa de `sm:grid-cols-2 lg:grid-cols-4` pra
   `sm:grid-cols-2 lg:grid-cols-5` pra caber os 5 cards numa linha só em telas
   grandes.

3. **`src/components/dashboard/manual-data-form.tsx`** — novo campo
   `reprovados` (`useState`, prefill no `useEffect` quando `existing` já tem
   lançamento pra aquela academia/dia — `setReprovados(String(existing.reprovados))`,
   sem checar null porque a coluna nunca é null). Input `type="number" min={0}` **não
   `required`** (fica em branco = 0, nem todo dia tem reprovado). Posição sugerida no
   grid: junto da 2ª linha do form, ao lado de "Ajuste de contatos"/"Ajuste de
   conversões" (que já somam `lg:col-span-2 + lg:col-span-2 = 4` de 5 colunas do
   grid `lg:grid-cols-5` — o campo de reprovados cabe sem `colSpan`, ocupando a 5ª
   coluna que sobra, sem precisar mexer nos outros `colSpan`). Atualizar o texto de
   ajuda no rodapé do form pra explicar que reprovados não é um "ajuste" (soma, não
   substitui).

4. **`src/components/dashboard/manual-data-history-table.tsx`** — nova coluna
   "Reprovados" (sugestão: texto colorido `text-rose-600 dark:text-rose-400
   font-semibold` quando `> 0`, cinza `text-slate-300 dark:text-slate-600` mostrando
   `0` quando zero — não é badge/pill como os `_ajuste`, é só um número direto tipo
   "Scans"). Posição sugerida: logo depois da coluna "Scans".

5. **`src/components/dashboard/funnel-daily-history-table.tsx`** — nova coluna
   "Reprovados" no cabeçalho e nas linhas (`{point.reprovados}`), ajustar
   `min-w-[520px]` pra algo maior (~600px) e o `colSpan` da linha de breakdown
   expandida de `5` pra `6` (mais uma coluna agora).

6. **`src/lib/preview/mock-data.ts`** — dados fictícios de `/preview` (a rota
   `/preview` roda sem login/Postgres, então o TS só vai apontar erro de tipo aqui
   se os mocks não tiverem o campo novo):
   - `MOCK_FUNNEL_SERIES`: adicionar `reprovados: ...` em cada ponto (número
     pequeno, plausível, ex. `Math.round(1 + Math.sin(i / 3))`).
   - `MOCK_FUNNEL_COUNTS`: adicionar `totalReprovados` (soma da série ou fixo tipo
     `18`).
   - `MOCK_MANUAL_DATA_HISTORY`: adicionar `reprovados: number` em cada entrada
     (ex.: `2` e `0`).

7. **Rodar `npx tsc --noEmit`** — vai apontar exatamente todo lugar que ainda falta
   preencher os campos novos dos tipos (bom checklist de conferência antes de
   seguir pro build).

8. **`npm run build`** e depois teste visual (dev server + Playwright, mesmo
   esquema da sessão anterior de dark mode) — conferir especificamente:
   - `/` (dashboard): novo card aparece, grid de 5 não quebra em telas médias.
   - `/performance`: form de lançamento manual com o campo novo, salvar e ver
     refletido no histórico.
   - `/preview` e `/preview/performance`: mocks batendo com os tipos.
   - Claro e escuro (o projeto já tem dark mode implementado — toggle no Topbar).

9. Depois de tudo verificado: **não commitar/dar push sem o usuário pedir de novo**
   (pedido explícito da vez anterior foi só pra aquele commit de design/dark mode;
   esta é uma tarefa nova).

## Estado do git no momento desta nota

```
 M src/app/(app)/performance/actions.ts
 M src/lib/dashboard/fetch-funnel-counts.ts
 M src/lib/dashboard/fetch-manual-data-history.ts
 M src/lib/dashboard/types.ts
?? db/migrations/0011_manual_data_reprovados.sql
```

(A migration já foi aplicada no Postgres local mesmo estando `??` no git — rodar
`scripts/migrate.mjs` de novo é seguro, ele pula migrations já aplicadas.)
