import { useState, useEffect } from 'react'
import { Task, Priority, RepeatPattern, Category, RepeatConfig } from '../../types'

interface TaskFormProps {
  task?: Task
  categories: Category[]
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export default function TaskForm({ task, categories, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium')
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  )
  const [categoryId, setCategoryId] = useState(task?.categoryId || '')
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>(task?.repeatPattern || 'none')
  const [repeatInterval, setRepeatInterval] = useState(task?.repeatConfig?.interval || 1)
  const [repeatEndDate, setRepeatEndDate] = useState(
    task?.repeatConfig?.endDate ? new Date(task.repeatConfig.endDate).toISOString().split('T')[0] : ''
  )
  const [repeatDaysOfWeek, setRepeatDaysOfWeek] = useState<number[]>(task?.repeatConfig?.daysOfWeek || [])
  const [repeatDayOfMonth, setRepeatDayOfMonth] = useState(task?.repeatConfig?.dayOfMonth || 1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')
      setCategoryId(task.categoryId || '')
      setRepeatPattern(task.repeatPattern || 'none')
      setRepeatInterval(task.repeatConfig?.interval || 1)
      setRepeatEndDate(task.repeatConfig?.endDate ? new Date(task.repeatConfig.endDate).toISOString().split('T')[0] : '')
      setRepeatDaysOfWeek(task.repeatConfig?.daysOfWeek || [])
      setRepeatDayOfMonth(task.repeatConfig?.dayOfMonth || 1)
    }
  }, [task])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!title.trim()) {
      newErrors.title = 'タイトルは必須です'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    let repeatConfig: RepeatConfig | undefined = undefined
    
    if (repeatPattern !== 'none') {
      repeatConfig = {
        interval: repeatInterval,
        endDate: repeatEndDate || undefined,
      }
      
      if (repeatPattern === 'weekly' && repeatDaysOfWeek.length > 0) {
        repeatConfig.daysOfWeek = repeatDaysOfWeek
      }
      
      if (repeatPattern === 'monthly') {
        repeatConfig.dayOfMonth = repeatDayOfMonth
      }
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      completed: task?.completed || false,
      priority,
      dueDate: dueDate || undefined,
      categoryId: categoryId || undefined,
      repeatPattern,
      repeatConfig,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="タスクのタイトルを入力"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          説明
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="タスクの詳細を入力（任意）"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            優先度
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            期限
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          カテゴリ
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">カテゴリなし</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="repeatPattern" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          繰り返し
        </label>
        <select
          id="repeatPattern"
          value={repeatPattern}
          onChange={(e) => setRepeatPattern(e.target.value as RepeatPattern)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="none">なし</option>
          <option value="daily">毎日</option>
          <option value="weekly">毎週</option>
          <option value="monthly">毎月</option>
          <option value="custom">カスタム</option>
        </select>
      </div>

      {repeatPattern !== 'none' && (
        <div className="pl-4 border-l-2 border-blue-200 dark:border-blue-800 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              間隔
            </label>
            <input
              type="number"
              min="1"
              value={repeatInterval}
              onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {repeatPattern === 'daily' && '日'}
              {repeatPattern === 'weekly' && '週間'}
              {repeatPattern === 'monthly' && 'ヶ月'}
              {repeatPattern === 'custom' && '日間隔'}
            </p>
          </div>

          {repeatPattern === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                繰り返す曜日
              </label>
              <div className="flex flex-wrap gap-2">
                {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const newDays = repeatDaysOfWeek.includes(index)
                        ? repeatDaysOfWeek.filter(d => d !== index)
                        : [...repeatDaysOfWeek, index].sort()
                      setRepeatDaysOfWeek(newDays)
                    }}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      repeatDaysOfWeek.includes(index)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {repeatPattern === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                日付
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={repeatDayOfMonth}
                onChange={(e) => setRepeatDayOfMonth(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              終了日（任意）
            </label>
            <input
              type="date"
              value={repeatEndDate}
              onChange={(e) => setRepeatEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {task ? '更新' : '作成'}
        </button>
      </div>
    </form>
  )
}

