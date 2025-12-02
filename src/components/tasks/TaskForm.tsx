import { useState, useEffect } from 'react'
import { Task, RepeatPattern, Project, Mode, Tag, RepeatConfig } from '../../types'

interface TaskFormProps {
  task?: Task
  tasks: Task[] // 過去の実績時間を計算するために必要
  projects: Project[]
  modes: Mode[]
  tags: Tag[]
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

/**
 * ISO文字列をローカル時間のdatetime-local形式に変換
 */
function toLocalDateTime(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * 過去の類似タイトルのタスクを検索
 * タイトルが部分一致するタスクを検索してリストを返す
 */
function findSimilarTasks(tasks: Task[], title: string, currentTaskId?: string): Task[] {
  if (!title.trim()) {
    return []
  }
  
  const titleLower = title.trim().toLowerCase()
  const titleWords = titleLower.split(/\s+/).filter(w => w.length > 0)
  
  // 現在編集中のタスクを除外
  const pastTasks = tasks.filter(t => t.id !== currentTaskId)
  
  if (pastTasks.length === 0) {
    return []
  }
  
  // タイトルが部分一致するタスクを検索
  // 1. 完全一致を優先
  let matchedTasks = pastTasks.filter(t => 
    t.title.toLowerCase() === titleLower
  )
  
  // 2. 完全一致がない場合、タイトルに含まれるキーワードで部分一致
  if (matchedTasks.length === 0 && titleWords.length > 0) {
    matchedTasks = pastTasks.filter(t => {
      const taskTitleLower = t.title.toLowerCase()
      // 入力されたタイトルの単語のうち、50%以上が含まれている場合
      const matchedWords = titleWords.filter(word => taskTitleLower.includes(word))
      return matchedWords.length >= Math.ceil(titleWords.length * 0.5)
    })
  }
  
  // 3. それでも見つからない場合、タイトルが部分的に含まれている場合
  if (matchedTasks.length === 0) {
    matchedTasks = pastTasks.filter(t => {
      const taskTitleLower = t.title.toLowerCase()
      // 入力されたタイトルの一部が含まれている、または逆に含まれている
      return taskTitleLower.includes(titleLower) || titleLower.includes(taskTitleLower)
    })
  }
  
  // 作成日が新しい順にソート（最大5件）
  return matchedTasks
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
}

/**
 * 過去の類似タイトルのタスクの平均実績時間を計算（分単位）
 */
function calculateAverageElapsedTime(tasks: Task[], title: string, currentTaskId?: string): number | null {
  const similarTasks = findSimilarTasks(tasks, title, currentTaskId)
  const tasksWithElapsedTime = similarTasks.filter(t => 
    t.elapsedTime !== undefined && t.elapsedTime > 0
  )
  
  if (tasksWithElapsedTime.length === 0) {
    return null
  }
  
  // 秒を分に変換して平均を計算
  const totalMinutes = tasksWithElapsedTime.reduce((sum, t) => sum + Math.floor((t.elapsedTime || 0) / 60), 0)
  return Math.round(totalMinutes / tasksWithElapsedTime.length)
}

export default function TaskForm({ task, tasks, projects, modes, tags, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [projectId, setProjectId] = useState(task?.projectId || '')
  const [modeId, setModeId] = useState(task?.modeId || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(task?.tagIds || [])
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>(task?.repeatPattern || 'none')
  const [repeatInterval, setRepeatInterval] = useState(task?.repeatConfig?.interval || 1)
  const [repeatEndDate, setRepeatEndDate] = useState(
    task?.repeatConfig?.endDate ? new Date(task.repeatConfig.endDate).toISOString().split('T')[0] : ''
  )
  const [repeatDaysOfWeek, setRepeatDaysOfWeek] = useState<number[]>(task?.repeatConfig?.daysOfWeek || [])
  const [repeatDayOfMonth, setRepeatDayOfMonth] = useState(task?.repeatConfig?.dayOfMonth || 1)
  // 開始・終了時間
  const [startTime, setStartTime] = useState(
    task?.startTime ? toLocalDateTime(task.startTime) : ''
  )
  const [endTime, setEndTime] = useState(
    task?.endTime ? toLocalDateTime(task.endTime) : ''
  )
  // 予定時間（分）
  const [estimatedTime, setEstimatedTime] = useState<number | ''>(task?.estimatedTime || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // 過去の類似タスクを検索
  const similarTasks = title.trim() 
    ? findSimilarTasks(tasks, title.trim(), task?.id)
    : []
  
  // 過去の実績時間を計算
  const averageElapsedTime = similarTasks.length > 0
    ? calculateAverageElapsedTime(tasks, title.trim(), task?.id)
    : null
  
  // 類似タスクを選択したときにフォームに反映
  const handleSelectSimilarTask = (similarTask: Task) => {
    // タイトルを設定
    setTitle(similarTask.title)
    
    // 予定時間を設定（実績時間がある場合はそれを分に変換、なければ既存の予定時間）
    if (similarTask.elapsedTime && similarTask.elapsedTime > 0) {
      setEstimatedTime(Math.floor(similarTask.elapsedTime / 60))
    } else if (similarTask.estimatedTime) {
      setEstimatedTime(similarTask.estimatedTime)
    }
    
    // プロジェクト、モード、タグを設定
    if (similarTask.projectId) {
      setProjectId(similarTask.projectId)
    }
    if (similarTask.modeId) {
      setModeId(similarTask.modeId)
    }
    if (similarTask.tagIds && similarTask.tagIds.length > 0) {
      setSelectedTagIds(similarTask.tagIds)
    }
  }

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setProjectId(task.projectId || '')
      setModeId(task.modeId || '')
      setSelectedTagIds(task.tagIds || [])
      setRepeatPattern(task.repeatPattern || 'none')
      setRepeatInterval(task.repeatConfig?.interval || 1)
      setRepeatEndDate(task.repeatConfig?.endDate ? new Date(task.repeatConfig.endDate).toISOString().split('T')[0] : '')
      setRepeatDaysOfWeek(task.repeatConfig?.daysOfWeek || [])
      setRepeatDayOfMonth(task.repeatConfig?.dayOfMonth || 1)
      setStartTime(task.startTime ? toLocalDateTime(task.startTime) : '')
      setEndTime(task.endTime ? toLocalDateTime(task.endTime) : '')
      setEstimatedTime(task.estimatedTime || '')
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

    const newStartTime = startTime ? new Date(startTime).toISOString() : undefined
    const newEndTime = endTime ? new Date(endTime).toISOString() : undefined
    
    const submitData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      projectId: projectId || undefined,
      modeId: modeId || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      repeatPattern,
      repeatConfig,
      startTime: newStartTime,
      endTime: newEndTime,
      estimatedTime: estimatedTime !== '' ? (typeof estimatedTime === 'number' ? estimatedTime : parseInt(String(estimatedTime)) || undefined) : undefined,
    }
    
    // 開始時間と終了時間の両方がある場合、経過時間を再計算
    if (newStartTime && newEndTime) {
      const start = new Date(newStartTime).getTime()
      const end = new Date(newEndTime).getTime()
      const elapsed = Math.floor((end - start) / 1000)
      submitData.elapsedTime = elapsed > 0 ? elapsed : (task?.elapsedTime || 0)
    } else if (task?.elapsedTime !== undefined) {
      submitData.elapsedTime = task.elapsedTime
    }
    
    onSubmit(submitData)
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
        {averageElapsedTime !== null && (
          <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
            💡 過去の平均実績時間: {averageElapsedTime}分
          </p>
        )}
      </div>

      {/* 類似タスクの候補 */}
      {similarTasks.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            📋 似ている過去のタスク（クリックで情報を自動入力）
          </p>
          <div className="space-y-2">
            {similarTasks.map((similarTask) => {
              const elapsedMinutes = similarTask.elapsedTime 
                ? Math.floor(similarTask.elapsedTime / 60)
                : null
              const estimatedMinutes = similarTask.estimatedTime || null
              const project = projects.find(p => p.id === similarTask.projectId)
              const mode = modes.find(m => m.id === similarTask.modeId)
              const taskTags = similarTask.tagIds 
                ? tags.filter(t => similarTask.tagIds!.includes(t.id))
                : []
              
              return (
                <button
                  key={similarTask.id}
                  type="button"
                  onClick={() => handleSelectSimilarTask(similarTask)}
                  className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {similarTask.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {elapsedMinutes !== null && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            ⏱️ 実績: {elapsedMinutes}分
                          </span>
                        )}
                        {estimatedMinutes !== null && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            ⏰ 予定: {estimatedMinutes}分
                          </span>
                        )}
                        {project && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                            {project.name}
                          </span>
                        )}
                        {mode && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded text-white"
                            style={mode.color ? { backgroundColor: mode.color } : { backgroundColor: '#6366F1' }}
                          >
                            {mode.name}
                          </span>
                        )}
                        {taskTags.map(tag => (
                          <span 
                            key={tag.id}
                            className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 text-sm">選択</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          予定時間（分）
        </label>
        <input
          id="estimatedTime"
          type="number"
          min="0"
          value={estimatedTime}
          onChange={(e) => {
            const value = e.target.value
            setEstimatedTime(value === '' ? '' : parseInt(value) || 0)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="予定時間を分で入力（例: 30）"
        />
        {averageElapsedTime !== null && estimatedTime === '' && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            過去の平均実績時間（{averageElapsedTime}分）を参考に設定できます
          </p>
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
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            開始時間
          </label>
          <input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            終了時間
          </label>
          <input
            id="endTime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            プロジェクト
          </label>
          <select
            id="project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">プロジェクトなし</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            モード
          </label>
          <select
            id="mode"
            value={modeId}
            onChange={(e) => setModeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">モードなし</option>
            {modes.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          タグ
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                const newTagIds = selectedTagIds.includes(tag.id)
                  ? selectedTagIds.filter(id => id !== tag.id)
                  : [...selectedTagIds, tag.id]
                setSelectedTagIds(newTagIds)
              }}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? tag.color
                    ? 'text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              style={selectedTagIds.includes(tag.id) && tag.color ? { backgroundColor: tag.color } : {}}
            >
              {tag.name}
            </button>
          ))}
        </div>
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

