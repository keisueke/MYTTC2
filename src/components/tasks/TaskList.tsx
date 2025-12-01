import { useState, useMemo } from 'react'
import { Task, Priority, Category } from '../../types'
import TaskItem from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  categories: Category[]
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStartTimer: (id: string) => void
  onStopTimer: (id: string) => void
}

type FilterType = 'all' | 'active' | 'completed'
type SortType = 'dueDate' | 'priority' | 'createdAt' | 'title'

export default function TaskList({ tasks, categories, onToggle, onEdit, onDelete, onStartTimer, onStopTimer }: TaskListProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('createdAt')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach(cat => map.set(cat.id, cat.name))
    return map
  }, [categories])

  const getCategoryName = (categoryId?: string): string => {
    if (!categoryId) return ''
    return categoryMap.get(categoryId) || ''
  }

  const filteredAndSortedTasks = useMemo(() => {
    // 今日の日付を取得（時刻を0時0分0秒にリセット）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    // 今日のタスクをフィルタリング（完了・未完了関係なく）
    // - 期限が今日または今日以前のタスク
    // - 期限がないタスク
    let filtered = tasks.filter(task => {
      // 期限がないタスクは含める
      if (!task.dueDate) return true
      
      // 期限が今日または今日以前のタスクを含める
      const dueDate = new Date(task.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate <= today
    })

    // 状態フィルタリング
    if (filter === 'active') {
      filtered = filtered.filter(t => !t.completed)
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.completed)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.categoryId === categoryFilter)
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        
        case 'title':
          return a.title.localeCompare(b.title, 'ja')
        
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }, [tasks, filter, priorityFilter, categoryFilter, sortBy])

  return (
    <div className="space-y-4">
      {/* フィルタとソート */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              状態
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">すべて</option>
              <option value="active">未完了</option>
              <option value="completed">完了</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              優先度
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">すべて</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              カテゴリ
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">すべて</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
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
              <option value="dueDate">期限</option>
              <option value="priority">優先度</option>
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
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onStartTimer={onStartTimer}
              onStopTimer={onStopTimer}
              getCategoryName={getCategoryName}
            />
          ))}
        </div>
      )}
    </div>
  )
}

