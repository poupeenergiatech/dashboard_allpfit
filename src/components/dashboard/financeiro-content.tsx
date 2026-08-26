'use client'

import { useState } from 'react'
import { FinanceiroDetalhamentoUnidadeTable } from './financeiro-detalhamento-unidade-table'
import { FinanceiroValorMensalCards } from './financeiro-valor-mensal-cards'
import { FinanceiroValorMensalChart } from './financeiro-valor-mensal-chart'
import { FinanceiroValorMensalHistoricoTable } from './financeiro-valor-mensal-historico-table'
import { NotasFiscaisCalendar } from './notas-fiscais-calendar'
import type { ValorMensalUnidade } from '@/lib/dashboard/financeiro-valor-mensal'
import type { Academia } from '@/lib/dashboard/types'

// Um único filtro de unidade pra página /financeiro inteira: controla tanto a
// comparação Total x unidade (cards/gráfico/tabela) quanto a academia exibida no
// calendário de notas fiscais — antes cada bloco tinha o próprio <select>
// independente, então trocar a unidade num lugar não refletia nos outros
// (incluindo o calendário, que ficou de fora da primeira rodada dessa correção).
// O calendário sempre precisa de uma academia concreta (não existe "notas fiscais
// da unidade Total"), então quando o filtro está em "Total" ele cai pra
// academias[0] — mesmo fallback que o calendário já usava sozinho antes.
export function FinanceiroContent({
  valorMensalRows,
  academias,
  fixedAcademiaId,
  canManageNotasFiscais,
  isSuperAdmin,
}: {
  valorMensalRows: ValorMensalUnidade[]
  academias: Academia[]
  fixedAcademiaId: string | null
  canManageNotasFiscais: boolean
  // Detalhamento por unidade (com o "Ver clientes" pessoa a pessoa) é exclusivo de
  // Super Admin — ver listarClientesConvertidosDoMes em financeiro/actions.ts,
  // checado de novo lá no server, isso aqui é só pra não desenhar o painel à toa
  // pra quem nunca vai poder abrir o modal.
  isSuperAdmin: boolean
}) {
  const [unidadeId, setUnidadeId] = useState('')
  const academiaCalendario = fixedAcademiaId ?? (unidadeId || academias[0]?.id || null)

  return (
    <>
      <FinanceiroValorMensalCards rows={valorMensalRows} compararId={unidadeId} onCompararChange={setUnidadeId} />
      <FinanceiroValorMensalChart rows={valorMensalRows} compararId={unidadeId} />
      <FinanceiroValorMensalHistoricoTable rows={valorMensalRows} compararId={unidadeId} />
      {isSuperAdmin && <FinanceiroDetalhamentoUnidadeTable rows={valorMensalRows} />}
      <NotasFiscaisCalendar
        academias={academias}
        academiaId={academiaCalendario}
        onAcademiaChange={setUnidadeId}
        canManage={canManageNotasFiscais}
      />
    </>
  )
}
