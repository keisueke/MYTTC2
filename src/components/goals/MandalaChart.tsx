import { useNavigate } from 'react-router-dom'
import { Goal, Task, GoalCategory } from '../../types'

interface MandalaChartProps {
  categoryLabel: string
  categoryIcon: string
  category: GoalCategory
  mainGoal?: Goal
  subGoals: Goal[]
  tasks: Task[] // タスクリスト（進捗率計算用）
  onEditMainGoal: () => void
  onEditSubGoal: (position: number) => void
  onDeleteGoal: (id: string) => void
  onToggleComplete?: (goalId: string, completed: boolean) => void
}

const POSITION_LABELS = [
  '',
  'TL', // 1: 左上
  'TC', // 2: 上
  'TR', // 3: 右上
  'ML', // 4: 左
  'MR', // 5: 右
  'BL', // 6: 左下
  'BC', // 7: 下
  'BR', // 8: 右下
]

export default function MandalaChart({
  categoryLabel,
  categoryIcon,
  category,
  mainGoal,
  subGoals,
  tasks,
  onEditMainGoal,
  onEditSubGoal,
  onDeleteGoal,
  onToggleComplete,
}: MandalaChartProps) {
  const navigate = useNavigate()
  const goalsByPosition = new Map<number, Goal>()
  subGoals.forEach(goal => {
    if (goal.position) {
      goalsByPosition.set(goal.position, goal)
    }
  })

  const getGoalAtPosition = (position: number): Goal | undefined => {
    return goalsByPosition.get(position)
  }

  const handleEdit = (position: number) => {
    if (position === 0) {
      onEditMainGoal()
    } else {
      onEditSubGoal(position)
    }
  }

  // 達成率を計算（関連するタスクの完了状況から）
  const calculateCompletionRate = (goal: Goal | undefined): number | null => {
    if (!goal) return null
    
    // この目標に関連するタスクを取得
    const relatedTasks = tasks.filter(task => task.goalId === goal.id)
    
    // 関連タスクが存在しない場合はnullを返す
    if (relatedTasks.length === 0) return null
    
    // 完了しているタスクの数をカウント
    const completedTasks = relatedTasks.filter(task => task.completedAt).length
    
    // 進捗率を計算（完了数 / 総数 * 100）
    return Math.round((completedTasks / relatedTasks.length) * 100)
  }

  // カテゴリー全体の進捗率を計算（メイン目標とサブ目標のタスクから）
  const calculateCategoryProgress = (): number | null => {
    if (!mainGoal) return null
    
    const allSubGoals = [1, 2, 3, 4, 5, 6, 7, 8].map(pos => getGoalAtPosition(pos))
    const allGoals = [mainGoal, ...allSubGoals].filter(goal => goal !== undefined) as Goal[]
    
    if (allGoals.length === 0) return null
    
    // 各目標に関連するタスクを取得
    let totalTasks = 0
    let completedTasks = 0
    
    allGoals.forEach(goal => {
      const relatedTasks = tasks.filter(task => task.goalId === goal.id)
      totalTasks += relatedTasks.length
      completedTasks += relatedTasks.filter(task => task.completedAt).length
    })
    
    // タスクが1つも存在しない場合はnullを返す
    if (totalTasks === 0) return null
    
    // 進捗率を計算
    return Math.round((completedTasks / totalTasks) * 100)
  }

  const completionRate = calculateCategoryProgress()

  // Grid positions: [1, 2, 3, 4, 0, 5, 6, 7, 8]
  const gridPositions = [1, 2, 3, 4, 0, 5, 6, 7, 8]

  return (
    <div className="card-industrial p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-border)]">
        <button
          onClick={() => navigate(`/goals/${category}`)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <span className="font-display text-xs tracking-[0.1em] text-[var(--color-accent)]">
            [{categoryIcon}]
          </span>
          <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)]">
            {categoryLabel}
          </h3>
        </button>
        {completionRate !== null && (
          <span className="font-display text-xs font-medium text-[var(--color-accent)]">
            {completionRate}%
          </span>
        )}
      </div>

      {/* Mandala Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {gridPositions.map((position) => {
          const goal = position === 0 ? mainGoal : getGoalAtPosition(position)
          const isMain = position === 0

          return (
            <GoalCell
              key={position}
              position={position}
              goal={goal}
              isMain={isMain}
              calculateProgress={calculateCompletionRate}
              onEdit={() => handleEdit(position)}
              onDelete={goal ? () => onDeleteGoal(goal.id) : undefined}
              onToggleComplete={goal && !isMain ? (goalId: string, completed: boolean) => onToggleComplete?.(goalId, completed) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

interface GoalCellProps {
  position: number
  goal?: Goal
  isMain?: boolean
  calculateProgress: (goal: Goal | undefined) => number | null
  onEdit: () => void
  onDelete?: () => void
  onToggleComplete?: (goalId: string, completed: boolean) => void
}

function GoalCell({ position, goal, isMain = false, calculateProgress, onEdit, onDelete, onToggleComplete }: GoalCellProps) {
  const cellClasses = isMain
    ? 'min-h-[80px] bg-[var(--color-accent)]/10 border-2 border-[var(--color-accent)]/50'
    : 'min-h-[70px] bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]'

  if (!goal) {
    return (
      <div
        className={`${cellClasses} p-2 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-accent)] transition-all duration-200 group`}
        onClick={onEdit}
      >
        <span className="text-[var(--color-text-muted)] text-lg group-hover:text-[var(--color-accent)] transition-colors">
          +
        </span>
        <span className="font-display text-[9px] tracking-wider text-[var(--color-text-muted)] group-hover:text-[var(--color-text-tertiary)]">
          {isMain ? 'MAIN' : POSITION_LABELS[position]}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`${cellClasses} p-2 flex flex-col relative group`}
    >
      {/* チェックマーク（詳細目標のみ） */}
      {!isMain && onToggleComplete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleComplete(goal.id, !goal.completedAt)
          }}
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors z-10"
          aria-label={goal.completedAt ? '完了を解除' : '完了にする'}
        >
          {goal.completedAt ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      )}
      <div className="flex-1 min-h-0">
        <h4 className={`font-display text-[10px] font-medium mb-1 line-clamp-2 leading-tight ${
          goal.completedAt ? 'text-[var(--color-text-tertiary)] line-through' : 'text-[var(--color-text-primary)]'
        }`}>
          {goal.title}
        </h4>
        {(() => {
          const goalProgress = calculateProgress(goal)
          return goalProgress !== null && (
            <div className="mt-auto">
              <div className="progress-industrial h-1">
                <div
                  className="progress-industrial-bar"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
              <span className="font-display text-[8px] text-[var(--color-text-tertiary)] mt-0.5 block">
                {goalProgress}%
              </span>
            </div>
          )
        })()}
      </div>
      
      {/* Actions */}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="flex-1 px-1 py-0.5 font-display text-[8px] tracking-wider uppercase bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Edit
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="px-1 py-0.5 font-display text-[8px] tracking-wider uppercase bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/80 transition-colors"
          >
            Del
          </button>
        )}
      </div>
    </div>
  )
}
