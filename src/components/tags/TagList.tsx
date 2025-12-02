import { Tag } from '../../types'

interface TagListProps {
  tags: Tag[]
  onEdit: (tag: Tag) => void
  onDelete: (id: string) => void
}

export default function TagList({ tags, onEdit, onDelete }: TagListProps) {
  if (tags.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-display text-sm text-[var(--color-text-tertiary)]">タグがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="card-industrial p-3 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            {tag.color && (
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
            )}
            <span className="font-display text-sm font-medium text-[var(--color-text-primary)]">
              {tag.name}
            </span>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(tag)}
              className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)] transition-all"
              title="編集"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(tag.id)}
              className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all"
              title="削除"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

