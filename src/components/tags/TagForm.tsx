import { useState, useEffect } from 'react'
import { Tag } from '../../types'

interface TagFormProps {
  tag?: Tag
  onSubmit: (tag: Omit<Tag, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

export default function TagForm({ tag, onSubmit, onCancel }: TagFormProps) {
  const [name, setName] = useState(tag?.name || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (tag) {
      setName(tag.name)
    }
  }, [tag])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!name.trim()) {
      newErrors.name = 'タグ名は必須です'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    onSubmit({
      name: name.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="tagName" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          タグ名 <span className="text-[var(--color-error)]">*</span>
        </label>
        <input
          id="tagName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`input-industrial w-full ${
            errors.name ? 'border-[var(--color-error)]' : ''
          }`}
          placeholder="タグ名を入力"
        />
        {errors.name && (
          <p className="mt-1 font-display text-xs text-[var(--color-error)]">{errors.name}</p>
        )}
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
          {tag ? '更新' : '作成'}
        </button>
      </div>
    </form>
  )
}

