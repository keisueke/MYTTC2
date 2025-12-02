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
    <div className="space-y-6">
      {/* フィルター */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              プロジェクト
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="input-industrial w-full"
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
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              モード
            </label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="input-industrial w-full"
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
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              タグ
            </label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="input-industrial w-full"
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
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              並び替え
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="input-industrial w-full"
            >
              <option value="createdAt">作成日</option>
              <option value="title">タイトル</option>
            </select>
          </div>
        </div>
      </div>

      {/* リスト */}
      {filteredAndSortedWishes.length === 0 ? (
        <div className="card-industrial p-8 text-center">
          <p className="font-display text-sm text-[var(--color-text-tertiary)]">
            {wishes.length === 0 ? 'wishリストは空です' : '条件に一致するwishがありません'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedWishes.map((wish, index) => {
            const project = getProject(wish.projectId)
            const mode = getMode(wish.modeId)
            const wishTags = wish.tagIds?.map(id => getTag(id)).filter(Boolean) || []

            return (
              <div
                key={wish.id}
                className="card-industrial p-5 transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      {wish.title}
                    </h3>
                    {wish.description && (
                      <p className="text-sm text-[var(--color-text-secondary)] mb-3 whitespace-pre-wrap">
                        {wish.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {project && (
                        <span className="tag-industrial">
                          {project.name}
                        </span>
                      )}
                      {mode && (
                        <span
                          className="tag-industrial"
                          style={mode.color ? { backgroundColor: mode.color, borderColor: mode.color, color: '#0c0c0c' } : {}}
                        >
                          {mode.name}
                        </span>
                      )}
                      {wishTags.map(tag => tag && (
                        <span
                          key={tag.id}
                          className="tag-industrial"
                          style={tag.color ? { borderColor: tag.color, color: tag.color } : {}}
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                    <p className="font-display text-[10px] tracking-[0.1em] uppercase text-[var(--color-text-muted)]">
                      Created: {new Date(wish.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {onConvertToTask && (
                      <button
                        onClick={() => onConvertToTask(wish)}
                        className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-all"
                        title="タスクに変換"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(wish)}
                      className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)] transition-all"
                      title="編集"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('このwishを削除しますか？')) {
                          onDelete(wish.id)
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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
