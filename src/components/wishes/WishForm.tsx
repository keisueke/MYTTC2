import { useState } from 'react'
import { Wish, Project, Mode, Tag } from '../../types'

interface WishFormProps {
  wish?: Wish
  projects: Project[]
  modes: Mode[]
  tags: Tag[]
  onSubmit: (wish: Omit<Wish, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export default function WishForm({ wish, projects, modes, tags, onSubmit, onCancel }: WishFormProps) {
  const [title, setTitle] = useState(wish?.title || '')
  const [description, setDescription] = useState(wish?.description || '')
  const [projectId, setProjectId] = useState(wish?.projectId || '')
  const [modeId, setModeId] = useState(wish?.modeId || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(wish?.tagIds || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      projectId: projectId || undefined,
      modeId: modeId || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    })
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="wish-title" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          タイトル <span className="text-[var(--color-error)]">*</span>
        </label>
        <input
          id="wish-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-industrial w-full"
          placeholder="やりたいことのタイトルを入力"
          required
        />
      </div>

      <div>
        <label htmlFor="wish-description" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          説明
        </label>
        <textarea
          id="wish-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input-industrial w-full resize-none"
          placeholder="詳細な説明を入力（任意）"
        />
      </div>

      <div>
        <label htmlFor="wish-project" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          プロジェクト
        </label>
        <select
          id="wish-project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="input-industrial w-full"
        >
          <option value="">選択しない</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="wish-mode" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          モード
        </label>
        <select
          id="wish-mode"
          value={modeId}
          onChange={(e) => setModeId(e.target.value)}
          className="input-industrial w-full"
        >
          <option value="">選択しない</option>
          {modes.map(mode => (
            <option key={mode.id} value={mode.id}>
              {mode.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          タグ
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleTagToggle(tag.id)}
              className={`tag-industrial transition-all duration-200 ${
                selectedTagIds.includes(tag.id)
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-bg-primary)]'
                  : 'hover:border-[var(--color-accent)]'
              }`}
            >
              {tag.name}
            </button>
          ))}
          {tags.length === 0 && (
            <p className="font-display text-xs text-[var(--color-text-tertiary)]">タグがありません</p>
          )}
        </div>
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
          className="btn-industrial-primary"
        >
          {wish ? '更新' : '作成'}
        </button>
      </div>
    </form>
  )
}
