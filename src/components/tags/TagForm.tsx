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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          タグ名 <span className="text-red-500">*</span>
        </label>
        <input
          id="tagName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="タグ名を入力"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {tag ? '更新' : '作成'}
        </button>
      </div>
    </form>
  )
}

