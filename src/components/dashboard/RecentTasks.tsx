import { Task } from '../../types'
import { Link } from 'react-router-dom'

interface RecentTasksProps {
  tasks: Task[]
  maxItems?: number
}

export default function RecentTasks({ tasks, maxItems = 5 }: RecentTasksProps) {
  const recentTasks = tasks
    .sort((a, b) => {
      // 作成日順（新しい順）
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, maxItems)

  if (recentTasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-display text-sm text-[var(--color-text-tertiary)]">最近のタスクがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {recentTasks.map((task) => (
        <Link
          key={task.id}
          to="/tasks"
          className="block card-industrial p-4 hover:border-[var(--color-accent)] transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)] truncate">
                {task.title}
              </h3>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

