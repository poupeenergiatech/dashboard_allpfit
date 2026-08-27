'use client'

import { useCallback, useEffect, useState, useTransition, type MouseEvent } from 'react'
import { deleteNotaFiscal, setNotaFiscalStatus, uploadNotaFiscal } from '@/app/(app)/financeiro/actions'
import { Icon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import {
  fetchNotaFiscalHistorico,
  type NotaFiscalHistoricoEntry,
} from '@/lib/dashboard/fetch-nota-fiscal-historico'
import {
  fetchNotasFiscais,
  type NotaFiscalEntry,
  type NotaFiscalStatus,
  type NotaFiscalTipo,
} from '@/lib/dashboard/fetch-notas-fiscais'
import type { Academia } from '@/lib/dashboard/types'

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

const MAX_SIZE_BYTES = 10 * 1024 * 1024

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} KB`
}

type UploadTarget = { mes: number; tipo: NotaFiscalTipo }

// Cor por tipo (não por status) — "unidade" e "individual" são categorias fixas,
// não um sinal de sucesso/erro, por isso não usam a paleta de status (emerald/amber
// de "presente/faltando" que já existia). Chip preenchido quando tem arquivo, chip
// tracejado "+ Tipo" pra quem pode anexar, texto simples pra quem só lê — inspirado
// no calendário de referência (chip colorido cheio por evento, dentro da célula do
// dia); aqui a célula é o mês, e os dois "eventos" possíveis são sempre os mesmos
// dois tipos, então o rótulo do chip é o tipo, não um título livre.
const CHIP_PALETTE = {
  blue: {
    filled: 'bg-blue-50 dark:bg-blue-500/10',
    label: 'text-blue-700 dark:text-blue-300',
    text: 'text-blue-900 dark:text-blue-100',
    dashed:
      'border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-500/30 dark:text-blue-300 dark:hover:bg-blue-500/10',
  },
  amber: {
    filled: 'bg-amber-50 dark:bg-amber-500/10',
    label: 'text-amber-700 dark:text-amber-300',
    text: 'text-amber-900 dark:text-amber-100',
    dashed:
      'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/10',
  },
} as const

const STATUS_LABEL: Record<NotaFiscalStatus, string> = {
  pendente: 'Pendente',
  validado: 'Validado',
  reprovado: 'Reprovado',
}

// Paleta própria (não CHIP_PALETTE, que é por tipo) — aqui a cor É o sinal de
// sucesso/erro que o comentário acima de CHIP_PALETTE explicitamente deixou de
// fora dali: validado (sucesso), pendente (neutro/aguardando), reprovado (erro,
// precisa de ação do gestor).
const STATUS_BADGE_CLASS: Record<NotaFiscalStatus, string> = {
  pendente: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400',
  validado: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  reprovado: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
}

function NotaFiscalChip({
  tipoLabel,
  color,
  entry,
  canManage,
  canViewHistorico,
  canValidate,
  onRequestUpload,
  onDeleted,
  onOpenHistorico,
  onOpenValidar,
}: {
  tipoLabel: string
  color: keyof typeof CHIP_PALETTE
  entry: NotaFiscalEntry | undefined
  canManage: boolean
  canViewHistorico: boolean
  canValidate: boolean
  onRequestUpload: () => void
  onDeleted: () => void
  onOpenHistorico: () => void
  onOpenValidar: () => void
}) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()
  const palette = CHIP_PALETTE[color]

  function handleDelete(event: MouseEvent) {
    event.preventDefault()
    if (!entry) return
    startTransition(async () => {
      try {
        await deleteNotaFiscal(entry.id)
        showToast(`Nota fiscal (${tipoLabel.toLowerCase()}) removida.`)
        onDeleted()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao remover PDF.', 'error')
      }
    })
  }

  function handleOpenValidar(event: MouseEvent) {
    event.preventDefault()
    onOpenValidar()
  }

  let main: React.ReactNode
  if (entry) {
    // Nota já validada só troca de arquivo excluindo antes (deleteNotaFiscal +
    // "+ Tipo" de novo) — protege um documento aprovado de sobrescrita casual, ver
    // mesma checagem espelhada no server em uploadNotaFiscal. Pendente/reprovado
    // ganham o botão de reenvio de 1 clique (reusa onRequestUpload, que já lida
    // com substituição via upsert).
    const podeReenviar = canManage && entry.status !== 'validado'
    main = (
      <a
        href={entry.arquivoUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`${entry.nomeArquivo} · ${formatBytes(entry.tamanhoBytes)}${entry.uploadedByEmail ? ` · ${entry.uploadedByEmail}` : ''}`}
        className={`group relative block rounded-lg px-2.5 py-1.5 ${canManage ? 'pr-12' : 'pr-2.5'} ${palette.filled}`}
      >
        <p className={`text-[10px] font-bold uppercase tracking-wide ${palette.label}`}>{tipoLabel}</p>
        <p className={`truncate text-xs font-medium ${palette.text}`}>{entry.nomeArquivo}</p>
        {canValidate ? (
          <button
            type="button"
            onClick={handleOpenValidar}
            title="Validar nota fiscal"
            className={`mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide transition hover:opacity-80 ${STATUS_BADGE_CLASS[entry.status]}`}
          >
            {STATUS_LABEL[entry.status]}
          </button>
        ) : (
          <span
            className={`mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${STATUS_BADGE_CLASS[entry.status]}`}
          >
            {STATUS_LABEL[entry.status]}
          </span>
        )}
        {canManage && (
          <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-70">
            {podeReenviar && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  onRequestUpload()
                }}
                title="Reenviar (substituir arquivo)"
                className="flex h-5 w-5 items-center justify-center rounded-md text-current hover:bg-black/5 dark:hover:bg-white/10"
              >
                <Icon name="upload" className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              title="Remover nota fiscal"
              className="flex h-5 w-5 items-center justify-center rounded-md text-current hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10"
            >
              <Icon name="x-circle" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </a>
    )
  } else if (canManage) {
    main = (
      <button
        type="button"
        onClick={onRequestUpload}
        className={`w-full rounded-lg border border-dashed px-2.5 py-1.5 text-left text-xs font-semibold transition ${palette.dashed}`}
      >
        + {tipoLabel}
      </button>
    )
  } else {
    main = (
      <div className="rounded-lg px-2.5 py-1.5 text-xs text-slate-400 dark:text-slate-500">
        {tipoLabel} — sem nota
      </div>
    )
  }

  // Direção/Super Admin (canViewHistorico) precisam do botão de histórico mesmo
  // quando não há arquivo atual — o arquivo pode ter existido e sido substituído/
  // removido, e é exatamente esse rastro que o histórico existe pra mostrar. Por
  // isso fica ao lado do chip (não sobreposto como o "x" de remover), sempre visível
  // independente de ter entry ou não.
  if (!canViewHistorico) return main

  return (
    <div className="flex items-stretch gap-1">
      <div className="min-w-0 flex-1">{main}</div>
      <button
        type="button"
        onClick={onOpenHistorico}
        title={`Ver histórico (${tipoLabel.toLowerCase()})`}
        className="flex shrink-0 items-center justify-center rounded-lg border border-slate-200 px-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      >
        <Icon name="clock" className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function NotaFiscalUploadModal({
  target,
  academiaId,
  ano,
  onClose,
  onUploaded,
}: {
  target: UploadTarget | null
  academiaId: string | null
  ano: number
  onClose: () => void
  onUploaded: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  // Zera o arquivo escolhido sempre que o alvo muda (fecha e reabre num outro
  // mês/tipo) — sem isso o modal reaproveitaria a seleção do slot anterior.
  useEffect(() => {
    setFile(null)
  }, [target])

  function pickFile(candidate: File | undefined) {
    if (!candidate) return
    if (candidate.type !== 'application/pdf') {
      showToast('Só arquivos PDF são aceitos.', 'error')
      return
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      showToast('Arquivo maior que 10MB.', 'error')
      return
    }
    setFile(candidate)
  }

  function handleSubmit() {
    if (!file || !target || !academiaId) return
    const formData = new FormData()
    formData.set('academia_id', academiaId)
    formData.set('tipo', target.tipo)
    formData.set('ano', String(ano))
    formData.set('mes', String(target.mes))
    formData.set('arquivo', file)

    startTransition(async () => {
      try {
        await uploadNotaFiscal(formData)
        showToast('Nota fiscal anexada.')
        onUploaded()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao anexar PDF.', 'error')
      }
    })
  }

  const label = target?.tipo === 'individual' ? 'Nota individual do gestor' : 'Nota da unidade'

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Anexar nota fiscal"
      subtitle={target ? `${MESES[target.mes - 1]} ${ano} · ${label}` : undefined}
    >
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          pickFile(event.dataTransfer.files?.[0])
        }}
        className={`rounded-xl border-2 border-dashed p-6 transition ${
          dragOver
            ? 'border-brand-400 bg-brand-50/60 dark:border-brand-500/50 dark:bg-brand-500/10'
            : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        {file ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Icon name="file" className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              title="Escolher outro arquivo"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label htmlFor="nota-fiscal-file-input" className="flex cursor-pointer flex-col items-center gap-2 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Icon name="upload" className="h-5 w-5" />
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-brand-600 dark:text-brand-300">Clique pra escolher</span> ou arraste o
              PDF aqui
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">PDF até 10MB</span>
          </label>
        )}
        <input
          id="nota-fiscal-file-input"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => pickFile(event.target.files?.[0])}
        />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-secondary btn-sm">
          Cancelar
        </button>
        <button type="button" onClick={handleSubmit} disabled={!file || pending} className="btn-primary btn-sm">
          {pending ? 'Enviando…' : 'Anexar'}
        </button>
      </div>
    </Modal>
  )
}

