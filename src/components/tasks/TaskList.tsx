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
}

type SortType = 'createdAt' | 'title'

export default function TaskList({ tasks, projects, modes, tags, onEdit, onDelete, onStartTimer, onStopTimer }: TaskListProps) {
  const [sortBy, setSortBy] = useState<SortType>('createdAt')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [modeFilter, setModeFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')

  const filteredAndSortedTasks = useMemo(() => {
    // すべてのタスクを表示（今日中にやるタスクのみ）
    let filtered = [...tasks]

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
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title, 'ja')
        
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }, [tasks, projectFilter, modeFilter, tagFilter, sortBy])

  return (
    <div className="space-y-4">
      {/* フィルタとソート */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              プロジェクト
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              モード
            </label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              タグ
            </label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              並び替え
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="createdAt">作成日（新しい順）</option>
              <option value="title">タイトル</option>
            </select>
          </div>
        </div>
      </div>

      {/* 今日の日付表示 */}
      <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
          📅 {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })} のタスク
        </p>
      </div>

      {/* タスク一覧 */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">今日のタスクがありません</p>
          <p className="text-sm mt-2">新しいタスクを作成してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              projects={projects}
              modes={modes}
              tags={tags}
              onEdit={onEdit}
              onDelete={onDelete}
              onStartTimer={onStartTimer}
              onStopTimer={onStopTimer}
            />
          ))}
        </div>
      )}
    </div>
  )
}

