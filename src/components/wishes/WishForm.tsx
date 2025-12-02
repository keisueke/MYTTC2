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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="wish-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          id="wish-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300"
          placeholder="やりたいことのタイトルを入力"
          required
        />
      </div>

      <div>
        <label htmlFor="wish-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          説明
        </label>
        <textarea
          id="wish-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300"
          placeholder="詳細な説明を入力（任意）"
        />
      </div>

      <div>
        <label htmlFor="wish-project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          プロジェクト
        </label>
        <select
          id="wish-project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300"
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
        <label htmlFor="wish-mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          モード
        </label>
        <select
          id="wish-mode"
          value={modeId}
          onChange={(e) => setModeId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300"
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          タグ
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleTagToggle(tag.id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {tag.name}
            </button>
          ))}
          {tags.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">タグがありません</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {wish ? '更新' : '作成'}
        </button>
      </div>
    </form>
  )
}

