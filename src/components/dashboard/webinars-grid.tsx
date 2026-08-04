'use client'

import { useState, useTransition } from 'react'
import { createWebinar, deleteWebinar } from '@/app/(app)/webinar/actions'
import { Icon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import type { WebinarEntry } from '@/lib/dashboard/fetch-webinars'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function AddWebinarModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        await createWebinar(formData)
        showToast('Webinar cadastrado.')
        form.reset()
        onCreated()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao cadastrar webinar.', 'error')
      }
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar webinar" subtitle="O conteúdo fica hospedado fora do sistema — aqui só o link.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="webinar-titulo">
            Título
          </label>
          <input id="webinar-titulo" name="titulo" type="text" required maxLength={160} className="input" placeholder="Ex.: Como usar o painel de gestores" />
        </div>
        <div>
          <label className="field-label" htmlFor="webinar-url">
            Link
          </label>
          <input id="webinar-url" name="url" type="text" required className="input" placeholder="https://youtube.com/..." />
        </div>
        <div>
          <label className="field-label" htmlFor="webinar-descricao">
            Descrição <span className="font-normal text-slate-400 dark:text-slate-500">(opcional)</span>
          </label>
          <textarea id="webinar-descricao" name="descricao" rows={3} maxLength={500} className="input resize-none" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary btn-sm">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="btn-primary btn-sm">
            {pending ? 'Salvando…' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function WebinarCard({ webinar, canManage }: { webinar: WebinarEntry; canManage: boolean }) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleDelete() {
    if (pending) return
    if (!window.confirm(`Excluir o webinar "${webinar.titulo}"?`)) return

    startTransition(async () => {
      try {
        await deleteWebinar(webinar.id)
        showToast('Webinar removido.')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao remover webinar.', 'error')
      }
    })
  }

  return (
    <div className="card-interactive group flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <Icon name="play" className="h-5 w-5" />
        </span>
        {canManage && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            title="Excluir webinar"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Icon name="x-circle" className="h-4 w-4" />
          </button>
        )}
      </div>

      <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">{webinar.titulo}</h3>
      {webinar.descricao && (
        <p className="mt-1 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">{webinar.descricao}</p>
      )}

      <div className="mt-4 flex flex-1 items-end justify-between gap-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {formatDate(webinar.createdAt)}
          {webinar.createdByEmail ? ` · ${webinar.createdByEmail}` : ''}
        </p>
        <a href={webinar.url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm shrink-0">
          Assistir
        </a>
      </div>
    </div>
  )
}

export function WebinarsGrid({ webinars, canManage }: { webinars: WebinarEntry[]; canManage: boolean }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
            + Adicionar webinar
          </button>
        </div>
      )}

      {webinars.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">
          {canManage ? 'Nenhum webinar cadastrado ainda — clique em "Adicionar webinar" pra publicar o primeiro.' : 'Nenhum webinar publicado ainda.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {webinars.map((webinar) => (
            <WebinarCard key={webinar.id} webinar={webinar} canManage={canManage} />
          ))}
        </div>
      )}

      <AddWebinarModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => setModalOpen(false)} />
    </div>
  )
}
