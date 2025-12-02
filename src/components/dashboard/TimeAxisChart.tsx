import { useMemo } from 'react'
import { Task, Project, Mode, Tag } from '../../types'

interface TimeAxisChartProps {
  tasks: Task[]
  projects: Project[]
  modes: Mode[]
  tags: Tag[]
  date: Date // 表示する日付
}

interface TaskTimeBlock {
  task: Task
  startHour: number // 開始時間（0-24）
  startMinute: number // 開始分（0-59）
  endHour: number // 終了時間（0-24）
  endMinute: number // 終了分（0-59）
  duration: number // 継続時間（分）
  project?: Project
  mode?: Mode
  tags: Tag[]
}

export default function TimeAxisChart({ tasks, projects, modes, tags, date }: TimeAxisChartProps) {
  // 指定日のタスクを時間軸で整理
  const timeBlocks = useMemo(() => {
    const blocks: TaskTimeBlock[] = []
    
    // 指定日の開始時刻と終了時刻
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    
    // 完了したタスク（startTimeとendTimeがある）をフィルタリング
    const completedTasks = tasks.filter(task => {
      if (!task.startTime || !task.endTime) return false
      const startTime = new Date(task.startTime)
      // 指定日の範囲内に実行されたタスク
      return startTime >= dayStart && startTime <= dayEnd
    })
    
    completedTasks.forEach(task => {
      if (!task.startTime || !task.endTime) return
      
      const startTime = new Date(task.startTime)
      const endTime = new Date(task.endTime)
      
      const startHour = startTime.getHours()
      const startMinute = startTime.getMinutes()
      const endHour = endTime.getHours()
      const endMinute = endTime.getMinutes()
      
      // 継続時間（分）
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
      
      const project = task.projectId ? projects.find(p => p.id === task.projectId) : undefined
      const mode = task.modeId ? modes.find(m => m.id === task.modeId) : undefined
      const taskTags = task.tagIds ? tags.filter(t => task.tagIds!.includes(t.id)) : []
      
      blocks.push({
        task,
        startHour,
        startMinute,
        endHour,
        endMinute,
        duration,
        project,
        mode,
        tags: taskTags,
      })
    })
    
    // 開始時間順にソート
    return blocks.sort((a, b) => {
      if (a.startHour !== b.startHour) return a.startHour - b.startHour
      return a.startMinute - b.startMinute
    })
  }, [tasks, projects, modes, tags, date])
  
  // 時間軸の高さを計算（各時間帯の高さ）
  const hourHeight = 60 // 1時間あたり60px
  
  // タスクブロックの位置とサイズを計算
  const getBlockStyle = (block: TaskTimeBlock) => {
    const startMinutes = block.startHour * 60 + block.startMinute
    const endMinutes = block.endHour * 60 + block.endMinute
    const top = (startMinutes / 60) * hourHeight
    const height = ((endMinutes - startMinutes) / 60) * hourHeight
    
    return {
      top: `${top}px`,
      height: `${Math.max(height, 20)}px`, // 最小20px
    }
  }
  
  const getBlockColor = (block: TaskTimeBlock): string => {
    if (block.mode?.color) return block.mode.color
    if (block.project?.color) return block.project.color
    return 'var(--color-accent)'
  }
  
  if (timeBlocks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-display text-sm text-[var(--color-text-tertiary)]">
          {date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}の作業記録がありません
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* 日付表示 */}
      <div className="flex items-center justify-between">
        <p className="font-display text-xs tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]">
          {date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
        <p className="font-display text-xs text-[var(--color-text-secondary)]">
          {timeBlocks.length}件のタスク
        </p>
      </div>
      
      {/* 時間軸チャート */}
      <div className="relative border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
        {/* 時間軸ラベル（左側） */}
        <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 px-2 py-1 border-b border-[var(--color-border)]"
              style={{ top: `${i * hourHeight}px`, height: `${hourHeight}px` }}
            >
              <span className="font-display text-[10px] tracking-wider text-[var(--color-text-tertiary)]">
                {i.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>
        
        {/* タスクブロックエリア */}
        <div className="relative ml-16" style={{ height: `${24 * hourHeight}px` }}>
          {/* 時間帯の背景（交互の色） */}
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-b border-[var(--color-border)]"
              style={{
                top: `${i * hourHeight}px`,
                height: `${hourHeight}px`,
                backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
              }}
            />
          ))}
          
          {/* タスクブロック */}
          {timeBlocks.map((block) => {
            const style = getBlockStyle(block)
            const color = getBlockColor(block)
            
            return (
              <div
                key={block.task.id}
                className="absolute left-0 right-0 group cursor-pointer"
                style={style}
              >
                <div
                  className="h-full ml-2 mr-2 rounded border-l-4 transition-all duration-200 hover:shadow-lg"
                  style={{
                    backgroundColor: `${color}20`,
                    borderLeftColor: color,
                  }}
                >
                  <div className="p-2 h-full flex items-center">
                    <p className="font-display text-xs font-medium text-[var(--color-text-primary)] line-clamp-1">
                      {block.task.title}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

