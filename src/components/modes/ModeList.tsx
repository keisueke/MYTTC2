import { Mode } from '../../types'

interface ModeListProps {
  modes: Mode[]
  onEdit: (mode: Mode) => void
  onDelete: (id: string) => void
}

export default function ModeList({ modes, onEdit, onDelete }: ModeListProps) {
  if (modes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm">モードがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {modes.map((mode) => (
        <div
          key={mode.id}
          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            {mode.color && (
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: mode.color }}
              />
            )}
            <span className="text-gray-900 dark:text-white font-medium">
              {mode.name}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(mode)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
              title="編集"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(mode.id)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
              title="削除"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

