import { useState, useEffect } from 'react'
import { Task } from '../../types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStartTimer: (id: string) => void
  onStopTimer: (id: string) => void
  getCategoryName?: (categoryId?: string) => string
}

/**
 * 秒数を時間表示に変換（HH:MM:SS形式）
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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

export default function TaskItem({ task, onToggle, onEdit, onDelete, onStartTimer, onStopTimer, getCategoryName }: TaskItemProps) {
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date()
  
  // リアルタイムでタイマーを更新
  const [currentElapsed, setCurrentElapsed] = useState<number>(0)
  
  useEffect(() => {
    if (task.isRunning && task.startTime) {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        const start = new Date(task.startTime!).getTime()
        const elapsed = Math.floor((now - start) / 1000)
        const totalElapsed = (task.elapsedTime || 0) + elapsed
        setCurrentElapsed(totalElapsed)
      }, 1000)
      
      return () => clearInterval(interval)
    } else {
      setCurrentElapsed(task.elapsedTime || 0)
    }
  }, [task.isRunning, task.startTime, task.elapsedTime])
  
  const handleStartTimer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStartTimer(task.id)
  }
  
  const handleStopTimer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStopTimer(task.id)
  }
  
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
          
          {/* タイマー表示 - 未完了タスク */}
          {!task.completed && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              <span className={`text-sm font-mono font-semibold ${
                task.isRunning 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                ⏱️ {formatTime(currentElapsed)}
              </span>
              {task.isRunning && (
                <span className="text-xs text-green-600 dark:text-green-400 animate-pulse">
                  ●
                </span>
              )}
            </div>
          )}
          
          {/* 経過時間表示 - 完了したタスク */}
          {task.completed && (task.elapsedTime || 0) > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              <span className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
                ⏱️ {formatTime(task.elapsedTime || 0)}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {/* タイマーコントロール - 未完了タスクのみ表示 */}
        {!task.completed && (
          <>
            {task.isRunning ? (
              <button
                onClick={handleStopTimer}
                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900 rounded transition-colors"
                title="タイマーを停止（タスクを完了）"
              >
                ⏸️
              </button>
            ) : (
              <button
                onClick={handleStartTimer}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900 rounded transition-colors"
                title="タイマーを開始"
              >
                ▶️
              </button>
            )}
          </>
        )}
        {/* 完了したタスクは編集・削除ボタンを非表示 */}
        {!task.completed && (
          <>
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
          </>
        )}
        {/* 完了したタスクは時間編集ボタンのみ表示 */}
        {task.completed && (
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
            title="開始・終了時間を編集"
          >
            ⏰
          </button>
        )}
      </div>
    </div>
  )
}

