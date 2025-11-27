import { Task } from '../../types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  getCategoryName?: (categoryId?: string) => string
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

export default function TaskItem({ task, onToggle, onEdit, onDelete, getCategoryName }: TaskItemProps) {
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date()
  
  return (
    <div
      className={`flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border ${
        task.completed
          ? 'border-gray-200 dark:border-gray-700 opacity-60'
          : 'border-gray-300 dark:border-gray-600'
      } ${isOverdue ? 'border-red-300 dark:border-red-700' : ''}`}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3
              className={`font-medium ${
                task.completed
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${priorityColors[task.priority]}`}
          >
            {priorityLabels[task.priority]}
          </span>
          
          {task.categoryId && getCategoryName && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded">
              {getCategoryName(task.categoryId)}
            </span>
          )}
          
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
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(task)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
          title="編集"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
          title="削除"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

