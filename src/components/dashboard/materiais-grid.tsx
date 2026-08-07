'use client'

import { useState, useTransition } from 'react'
import { createMaterial, deleteMaterial, updateMaterial } from '@/app/(app)/central-marketing/actions'
import { Icon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import type { MaterialEntry } from '@/lib/dashboard/types'

type CreateAction = (formData: FormData) => Promise<void>
type UpdateAction = (id: string, formData: FormData) => Promise<void>
type DeleteAction = (id: string) => Promise<void>

// null = modal fechado, 'create' = form vazio, MaterialEntry = editando essa
// linha (form pré-preenchido). Um estado só pro MateriaisGrid controlar,
// porque só um modal por vez faz sentido aqui.
type ModalState = 'closed' | 'create' | MaterialEntry

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

// Formulário de "Adicionar material"/"Editar material" — mesmos três campos
// nos dois modos, só muda o texto do modal/botão, o valor inicial dos campos e
// pra qual action o FormData vai. Modal desmonta ao fechar (ver Modal), então
// trocar de editingMaterial entre aberturas não precisa de key: cada abertura
// já é um mount novo com defaultValue certo.
function MaterialFormModal({
  open,
  editingMaterial,
  onClose,
  onSaved,
  onCreate,
  onUpdate,
}: {
  open: boolean
  editingMaterial: MaterialEntry | null
  onClose: () => void
  onSaved: () => void
  onCreate: CreateAction
  onUpdate: UpdateAction
}) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()
  const isEdit = !!editingMaterial

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        if (editingMaterial) {
          await onUpdate(editingMaterial.id, formData)
          showToast('Material atualizado.')
        } else {
          await onCreate(formData)
          showToast('Material cadastrado.')
          form.reset()
        }
        onSaved()
      } catch (err) {
        showToast(err instanceof Error ? err.message : `Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} material.`, 'error')
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar material' : 'Adicionar material'}
      subtitle="O conteúdo fica hospedado fora do sistema — aqui só o link."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="material-titulo">
            Título
          </label>
          <input
            id="material-titulo"
            name="titulo"
            type="text"
            required
            maxLength={160}
            defaultValue={editingMaterial?.titulo}
            className="input"
            placeholder="Ex.: Como usar o painel de gestores"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="material-url">
            Link
          </label>
          <input
            id="material-url"
            name="url"
            type="text"
            required
            defaultValue={editingMaterial?.url}
            className="input"
            placeholder="https://youtube.com/..."
          />
        </div>
        <div>
          <label className="field-label" htmlFor="material-descricao">
            Descrição <span className="font-normal text-slate-400 dark:text-slate-500">(opcional)</span>
          </label>
          <textarea
            id="material-descricao"
            name="descricao"
            rows={3}
            maxLength={500}
            defaultValue={editingMaterial?.descricao ?? ''}
            className="input resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary btn-sm">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="btn-primary btn-sm">
            {pending ? 'Salvando…' : isEdit ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function MaterialCard({
  material,
  canManage,
  onEdit,
  onDelete,
}: {
  material: MaterialEntry
  canManage: boolean
  onEdit: (material: MaterialEntry) => void
  onDelete: DeleteAction
}) {
  const [pending, startTransition] = useTransition()
  const [imageFailed, setImageFailed] = useState(false)
  const { showToast } = useToast()

  function handleDelete() {
    if (pending) return
    if (!window.confirm(`Excluir o material "${material.titulo}"?`)) return

    startTransition(async () => {
      try {
        await onDelete(material.id)
        showToast('Material removido.')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao remover material.', 'error')
      }
    })
  }

  const showImage = !!material.imagemUrl && !imageFailed

  return (
    <div className="card-interactive group flex flex-col overflow-hidden">
      {/* aspect-video pra todo card ficar com a mesma altura de banner, tenha
          imagem de prévia extraída (ver link-preview.ts) ou não — sem isso, cards
          com e sem imagem ficariam com alturas bem diferentes lado a lado na grid. */}
      <div className="relative aspect-video w-full shrink-0 bg-brand-50 dark:bg-brand-500/10">
        {showImage ? (
          // Imagem vem de host externo arbitrário (og:image de qualquer site,
          // thumbnail do YouTube) — não dá pra passar por next/image sem abrir a
          // otimização pra qualquer domínio.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={material.imagemUrl!}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon name="file" className="h-9 w-9 text-brand-300 dark:text-brand-500/40" />
          </div>
        )}

        {canManage && (
          <div className="absolute right-2 top-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(material)}
              title="Editar material"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <Icon name="pen" className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              title="Excluir material"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              <Icon name="x-circle" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{material.titulo}</h3>
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
    </div>
  )
}

// Reaproveitado por /central-marketing e /treinamentos-webinar — duas tabelas de
// conteúdo separadas (ver fetch-materiais-marketing.ts e
// fetch-treinamentos-webinar.ts), mesma UI. onCreate/onUpdate/onDelete tomam os
// defaults de central-marketing/actions.ts pra manter esse call site sem
// mudança; treinamentos-webinar/page.tsx passa as próprias actions
// explicitamente.
export function MateriaisGrid({
  materiais,
  canManage,
  onCreate = createMaterial,
  onUpdate = updateMaterial,
  onDelete = deleteMaterial,
}: {
  materiais: MaterialEntry[]
  canManage: boolean
  onCreate?: CreateAction
  onUpdate?: UpdateAction
  onDelete?: DeleteAction
}) {
  const [modalState, setModalState] = useState<ModalState>('closed')

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button type="button" onClick={() => setModalState('create')} className="btn-primary">
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
            <MaterialCard
              key={material.id}
              material={material}
              canManage={canManage}
              onEdit={setModalState}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <MaterialFormModal
        open={modalState !== 'closed'}
        editingMaterial={modalState === 'closed' || modalState === 'create' ? null : modalState}
        onClose={() => setModalState('closed')}
        onSaved={() => setModalState('closed')}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </div>
  )
}
