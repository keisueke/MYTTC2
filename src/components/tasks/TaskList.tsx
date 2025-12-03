import { useState, useMemo } from 'react'
import { Task, Project, Mode, Tag } from '../../types'
import TaskItem from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  projects: Project[]
  modes: Mode[]
  tags: Tag[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStartTimer: (id: string) => void
  onStopTimer: (id: string) => void
  onCopy?: (id: string) => void
  onMoveTask?: (taskId: string, newIndex: number, filteredTaskIds: string[]) => void
}

type SortType = 'createdAt' | 'title'

export default function TaskList({ tasks, projects, modes, tags, onEdit, onDelete, onStartTimer, onStopTimer, onCopy, onMoveTask }: TaskListProps) {
  const [sortBy, setSortBy] = useState<SortType>('createdAt')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [modeFilter, setModeFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState<boolean>(true)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const filteredAndSortedTasks = useMemo(() => {
    // すべてのタスクを表示
    let filtered = [...tasks]
    
    // 完了したタスクのフィルタリング
    if (!showCompleted) {
      filtered = filtered.filter(t => !t.completedAt)
    }

    if (projectFilter !== 'all') {
      filtered = filtered.filter(t => t.projectId === projectFilter)
    }

    if (modeFilter !== 'all') {
      filtered = filtered.filter(t => t.modeId === modeFilter)
    }

    if (tagFilter !== 'all') {
      filtered = filtered.filter(t => t.tagIds && t.tagIds.includes(tagFilter))
    }

    // ソート
    filtered.sort((a, b) => {
      // 完了したタスクを最後に表示
      const aCompleted = a.completedAt ? 1 : 0
      const bCompleted = b.completedAt ? 1 : 0
      if (aCompleted !== bCompleted) {
        return aCompleted - bCompleted // 未完了を先に
      }
      
      // 完了状態が同じ場合、orderでソート（orderが設定されている場合）
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      
      // orderが設定されていない場合は、既存のソートロジックを使用
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title, 'ja')
        
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }, [tasks, projectFilter, modeFilter, tagFilter, sortBy, showCompleted])

  return (
    <div className="space-y-4">
      {/* フィルタとソート */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              プロジェクト
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="input-industrial w-full"
            >
              <option value="all">すべて</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              モード
            </label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="input-industrial w-full"
            >
              <option value="all">すべて</option>
              {modes.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              タグ
            </label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="input-industrial w-full"
            >
              <option value="all">すべて</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              並び替え
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="input-industrial w-full"
            >
              <option value="createdAt">作成日（新しい順）</option>
              <option value="title">タイトル</option>
            </select>
          </div>
        </div>
      </div>

      {/* 完了タスク表示トグル */}
      <div className="flex items-center justify-end bg-[var(--color-bg-tertiary)] p-3 border border-[var(--color-border)]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-accent)]"
          />
          <span className="font-display text-[10px] tracking-[0.1em] uppercase text-[var(--color-text-secondary)]">
            完了済みを表示
          </span>
        </label>
      </div>

      {/* タスク一覧 */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-display text-sm text-[var(--color-text-secondary)]">今日のタスクがありません</p>
          <p className="font-display text-xs text-[var(--color-text-tertiary)] mt-2">新しいタスクを作成してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedTasks.map((task, index) => {
            const isDragging = draggedTaskId === task.id
            const isDragOver = dragOverIndex === index && draggedTaskId !== task.id
            
            return (
              <div
                key={task.id}
                draggable={!!onMoveTask}
                onDragStart={(e) => {
                  if (onMoveTask) {
                    setDraggedTaskId(task.id)
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', task.id)
                  }
                }}
                onDragEnd={() => {
                  setDraggedTaskId(null)
                  setDragOverIndex(null)
                }}
                onDragOver={(e) => {
                  if (onMoveTask && draggedTaskId && draggedTaskId !== task.id) {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDragOverIndex(index)
                  }
                }}
                onDragLeave={() => {
                  if (dragOverIndex === index) {
                    setDragOverIndex(null)
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (onMoveTask && draggedTaskId && draggedTaskId !== task.id && dragOverIndex !== null) {
                    const filteredTaskIds = filteredAndSortedTasks.map(t => t.id)
                    onMoveTask(draggedTaskId, dragOverIndex, filteredTaskIds)
                  }
                  setDraggedTaskId(null)
                  setDragOverIndex(null)
                }}
                className={`transition-all duration-200 ${
                  isDragging ? 'opacity-50' : ''
                } ${
                  isDragOver ? 'translate-y-2' : ''
                }`}
              >
                <div className={isDragOver ? 'border-t-2 border-[var(--color-accent)]' : ''}>
                  <TaskItem
                    task={task}
                    projects={projects}
                    modes={modes}
                    tags={tags}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStartTimer={onStartTimer}
                    onStopTimer={onStopTimer}
                    onCopy={onCopy}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

