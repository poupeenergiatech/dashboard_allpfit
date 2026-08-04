'use client'

import { useState, useTransition } from 'react'
import { createMaterial, deleteMaterial } from '@/app/(app)/central-marketing/actions'
import { Icon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import type { MaterialEntry } from '@/lib/dashboard/fetch-materiais-marketing'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function AddMaterialModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        await createMaterial(formData)
        showToast('Material cadastrado.')
        form.reset()
        onCreated()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao cadastrar material.', 'error')
      }
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar material" subtitle="O conteúdo fica hospedado fora do sistema — aqui só o link.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="material-titulo">
            Título
          </label>
          <input id="material-titulo" name="titulo" type="text" required maxLength={160} className="input" placeholder="Ex.: Como usar o painel de gestores" />
        </div>
        <div>
          <label className="field-label" htmlFor="material-url">
            Link
          </label>
          <input id="material-url" name="url" type="text" required className="input" placeholder="https://youtube.com/..." />
        </div>
        <div>
          <label className="field-label" htmlFor="material-descricao">
            Descrição <span className="font-normal text-slate-400 dark:text-slate-500">(opcional)</span>
          </label>
          <textarea id="material-descricao" name="descricao" rows={3} maxLength={500} className="input resize-none" />
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

function MaterialCard({ material, canManage }: { material: MaterialEntry; canManage: boolean }) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleDelete() {
    if (pending) return
    if (!window.confirm(`Excluir o material "${material.titulo}"?`)) return

    startTransition(async () => {
      try {
        await deleteMaterial(material.id)
        showToast('Material removido.')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao remover material.', 'error')
      }
    })
  }

  return (
    <div className="card-interactive group flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <Icon name="file" className="h-5 w-5" />
        </span>
        {canManage && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            title="Excluir material"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Icon name="x-circle" className="h-4 w-4" />
          </button>
        )}
      </div>

      <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">{material.titulo}</h3>
      {material.descricao && (
        <p className="mt-1 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">{material.descricao}</p>
      )}

      <div className="mt-4 flex flex-1 items-end justify-between gap-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {formatDate(material.createdAt)}
          {material.createdByEmail ? ` · ${material.createdByEmail}` : ''}
        </p>
        <a href={material.url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm shrink-0">
          Abrir
        </a>
      </div>
    </div>
  )
}

export function MateriaisGrid({ materiais, canManage }: { materiais: MaterialEntry[]; canManage: boolean }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
            + Adicionar material
          </button>
        </div>
      )}

      {materiais.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">
          {canManage ? 'Nenhum material cadastrado ainda — clique em "Adicionar material" pra publicar o primeiro.' : 'Nenhum material publicado ainda.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materiais.map((material) => (
            <MaterialCard key={material.id} material={material} canManage={canManage} />
          ))}
        </div>
      )}

      <AddMaterialModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => setModalOpen(false)} />
    </div>
  )
}
