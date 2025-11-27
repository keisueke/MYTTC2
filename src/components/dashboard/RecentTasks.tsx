import { Task, Category } from '../../types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Link } from 'react-router-dom'

interface RecentTasksProps {
  tasks: Task[]
  categories: Category[]
  maxItems?: number
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

const priorityLabels = {
  low: '低',
  medium: '中',
  high: '高',
}

export default function RecentTasks({ tasks, maxItems = 5 }: RecentTasksProps) {
  const categoryMap = new Map<string, string>()
  
  const recentTasks = tasks
    .filter(task => !task.completed)
    .sort((a, b) => {
      // 優先度順、その後期限順
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return 0
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
      {recentTasks.map((task) => {
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()
        
        return (
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
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${priorityColors[task.priority]}`}
                  >
                    {priorityLabels[task.priority]}
                  </span>
                  {task.dueDate && (
                    <span
                      className={`text-xs ${
                        isOverdue
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      📅 {format(new Date(task.dueDate), 'yyyy/MM/dd', { locale: ja })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

