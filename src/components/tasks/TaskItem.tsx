import { useState, useEffect } from 'react'
import { Task, Project, Mode, Tag, RoutineExecution, TimeSection } from '../../types'

interface TaskItemProps {
  task: Task
  projects: Project[]
  modes: Mode[]
  tags: Tag[]
  routineExecution?: RoutineExecution
  timeSection?: TimeSection
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStartTimer?: (id: string) => void
  onStopTimer?: (id: string) => void
  onCopy?: (id: string) => void
  hideTimer?: boolean
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function TaskItem({ task, projects, modes, tags, routineExecution, timeSection, onEdit, onDelete, onStartTimer, onStopTimer, onCopy, hideTimer = false }: TaskItemProps) {
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : undefined
  const mode = task.modeId ? modes.find(m => m.id === task.modeId) : undefined
  const taskTags = task.tagIds ? tags.filter(t => task.tagIds!.includes(t.id)) : []
  
  // ルーティンタスクの場合は、実行記録の経過時間を使用
  const displayElapsedTime = task.repeatPattern !== 'none' 
    ? (routineExecution?.elapsedTime || 0)
    : (task.elapsedTime || 0)
  
  // ルーティンタスクの場合は、実行記録の完了状態を確認
  const isCompleted = task.repeatPattern !== 'none' 
    ? !!routineExecution?.completedAt 
    : !!task.completedAt
  
  // 経過時間の状態（displayElapsedTimeで初期化）
  const [currentElapsed, setCurrentElapsed] = useState<number>(displayElapsedTime)
  
  // displayElapsedTimeが変更されたら即座に反映
  useEffect(() => {
    if (!task.isRunning) {
      setCurrentElapsed(displayElapsedTime)
    }
  }, [displayElapsedTime, task.isRunning])
  
  // タイマーが動作中の場合は1秒ごとに更新
  useEffect(() => {
    if (task.isRunning && task.startTime) {
      // 初期値を設定
      const start = new Date(task.startTime).getTime()
      const initialElapsed = Math.floor((Date.now() - start) / 1000)
      setCurrentElapsed(displayElapsedTime + initialElapsed)
      
      const interval = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - start) / 1000)
        setCurrentElapsed(displayElapsedTime + elapsed)
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [task.isRunning, task.startTime, displayElapsedTime])
  
  const handleStartTimer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStartTimer?.(task.id)
  }
  
  const handleStopTimer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStopTimer?.(task.id)
  }
  
  return (
    <div className={`group card-industrial p-5 transition-all duration-300 hover:-translate-y-0.5 ${
      task.isRunning ? 'border-l-4 border-l-[var(--color-secondary)] animate-pulse-glow' : 
      isCompleted ? 'border-l-4 border-l-[var(--color-secondary)] opacity-60' : ''
    }`}>
      <div className="flex items-start gap-4">
        {/* ドラッグハンドル */}
        <div className="cursor-move text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors flex items-center justify-center w-6" title="ドラッグして順番を変更">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        
        {/* Timer Control */}
        {!hideTimer && !isCompleted && (
          <button
            onClick={task.isRunning ? handleStopTimer : handleStartTimer}
            className={`w-10 h-10 flex items-center justify-center border transition-all duration-200 ${
              task.isRunning 
                ? 'bg-[var(--color-secondary)] border-[var(--color-secondary)] text-[var(--color-bg-primary)]' 
                : 'bg-[var(--color-bg-tertiary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
            }`}
            title={task.isRunning ? 'タイマーを停止' : 'タイマーを開始'}
          >
            {task.isRunning ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}
        
        {/* Completed Badge */}
        {!hideTimer && isCompleted && (
          <div className="w-10 h-10 flex items-center justify-center bg-[var(--color-secondary)]/20 border border-[var(--color-secondary)]">
            <svg className="w-5 h-5 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-display text-sm font-medium transition-colors ${
                  isCompleted 
                    ? 'text-[var(--color-text-tertiary)] line-through' 
                    : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]'
                }`}>
                  {task.title}
                </h3>
                {timeSection && (
                  <span 
                    className="font-display text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-sm"
                    style={{ 
                      backgroundColor: `${timeSection.color}20`,
                      color: timeSection.color,
                      border: `1px solid ${timeSection.color}40`
                    }}
                  >
                    {timeSection.name}
                  </span>
                )}
                {isCompleted && (
                  <span className="font-display text-[8px] tracking-[0.1em] uppercase text-[var(--color-secondary)] bg-[var(--color-secondary)]/20 px-1.5 py-0.5">
                    Completed
                  </span>
                )}
              </div>
              {task.description && (
                <p className="mt-1 text-sm text-[var(--color-text-tertiary)] line-clamp-1">
                  {task.description}
                </p>
              )}
            </div>
            
            {/* Timer Display */}
            <div className={`font-display text-lg font-semibold tracking-tight font-mono-nums ${
              task.isRunning ? 'text-[var(--color-secondary)]' : 
              isCompleted ? 'text-[var(--color-secondary)]' :
              'text-[var(--color-text-secondary)]'
            }`}>
              {formatTime(currentElapsed)}
            </div>
          </div>
          
          {/* Tags & Meta */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {project && (
              <span 
                className="tag-industrial"
                style={project.color ? { borderColor: project.color, color: project.color } : {}}
              >
                {project.name}
              </span>
            )}
            
            {mode && (
              <span 
                className="tag-industrial"
                style={mode.color ? { backgroundColor: mode.color, borderColor: mode.color, color: '#0c0c0c' } : {}}
              >
                {mode.name}
              </span>
            )}
            
            {taskTags.map((tag) => (
              <span 
                key={tag.id}
                className="tag-industrial"
                style={tag.color ? { borderColor: tag.color, color: tag.color } : {}}
              >
                {tag.name}
              </span>
            ))}
            
            {task.estimatedTime && (
              <span className="tag-industrial text-[var(--color-text-muted)]">
                Est: {task.estimatedTime}m
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onCopy && (
            <button
              onClick={() => onCopy(task.id)}
              className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-all"
              title="タスクをコピー"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)] transition-all"
            title="編集"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
