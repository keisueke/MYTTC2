import React from 'react'
import { SubTask } from '../../types'

interface SubTaskFormProps {
  subTask?: SubTask
  parentTaskId: string
  onSubmit: (subTask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export default function SubTaskForm({ subTask, parentTaskId, onSubmit, onCancel }: SubTaskFormProps) {
  const [title, setTitle] = React.useState(subTask?.title || '')
  const [description, setDescription] = React.useState(subTask?.description || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    onSubmit({
      taskId: parentTaskId,
      title: title.trim(),
      description: description.trim() || undefined,
      order: subTask?.order,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card-industrial p-6 animate-scale-in">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
        <div>
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
            {subTask ? 'Edit SubTask' : 'New SubTask'}
          </p>
          <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
            {subTask ? '詳細タスクを編集' : '新しい詳細タスクを作成'}
          </h2>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            タイトル <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-industrial w-full"
            placeholder="詳細タスクのタイトルを入力"
            required
          />
        </div>

        <div>
          <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            説明
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-industrial w-full resize-none"
            placeholder="詳細タスクの説明を入力（任意）"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onCancel}
            className="btn-industrial"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="btn-industrial"
          >
            {subTask ? '更新' : '作成'}
          </button>
        </div>
      </div>
    </form>
  )
}

