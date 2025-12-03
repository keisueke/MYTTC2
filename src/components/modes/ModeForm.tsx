import { useState, useEffect } from 'react'
import { Mode } from '../../types'

interface ModeFormProps {
  mode?: Mode
  onSubmit: (mode: Omit<Mode, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

const defaultColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]

export default function ModeForm({ mode, onSubmit, onCancel }: ModeFormProps) {
  const [name, setName] = useState(mode?.name || '')
  const [color, setColor] = useState(mode?.color || defaultColors[0])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode) {
      setName(mode.name)
      setColor(mode.color || defaultColors[0])
    }
  }, [mode])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!name.trim()) {
      newErrors.name = 'モード名は必須です'
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
      color: color || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="modeName" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          モード名 <span className="text-[var(--color-error)]">*</span>
        </label>
        <input
          id="modeName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`input-industrial w-full ${
            errors.name ? 'border-[var(--color-error)]' : ''
          }`}
          placeholder="モード名を入力"
        />
        {errors.name && (
          <p className="mt-1 font-display text-xs text-[var(--color-error)]">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          色
        </label>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {defaultColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c
                    ? 'border-[var(--color-text-primary)] scale-110'
                    : 'border-[var(--color-border)] hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-8 rounded border border-[var(--color-border)] cursor-pointer"
          />
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
          className="btn-industrial"
        >
          {mode ? '更新' : '作成'}
        </button>
      </div>
    </form>
  )
}

