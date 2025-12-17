import { useState, useRef, TouchEvent } from 'react'
import { SubTask, Task } from '../../types'

interface RoutineCheckerProps {
  parentTask: Task
  subTasks: SubTask[]
  onToggleComplete: (subTaskId: string, completed: boolean) => void
  onAddSubTask: (parentTaskId: string) => void
  onEditSubTask: (subTask: SubTask) => void
  onDeleteSubTask: (subTaskId: string) => void
  onDeleteParentTask: (taskId: string) => void
}

// スワイプ可能なタスクアイテム
function SwipeableTaskItem({
  subTask,
  completed,
  onToggleComplete,
  onEditSubTask,
  onDeleteSubTask,
}: {
  subTask: SubTask
  completed: boolean
  onToggleComplete: (completed: boolean) => void
  onEditSubTask: () => void
  onDeleteSubTask: () => void
}) {
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startXRef = useRef(0)
  const itemRef = useRef<HTMLDivElement>(null)

  const SWIPE_THRESHOLD = 80 // スワイプ完了の閾値

  const handleTouchStart = (e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startXRef.current

    // 右スワイプのみ許可（完了にする）、または左スワイプ（完了解除）
    if (!completed && diff > 0) {
      setSwipeX(Math.min(diff, SWIPE_THRESHOLD + 20))
    } else if (completed && diff < 0) {
      setSwipeX(Math.max(diff, -(SWIPE_THRESHOLD + 20)))
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    
    if (!completed && swipeX >= SWIPE_THRESHOLD) {
      // 右スワイプで完了
      onToggleComplete(true)
    } else if (completed && swipeX <= -SWIPE_THRESHOLD) {
      // 左スワイプで完了解除
      onToggleComplete(false)
    }
    
    setSwipeX(0)
  }

  const getSwipeProgress = () => {
    if (!completed) {
      return Math.min(swipeX / SWIPE_THRESHOLD, 1)
    } else {
      return Math.min(Math.abs(swipeX) / SWIPE_THRESHOLD, 1)
    }
  }

  const progress = getSwipeProgress()

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* 背景レイヤー（スワイプ時に見える） */}
      <div
        className={`absolute inset-0 flex items-center transition-colors duration-200 ${
          !completed
            ? 'bg-[var(--color-accent)] justify-start pl-4'
            : 'bg-[var(--color-text-tertiary)] justify-end pr-4'
        }`}
        style={{ opacity: progress }}
      >
        <span className="text-white font-display text-sm font-medium">
          {!completed ? '✓ 完了' : '↩ 戻す'}
        </span>
      </div>

      {/* メインコンテンツ */}
      <div
        ref={itemRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative p-4 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex items-center gap-4 group transition-transform duration-200 ${
          completed ? 'bg-[var(--color-accent)]/5' : ''
        } ${!isSwiping ? 'transition-transform' : ''}`}
        style={{
          transform: `translateX(${swipeX}px)`,
        }}
      >
        {/* 完了インジケーター */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            completed
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border)] text-[var(--color-text-tertiary)]'
          }`}
          onClick={() => onToggleComplete(!completed)}
        >
          {completed ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <span className="text-xs font-display">→</span>
          )}
        </div>

        {/* タスク情報 */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-display text-sm font-medium ${
              completed
                ? 'text-[var(--color-text-tertiary)] line-through'
                : 'text-[var(--color-text-primary)]'
            }`}
          >
            {subTask.title}
          </h3>
          {subTask.description && (
            <p className="font-display text-xs text-[var(--color-text-secondary)] mt-0.5">
              {subTask.description}
            </p>
          )}
          {!completed && (
            <p className="font-display text-[10px] text-[var(--color-text-tertiary)] mt-1">
              → 右にスワイプで完了
            </p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEditSubTask}
            className="px-3 py-1.5 font-display text-[10px] tracking-wider uppercase bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:bg-[var(--color-accent-hover)] transition-colors rounded"
          >
            編集
          </button>
          <button
            onClick={() => {
              if (confirm('この詳細タスクを削除しますか？')) {
                onDeleteSubTask()
              }
            }}
            className="px-3 py-1.5 font-display text-[10px] tracking-wider uppercase bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/80 transition-colors rounded"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RoutineChecker({
  parentTask,
  subTasks,
  onToggleComplete,
  onAddSubTask,
  onEditSubTask,
  onDeleteSubTask,
  onDeleteParentTask,
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

  // 完了数を計算
  const completedCount = sortedSubTasks.filter(st => isCompletedToday(st)).length
  const totalCount = sortedSubTasks.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="card-industrial p-6">
      {/* 親タスクヘッダー */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
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
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-[var(--color-accent)]">
              {completedCount}/{totalCount}
            </p>
            <p className="font-display text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Completed
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('このルーティンを削除しますか？')) {
                onDeleteParentTask(parentTask.id)
              }
            }}
            className="px-3 py-1.5 font-display text-[10px] tracking-wider uppercase bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/80 transition-colors rounded"
          >
            削除
          </button>
        </div>
      </div>

      {/* プログレスバー */}
      {totalCount > 0 && (
        <div className="mb-6">
          <div className="h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 詳細タスクリスト */}
      <div className="space-y-3">
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
              <SwipeableTaskItem
                key={subTask.id}
                subTask={subTask}
                completed={completed}
                onToggleComplete={(newCompleted) => onToggleComplete(subTask.id, newCompleted)}
                onEditSubTask={() => onEditSubTask(subTask)}
                onDeleteSubTask={() => onDeleteSubTask(subTask.id)}
              />
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

