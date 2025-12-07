import { useState, useMemo, useEffect } from 'react'
import { Task, Project, Mode, Tag, RoutineExecution, Weekday } from '../../types'
import TaskItem from './TaskItem'
import { ensureTodayRoutineExecutions, getTimeSectionSettings, getTimeSectionsForWeekday } from '../../services/taskService'
import { isTaskForDate, isRepeatTaskForDate } from '../../utils/repeatUtils'

/**
 * ローカル日付文字列を取得（YYYY-MM-DD形式）
 */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface TaskListProps {
  tasks: Task[]
  projects: Project[]
  modes: Mode[]
  tags: Tag[]
  routineExecutions?: RoutineExecution[]
  referenceDate?: Date
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStartTimer?: (id: string) => void
  onStopTimer?: (id: string) => void
  onCopy?: (id: string) => void
  onMoveTask?: (taskId: string, newIndex: number, filteredTaskIds: string[]) => void
  hideTimer?: boolean
}

type SortType = 'createdAt' | 'title' | 'timeSection'

export default function TaskList({ tasks, projects, modes, tags, routineExecutions = [], referenceDate, onEdit, onDelete, onStartTimer, onStopTimer, onCopy, onMoveTask, hideTimer = false }: TaskListProps) {
  const [sortBy, setSortBy] = useState<SortType>('createdAt')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [modeFilter, setModeFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState<boolean>(true)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false)

  // タスク一覧表示時にルーティン実行記録を生成
  useEffect(() => {
    ensureTodayRoutineExecutions()
  }, [])

  // 基準日付（指定がなければ今日）をメモ化
  const baseDate = useMemo(() => referenceDate || new Date(), [referenceDate])
  const baseDateStr = useMemo(() => toLocalDateString(baseDate), [baseDate])
  
  // 時間セクション設定
  const timeSectionSettings = useMemo(() => getTimeSectionSettings(), [])
  const sectionsForDay = useMemo(() => {
    if (!timeSectionSettings.enabled) return []
    const weekday = baseDate.getDay() as Weekday
    return getTimeSectionsForWeekday(weekday)
  }, [timeSectionSettings, baseDate])
  
  // セクションIDから順序を取得するマップ
  const sectionOrderMap = useMemo(() => {
    const map = new Map<string, number>()
    sectionsForDay.forEach((section, index) => {
      map.set(section.id, index)
    })
    return map
  }, [sectionsForDay])
  
  const filteredAndSortedTasks = useMemo(() => {
    // 基準日付のタスクをフィルタリング
    // ルーティンタスクの場合は、テンプレートを表示し、その日の実行状況をRoutineExecutionから取得
    let filtered = tasks.filter(task => {
      if (task.repeatPattern !== 'none') {
        // ルーティンタスクの場合は、基準日付に該当するかチェック
        return isRepeatTaskForDate(task, baseDate)
      }
      // 通常のタスクは既存のロジックを使用
      return isTaskForDate(task, baseDate)
    })
    
    // 完了したタスクのフィルタリング
    if (!showCompleted) {
      filtered = filtered.filter(t => {
        if (t.repeatPattern !== 'none') {
          // ルーティンタスクの場合は、基準日付の実行記録の完了状態をチェック
          const dateExecution = routineExecutions.find(e => 
            e.routineTaskId === t.id && e.date.startsWith(baseDateStr)
          )
          return dateExecution?.completedAt === undefined
        }
        return !t.completedAt
      })
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
        
        case 'timeSection': {
          // 時間セクション順でソート
          const aOrder = a.timeSectionId ? (sectionOrderMap.get(a.timeSectionId) ?? 999) : 999
          const bOrder = b.timeSectionId ? (sectionOrderMap.get(b.timeSectionId) ?? 999) : 999
          if (aOrder !== bOrder) {
            return aOrder - bOrder
          }
          // 同じセクション内は作成日順
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }, [tasks, projectFilter, modeFilter, tagFilter, sortBy, showCompleted, referenceDate, routineExecutions, baseDateStr, sectionOrderMap])

  // アクティブなフィルター数を計算
  const activeFilterCount = [
    projectFilter !== 'all',
    modeFilter !== 'all',
    tagFilter !== 'all',
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* フィルタとソート（折りたたみ式） */}
      <div className="card-industrial">
        {/* ヘッダー（クリックで折りたたみ） */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--color-bg-secondary)]/50 transition-colors"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="flex items-center gap-3">
            <span className="font-display text-xs tracking-[0.1em] uppercase text-[var(--color-text-secondary)]">
              フィルター・並び替え
            </span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs rounded">
                {activeFilterCount}件適用中
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* 完了タスク表示トグル（常に表示） */}
            <label 
              className="flex items-center gap-2 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="w-4 h-4 accent-[var(--color-accent)]"
              />
              <span className="font-display text-[10px] tracking-[0.1em] uppercase text-[var(--color-text-secondary)]">
                完了済み
              </span>
            </label>
            {/* 展開アイコン */}
            <svg 
              className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${isFilterExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* 折りたたみ可能なフィルターコンテンツ */}
        {isFilterExpanded && (
          <div className="p-4 pt-0 border-t border-[var(--color-border)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
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
                  {timeSectionSettings.enabled && sectionsForDay.length > 0 && (
                    <option value="timeSection">時間セクション順</option>
                  )}
                </select>
              </div>
            </div>

            {/* フィルターリセットボタン */}
            {activeFilterCount > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <button
                  onClick={() => {
                    setProjectFilter('all')
                    setModeFilter('all')
                    setTagFilter('all')
                  }}
                  className="btn-industrial text-xs"
                >
                  フィルターをリセット
                </button>
              </div>
            )}
          </div>
        )}
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
                    routineExecution={task.repeatPattern !== 'none' ? routineExecutions.find(e => 
                      e.routineTaskId === task.id && e.date.startsWith(baseDateStr)
                    ) : undefined}
                    timeSection={task.timeSectionId ? sectionsForDay.find(s => s.id === task.timeSectionId) : undefined}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStartTimer={hideTimer ? undefined : onStartTimer}
                    onStopTimer={hideTimer ? undefined : onStopTimer}
                    onCopy={onCopy}
                    hideTimer={hideTimer}
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

