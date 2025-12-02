import { Goal } from '../../types'

interface MandalaChartProps {
  categoryLabel: string
  categoryIcon: string
  mainGoal?: Goal
  subGoals: Goal[]
  onEditMainGoal: () => void
  onEditSubGoal: (position: number) => void
  onDeleteGoal: (id: string) => void
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
  mainGoal,
  subGoals,
  onEditMainGoal,
  onEditSubGoal,
  onDeleteGoal,
}: MandalaChartProps) {
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

  // Grid positions: [1, 2, 3, 4, 0, 5, 6, 7, 8]
  const gridPositions = [1, 2, 3, 4, 0, 5, 6, 7, 8]

  return (
    <div className="card-industrial p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <span className="font-display text-xs tracking-[0.1em] text-[var(--color-accent)]">
            [{categoryIcon}]
          </span>
          <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)]">
            {categoryLabel}
          </h3>
        </div>
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
              onEdit={() => handleEdit(position)}
              onDelete={goal ? () => onDeleteGoal(goal.id) : undefined}
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
  onEdit: () => void
  onDelete?: () => void
}

function GoalCell({ position, goal, isMain = false, onEdit, onDelete }: GoalCellProps) {
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
      <div className="flex-1 min-h-0">
        <h4 className="font-display text-[10px] font-medium text-[var(--color-text-primary)] mb-1 line-clamp-2 leading-tight">
          {goal.title}
        </h4>
        {goal.progress !== undefined && (
          <div className="mt-auto">
            <div className="progress-industrial h-1">
              <div
                className="progress-industrial-bar"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <span className="font-display text-[8px] text-[var(--color-text-tertiary)] mt-0.5 block">
              {goal.progress}%
            </span>
          </div>
        )}
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