const ACAO_LABEL: Record<NotaFiscalHistoricoEntry['acao'], string> = {
  upload: 'Anexado',
  substituicao: 'Substituído',
  exclusao: 'Removido',
  status_validado: 'Validado',
  status_reprovado: 'Reprovado',
  status_pendente: 'Marcado como pendente',
}

const ACAO_BADGE_CLASS: Record<NotaFiscalHistoricoEntry['acao'], string> = {
  upload: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  substituicao: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  exclusao: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  status_validado: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  status_reprovado: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  status_pendente: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// Histórico de upload/substituição/exclusão de um slot (mês + tipo) específico —
// exclusivo de Direção/Super Admin (canViewNotasFiscaisHistorico, checado de novo
// no server em fetchNotaFiscalHistorico). Cada linha é um evento gravado no
// momento em que aconteceu (uploadNotaFiscal/deleteNotaFiscal em
// financeiro/actions.ts), não uma foto do estado atual — por isso reconstrói a
// sequência completa mesmo depois de várias trocas.
function NotaFiscalHistoricoModal({
  target,
  academiaId,
  ano,
  onClose,
}: {
  target: UploadTarget | null
  academiaId: string | null
  ano: number
  onClose: () => void
}) {
  const [entries, setEntries] = useState<NotaFiscalHistoricoEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!target || !academiaId) return
    let cancelled = false
    setLoading(true)
    fetchNotaFiscalHistorico(academiaId, target.tipo, ano, target.mes).then((next) => {
      if (cancelled) return
      setEntries(next)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [target, academiaId, ano])

  const label = target?.tipo === 'individual' ? 'Nota individual do gestor' : 'Nota da unidade'

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Histórico da nota fiscal"
      subtitle={target ? `${MESES[target.mes - 1]} ${ano} · ${label}` : undefined}
    >
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="card-dashed text-sm text-slate-500 dark:text-slate-400">
          Nenhum evento registrado pra esse mês/tipo ainda.
        </p>
      ) : (
        <ul className="max-h-96 space-y-2 overflow-y-auto">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${ACAO_BADGE_CLASS[entry.acao]}`}
                >
                  {ACAO_LABEL[entry.acao]}
                </span>
                <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>
              <p className="mt-1.5 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {entry.nomeArquivo} <span className="font-normal text-slate-400">· {formatBytes(entry.tamanhoBytes)}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{entry.performedByEmail}</p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

const STATUS_ACOES: { status: NotaFiscalStatus; label: string; className: string }[] = [
  {
    status: 'validado',
    label: 'Validar',
    className: 'btn bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 active:bg-emerald-800 btn-sm',
  },
  { status: 'reprovado', label: 'Reprovar', className: 'btn-danger btn-sm' },
  { status: 'pendente', label: 'Marcar como pendente', className: 'btn-secondary btn-sm' },
]

// Modal de validação — exclusivo de Direção/Super Admin (canValidateNotasFiscais,
// checado de novo em setNotaFiscalStatus). Aberto a partir do badge de status no
// chip (não inline, decisão explícita do usuário: um passo a mais evita clique
// acidental num botão que muda o status de um documento fiscal).
function NotaFiscalValidarModal({
  entry,
  onClose,
  onChanged,
}: {
  entry: NotaFiscalEntry | null
  onClose: () => void
  onChanged: () => void
}) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleSetStatus(status: NotaFiscalStatus) {
    if (!entry) return
    startTransition(async () => {
      try {
        await setNotaFiscalStatus(entry.id, status)
        showToast(`Nota fiscal marcada como ${STATUS_LABEL[status].toLowerCase()}.`)
        onChanged()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao validar nota fiscal.', 'error')
      }
    })
  }

  return (
    <Modal open={!!entry} onClose={onClose} title="Validar nota fiscal" subtitle={entry?.nomeArquivo}>
      {entry && (
        <>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 text-sm">
            <p className="text-slate-500 dark:text-slate-400">
              Status atual:{' '}
              <span
                className={`ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE_CLASS[entry.status]}`}
              >
                {STATUS_LABEL[entry.status]}
              </span>
            </p>
            {entry.uploadedByEmail && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Anexado por {entry.uploadedByEmail}</p>
            )}
            {entry.validatedByEmail && entry.validatedAt && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Última revisão de {entry.validatedByEmail} em {formatDateTime(entry.validatedAt)}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {STATUS_ACOES.filter((acao) => acao.status !== entry.status).map((acao) => (
              <button
                key={acao.status}
                type="button"
                onClick={() => handleSetStatus(acao.status)}
                disabled={pending}
                className={`${acao.className} disabled:opacity-50`}
              >
                {acao.label}
              </button>
            ))}
          </div>
        </>
      )}
    </Modal>
  )
}

// academiaId/onAcademiaChange são controlados pelo pai (financeiro-content.tsx) —
// o mesmo filtro de unidade usado nos cards/gráfico/tabela de valor mensal decide
// qual academia aparece aqui, e trocar a academia neste select também atualiza
// aquele filtro (mesmo estado, uma via só de verdade).
export function NotasFiscaisCalendar({
  academias,
  academiaId,
  onAcademiaChange,
  canManage,
  canViewHistorico,
  canValidate,
}: {
  academias: Academia[]
  academiaId: string | null
  onAcademiaChange: (id: string) => void
  canManage: boolean
  canViewHistorico: boolean
  canValidate: boolean
}) {
  const [ano, setAno] = useState(() => new Date().getFullYear())
  const [entries, setEntries] = useState<NotaFiscalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null)
  const [historicoTarget, setHistoricoTarget] = useState<UploadTarget | null>(null)
  const [validarTarget, setValidarTarget] = useState<NotaFiscalEntry | null>(null)

  const reload = useCallback(async () => {
    if (!academiaId) {
      setEntries([])
      setLoading(false)
      return
    }
    setLoading(true)
    const next = await fetchNotasFiscais(academiaId, ano)
    setEntries(next)
    setLoading(false)
  }, [academiaId, ano])

  useEffect(() => {
    reload()
  }, [reload])

  const entryFor = (mes: number, tipo: NotaFiscalTipo) =>
    entries.find((e) => e.competenciaMes === mes && e.tipo === tipo)

  const now = new Date()
  const anoAtual = now.getFullYear()
  const mesAtual = now.getMonth() + 1

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Notas fiscais</p>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Nota da unidade (CNPJ da academia) e nota individual do gestor, mês a mês.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {academias.length > 1 && (
            <select
              value={academiaId ?? ''}
              onChange={(e) => onAcademiaChange(e.target.value)}
              aria-label="Filtrar notas fiscais por academia"
              className="select h-9 w-56 py-1.5 text-sm"
            >
              {academias.map((academia) => (
                <option key={academia.id} value={academia.id}>
                  {academia.nome}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => setAno((a) => a - 1)} className="btn-secondary btn-sm">
              ‹ Anterior
            </button>
            <span className="min-w-[3.5rem] text-center text-lg font-extrabold tracking-tight text-slate-800 dark:text-white">
              {ano}
            </span>
            <button type="button" onClick={() => setAno((a) => a + 1)} className="btn-secondary btn-sm">
              Próximo ›
            </button>
          </div>
        </div>
      </div>

      {!academiaId ? (
        <p className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhuma academia disponível.</p>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 dark:border-slate-800 dark:bg-slate-800">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton h-[132px]" />
          ))}
        </div>
      ) : (
        // Uma única folha de calendário (não 12 cards soltos): o grid ganha
        // gap-px + fundo na cor da borda, cada célula cobre o próprio fundo por
        // cima — o "vão" de 1px vira a linha de grade compartilhada entre
        // células vizinhas, em qualquer contagem de colunas por breakpoint
        // (Tailwind divide-x/y não dá conta disso num grid com wrap).
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 dark:border-slate-800 dark:bg-slate-800">
          {MESES.map((nomeMes, idx) => {
            const mes = idx + 1
            const unidade = entryFor(mes, 'unidade')
            const individual = entryFor(mes, 'individual')
            const presentes = (unidade ? 1 : 0) + (individual ? 1 : 0)
            const isMesAtual = ano === anoAtual && mes === mesAtual

            return (
              <div
                key={mes}
                title={nomeMes}
                className={`p-2.5 ${isMesAtual ? 'bg-brand-50/70 dark:bg-brand-500/10' : 'bg-white dark:bg-slate-900'}`}
              >
                <div className="mb-2 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-base font-extrabold tracking-tight text-slate-800 dark:text-white">
                      {MESES_ABREV[idx]}
                    </p>
                    {isMesAtual && (
                      <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white dark:bg-brand-500">
                        Atual
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                    {presentes}/2
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <NotaFiscalChip
                    tipoLabel="Unidade"
                    color="blue"
                    entry={unidade}
                    canManage={canManage}
                    canViewHistorico={canViewHistorico}
                    canValidate={canValidate}
                    onRequestUpload={() => setUploadTarget({ mes, tipo: 'unidade' })}
                    onDeleted={reload}
                    onOpenHistorico={() => setHistoricoTarget({ mes, tipo: 'unidade' })}
                    onOpenValidar={() => unidade && setValidarTarget(unidade)}
                  />
                  <NotaFiscalChip
                    tipoLabel="Individual"
                    color="amber"
                    entry={individual}
                    canManage={canManage}
                    canViewHistorico={canViewHistorico}
                    canValidate={canValidate}
                    onRequestUpload={() => setUploadTarget({ mes, tipo: 'individual' })}
                    onDeleted={reload}
                    onOpenHistorico={() => setHistoricoTarget({ mes, tipo: 'individual' })}
                    onOpenValidar={() => individual && setValidarTarget(individual)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <NotaFiscalUploadModal
        target={uploadTarget}
        academiaId={academiaId}
        ano={ano}
        onClose={() => setUploadTarget(null)}
        onUploaded={() => {
          setUploadTarget(null)
          reload()
        }}
      />

      <NotaFiscalHistoricoModal
        target={historicoTarget}
        academiaId={academiaId}
        ano={ano}
        onClose={() => setHistoricoTarget(null)}
      />

      <NotaFiscalValidarModal
        entry={validarTarget}
        onClose={() => setValidarTarget(null)}
        onChanged={() => {
          setValidarTarget(null)
          reload()
        }}
      />
    </div>
  )
}
