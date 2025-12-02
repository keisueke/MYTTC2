import { useState, useMemo } from 'react'
import { Wish, Project, Mode, Tag } from '../../types'

interface WishListProps {
  wishes: Wish[]
  projects: Project[]
  modes: Mode[]
  tags: Tag[]
  onEdit: (wish: Wish) => void
  onDelete: (id: string) => void
  onConvertToTask?: (wish: Wish) => void
}

type SortType = 'createdAt' | 'title'

export default function WishList({ wishes, projects, modes, tags, onEdit, onDelete, onConvertToTask }: WishListProps) {
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [modeFilter, setModeFilter] = useState<string>('')
  const [tagFilter, setTagFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortType>('createdAt')

  // フィルタリングとソート
  const filteredAndSortedWishes = useMemo(() => {
    let filtered = wishes

    if (projectFilter) {
      filtered = filtered.filter(w => w.projectId === projectFilter)
    }
    if (modeFilter) {
      filtered = filtered.filter(w => w.modeId === modeFilter)
    }
    if (tagFilter) {
      filtered = filtered.filter(w => w.tagIds?.includes(tagFilter))
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'ja')
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return sorted
  }, [wishes, projectFilter, modeFilter, tagFilter, sortBy])

  const getProject = (id?: string) => projects.find(p => p.id === id)
  const getMode = (id?: string) => modes.find(m => m.id === id)
  const getTag = (id: string) => tags.find(t => t.id === id)

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              プロジェクト
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300"
            >
              <option value="">すべて</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              モード
            </label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300"
            >
              <option value="">すべて</option>
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
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300"
            >
              <option value="">すべて</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              並び替え
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300"
            >
              <option value="createdAt">作成日</option>
              <option value="title">タイトル</option>
            </select>
          </div>
        </div>
      </div>

      {/* リスト */}
      {filteredAndSortedWishes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {wishes.length === 0 ? 'wishリストは空です' : '条件に一致するwishがありません'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedWishes.map(wish => {
            const project = getProject(wish.projectId)
            const mode = getMode(wish.modeId)
            const wishTags = wish.tagIds?.map(id => getTag(id)).filter(Boolean) || []

            return (
              <div
                key={wish.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {wish.title}
                    </h3>
                    {wish.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-wrap">
                        {wish.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {project && (
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          📁 {project.name}
                        </span>
                      )}
                      {mode && (
                        <span
                          className="px-2 py-1 text-xs rounded text-white"
                          style={{ backgroundColor: mode.color || '#6B7280' }}
                        >
                          🎯 {mode.name}
                        </span>
                      )}
                      {wishTags.map(tag => tag && (
                        <span
                          key={tag.id}
                          className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      作成: {new Date(wish.createdAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {onConvertToTask && (
                      <button
                        onClick={() => onConvertToTask(wish)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        title="タスクに変換"
                      >
                        📋
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(wish)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('このwishを削除しますか？')) {
                          onDelete(wish.id)
                        }
                      }}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

