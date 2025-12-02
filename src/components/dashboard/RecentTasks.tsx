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
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm">最近のタスクがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {recentTasks.map((task) => (
        <Link
          key={task.id}
          to="/tasks"
          className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-600 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {task.title}
              </h3>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

