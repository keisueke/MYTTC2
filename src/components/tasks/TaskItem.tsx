import { useState, useEffect } from 'react'
import { Task, Project, Mode, Tag } from '../../types'

interface TaskItemProps {
  task: Task
  projects: Project[]
  modes: Mode[]
  tags: Tag[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStartTimer: (id: string) => void
  onStopTimer: (id: string) => void
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

export default function TaskItem({ task, projects, modes, tags, onEdit, onDelete, onStartTimer, onStopTimer }: TaskItemProps) {
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : undefined
  const mode = task.modeId ? modes.find(m => m.id === task.modeId) : undefined
  const taskTags = task.tagIds ? tags.filter(t => task.tagIds!.includes(t.id)) : []
  
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
    <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">
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
          {/* プロジェクト・モード・タグをボタン形式で表示 */}
          <button
            type="button"
            className={`px-2 py-1 text-xs rounded transition-colors ${
              project
                ? project.color
                  ? 'text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500'
            }`}
            style={project?.color ? { backgroundColor: project.color } : {}}
            disabled
          >
            プロジェクト
          </button>
          
          {project && (
            <button
              type="button"
              className={`px-2 py-1 text-xs rounded ${
                project.color ? 'text-white' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              }`}
              style={project.color ? { backgroundColor: project.color } : {}}
              disabled
            >
              {project.name}
            </button>
          )}
          
          {mode && (
            <button
              type="button"
              className={`px-2 py-1 text-xs rounded ${
                mode.color ? 'text-white' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              }`}
              style={mode.color ? { backgroundColor: mode.color } : {}}
              disabled
            >
              {mode.name}
            </button>
          )}
          
          {taskTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`px-2 py-1 text-xs rounded ${
                tag.color ? 'text-white' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
              }`}
              style={tag.color ? { backgroundColor: tag.color } : {}}
              disabled
            >
              {tag.name}
            </button>
          ))}
          
          {task.tagIds && task.tagIds.length === 0 && (
            <button
              type="button"
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded"
              disabled
            >
              タグ
            </button>
          )}
          
          {/* タイマー表示 */}
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
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {/* タイマーコントロール */}
        {task.isRunning ? (
          <button
            onClick={handleStopTimer}
            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900 rounded transition-colors"
            title="タイマーを停止"
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

