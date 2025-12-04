import { SubTask, Task } from '../../types'

interface RoutineCheckerProps {
  parentTask: Task
  subTasks: SubTask[]
  onToggleComplete: (subTaskId: string, completed: boolean) => void
  onAddSubTask: (parentTaskId: string) => void
  onEditSubTask: (subTask: SubTask) => void
  onDeleteSubTask: (subTaskId: string) => void
}

export default function RoutineChecker({
  parentTask,
  subTasks,
  onToggleComplete,
  onAddSubTask,
  onEditSubTask,
  onDeleteSubTask,
}: RoutineCheckerProps) {
  // 日次チェック（今日完了したかどうか）
  const isCompletedToday = (subTask: SubTask): boolean => {
    if (!subTask.completedAt) return false
    const completedDate = new Date(subTask.completedAt)
    const today = new Date()
    return completedDate.toDateString() === today.toDateString()
  }

  // 順序でソート
  const sortedSubTasks = [...subTasks].sort((a, b) => {
    const orderA = a.order ?? 0
    const orderB = b.order ?? 0
    return orderA - orderB
  })

  return (
    <div className="card-industrial p-6">
      {/* 親タスクヘッダー */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
        <div>
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
            Parent Task
          </p>
          <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
            {parentTask.title}
          </h2>
          {parentTask.description && (
            <p className="font-display text-sm text-[var(--color-text-secondary)] mt-2">
              {parentTask.description}
            </p>
          )}
        </div>
      </div>

      {/* 詳細タスクリスト */}
      <div className="space-y-2">
        {sortedSubTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-display text-sm text-[var(--color-text-tertiary)]">
              詳細タスクがありません
            </p>
          </div>
        ) : (
          sortedSubTasks.map((subTask) => {
            const completed = isCompletedToday(subTask)
            return (
              <div
                key={subTask.id}
                className={`p-4 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex items-start gap-4 group ${
                  completed ? 'opacity-75' : ''
                }`}
              >
                {/* チェックボックス */}
                <button
                  onClick={() => onToggleComplete(subTask.id, !completed)}
                  className={`flex-shrink-0 w-5 h-5 flex items-center justify-center border-2 transition-all duration-200 ${
                    completed
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                  }`}
                  aria-label={completed ? '完了を解除' : '完了にする'}
                >
                  {completed && (
                    <svg className="w-3 h-3 text-[var(--color-bg-primary)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* タスク情報 */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-display text-sm font-medium mb-1 ${
                      completed
                        ? 'text-[var(--color-text-tertiary)] line-through'
                        : 'text-[var(--color-text-primary)]'
                    }`}
                  >
                    {subTask.title}
                  </h3>
                  {subTask.description && (
                    <p className="font-display text-xs text-[var(--color-text-secondary)]">
                      {subTask.description}
                    </p>
                  )}
                </div>

                {/* アクションボタン */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditSubTask(subTask)}
                    className="px-3 py-1.5 font-display text-[10px] tracking-wider uppercase bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:bg-[var(--color-accent-hover)] transition-colors"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('この詳細タスクを削除しますか？')) {
                        onDeleteSubTask(subTask.id)
                      }
                    }}
                    className="px-3 py-1.5 font-display text-[10px] tracking-wider uppercase bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/80 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 詳細タスク追加ボタン */}
      <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
        <button
          onClick={() => onAddSubTask(parentTask.id)}
          className="btn-industrial w-full"
        >
          + 詳細タスクを追加
        </button>
      </div>
    </div>
  )
}

