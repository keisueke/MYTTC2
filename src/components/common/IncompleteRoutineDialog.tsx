import { Task } from '../../types'

interface IncompleteRoutineDialogProps {
  incompleteRoutines: Task[]
  onContinue: (taskId: string) => void // 今日も実行する
  onSkip: (taskId: string) => void // 今日はスキップする
  onDelete: (taskId: string) => void // このルーティンを削除する
  onEdit: (taskId: string) => void // このルーティンを変更する
  onClose: () => void
}

export default function IncompleteRoutineDialog({
  incompleteRoutines,
  onContinue,
  onSkip,
  onDelete,
  onEdit,
  onClose,
}: IncompleteRoutineDialogProps) {
  if (incompleteRoutines.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card-industrial p-6 max-w-2xl w-full mx-4 border-2 border-[var(--color-warning)]">
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            昨日できなかったルーティン
          </h2>
          <p className="font-display text-sm text-[var(--color-text-secondary)]">
            昨日完了しなかったルーティンがあります。今日の対応を選択してください。
          </p>
        </div>

        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {incompleteRoutines.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-display text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="font-display text-xs text-[var(--color-text-secondary)]">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onContinue(task.id)}
                  className="btn-industrial text-xs px-3 py-1.5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:opacity-90"
                >
                  今日も実行する
                </button>
                <button
                  onClick={() => onSkip(task.id)}
                  className="btn-industrial text-xs px-3 py-1.5 hover:bg-[var(--color-bg-tertiary)]"
                >
                  今日はスキップ
                </button>
                <button
                  onClick={() => onEdit(task.id)}
                  className="btn-industrial text-xs px-3 py-1.5 hover:bg-[var(--color-bg-tertiary)]"
                >
                  変更する
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="btn-industrial text-xs px-3 py-1.5 hover:bg-[var(--color-error)] hover:text-white"
                >
                  削除する
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-industrial px-4 hover:bg-[var(--color-bg-tertiary)]"
          >
            後で対応
          </button>
        </div>

        <div className="mt-4 p-3 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30">
          <p className="font-display text-xs text-[var(--color-warning)]">
            注意: 「後で対応」を選択した場合、これらのルーティンは次回アプリ起動時にも表示されます。
          </p>
        </div>
      </div>
    </div>
  )
}

