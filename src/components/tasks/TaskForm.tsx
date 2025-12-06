import { useState, useEffect } from 'react'
import { Task, RepeatPattern, Project, Mode, Tag, RepeatConfig, Goal, TaskReminder } from '../../types'

interface TaskFormProps {
  task?: Task
  tasks: Task[] // 過去の実績時間を計算するために必要
  projects: Project[]
  modes: Mode[]
  tags: Tag[]
  goals?: Goal[] // 目標リスト（目標選択用）
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

export default function TaskForm({ task, tasks, projects, modes, tags, goals = [], onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [projectId, setProjectId] = useState(task?.projectId || '')
  const [modeId, setModeId] = useState(task?.modeId || '')
  const [goalId, setGoalId] = useState(task?.goalId || '')
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
  // 期限とリマインダー
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
  )
  const [reminderMinutes, setReminderMinutes] = useState<number[]>(
    task?.reminders && task.reminders.length > 0
      ? task.reminders
          .map(r => {
            if (!task.dueDate) return null
            const due = new Date(task.dueDate)
            const reminder = new Date(r.reminderTime)
            return Math.floor((due.getTime() - reminder.getTime()) / (1000 * 60))
          })
          .filter((m): m is number => m !== null)
      : []
  )
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
      setGoalId(task.goalId || '')
      setSelectedTagIds(task.tagIds || [])
      setRepeatPattern(task.repeatPattern || 'none')
      setRepeatInterval(task.repeatConfig?.interval || 1)
      setRepeatEndDate(task.repeatConfig?.endDate ? new Date(task.repeatConfig.endDate).toISOString().split('T')[0] : '')
      setRepeatDaysOfWeek(task.repeatConfig?.daysOfWeek || [])
      setRepeatDayOfMonth(task.repeatConfig?.dayOfMonth || 1)
      setStartTime(task.startTime ? toLocalDateTime(task.startTime) : '')
      setEndTime(task.endTime ? toLocalDateTime(task.endTime) : '')
      setEstimatedTime(task.estimatedTime || '')
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '')
      setReminderMinutes(
        task?.reminders && task.reminders.length > 0
          ? task.reminders
              .map(r => {
                if (!task.dueDate) return null
                const due = new Date(task.dueDate)
                const reminder = new Date(r.reminderTime)
                return Math.floor((due.getTime() - reminder.getTime()) / (1000 * 60))
              })
              .filter((m): m is number => m !== null)
          : []
      )
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
    const newDueDate = dueDate ? new Date(dueDate).toISOString() : undefined
    
    // リマインダーを生成
    let reminders: TaskReminder[] | undefined = undefined
    if (newDueDate && reminderMinutes.length > 0) {
      const due = new Date(newDueDate)
      reminders = reminderMinutes.map((minutes) => {
        const reminderTime = new Date(due.getTime() - minutes * 60 * 1000)
        return {
          id: crypto.randomUUID(),
          taskId: task?.id || '',
          reminderTime: reminderTime.toISOString(),
          notified: false,
          createdAt: new Date().toISOString(),
        }
      })
    }
    
    const submitData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      projectId: projectId || undefined,
      modeId: modeId || undefined,
      goalId: goalId || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      repeatPattern,
      repeatConfig,
      startTime: newStartTime,
      endTime: newEndTime,
      estimatedTime: estimatedTime !== '' ? (typeof estimatedTime === 'number' ? estimatedTime : parseInt(String(estimatedTime)) || undefined) : undefined,
      dueDate: newDueDate,
      reminders,
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
        <label htmlFor="title" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          タイトル <span className="text-[var(--color-error)]">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`input-industrial w-full ${
            errors.title ? 'border-[var(--color-error)]' : ''
          }`}
          placeholder="タスクのタイトルを入力"
        />
        {errors.title && (
          <p className="mt-1 font-display text-xs text-[var(--color-error)]">{errors.title}</p>
        )}
        {averageElapsedTime !== null && (
          <p className="mt-1 font-display text-xs text-[var(--color-secondary)]">
            💡 過去の平均実績時間: {averageElapsedTime}分
          </p>
        )}
      </div>

      {/* 類似タスクの候補 */}
      {similarTasks.length > 0 && (
        <div className="p-4 bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30">
          <p className="font-display text-xs font-medium text-[var(--color-secondary)] mb-2">
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
                  className="w-full text-left card-industrial p-3 hover:border-[var(--color-secondary)] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-medium text-[var(--color-text-primary)]">
                        {similarTask.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {elapsedMinutes !== null && (
                          <span className="font-display text-xs text-[var(--color-text-secondary)]">
                            ⏱️ 実績: {elapsedMinutes}分
                          </span>
                        )}
                        {estimatedMinutes !== null && (
                          <span className="font-display text-xs text-[var(--color-text-secondary)]">
                            ⏰ 予定: {estimatedMinutes}分
                          </span>
                        )}
                        {project && (
                          <span className="tag-industrial text-xs">
                            {project.name}
                          </span>
                        )}
                        {mode && (
                          <span 
                            className="tag-industrial text-xs"
                            style={mode.color ? { backgroundColor: mode.color, borderColor: mode.color, color: '#0c0c0c' } : {}}
                          >
                            {mode.name}
                          </span>
                        )}
                        {taskTags.map(tag => (
                          <span 
                            key={tag.id}
                            className="tag-industrial text-xs"
                            style={tag.color ? { borderColor: tag.color, color: tag.color } : {}}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="font-display text-xs text-[var(--color-secondary)]">選択</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="estimatedTime" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
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
          className="input-industrial w-full"
          placeholder="予定時間を分で入力（例: 30）"
        />
        {averageElapsedTime !== null && estimatedTime === '' && (
          <p className="mt-1 font-display text-xs text-[var(--color-text-tertiary)]">
            過去の平均実績時間（{averageElapsedTime}分）を参考に設定できます
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          説明
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input-industrial w-full resize-none"
          placeholder="タスクの詳細を入力（任意）"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            開始時間
          </label>
          <input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input-industrial w-full"
          />
        </div>

        <div>
          <label htmlFor="endTime" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            終了時間
          </label>
          <input
            id="endTime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="input-industrial w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="project" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            プロジェクト
          </label>
          <select
            id="project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="input-industrial w-full"
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
          <label htmlFor="mode" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            モード
          </label>
          <select
            id="mode"
            value={modeId}
            onChange={(e) => setModeId(e.target.value)}
            className="input-industrial w-full"
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

      {goals.length > 0 && (
        <div>
          <label htmlFor="goal" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            目標
          </label>
          <select
            id="goal"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="input-industrial w-full"
          >
            <option value="">目標なし</option>
            {(() => {
              // 年とカテゴリーでグループ化
              const goalsByYear = goals.reduce((acc, goal) => {
                if (!acc[goal.year]) {
                  acc[goal.year] = []
                }
                acc[goal.year].push(goal)
                return acc
              }, {} as Record<number, typeof goals>)
              
              const categoryLabels: Record<string, string> = {
                'social-contribution': '社会貢献',
                'family': '家族',
                'relationships': '人間関係',
                'hobby': '趣味',
                'work': '仕事',
                'finance': 'ファイナンス',
                'health': '健康',
                'intelligence': '知性',
                'other': 'その他',
              }
              
              return Object.keys(goalsByYear)
                .sort((a, b) => Number(b) - Number(a))
                .map(year => {
                  const yearGoals = goalsByYear[Number(year)]
                  const goalsByCategory = yearGoals.reduce((acc, goal) => {
                    if (!acc[goal.category]) {
                      acc[goal.category] = []
                    }
                    acc[goal.category].push(goal)
                    return acc
                  }, {} as Record<string, typeof yearGoals>)
                  
                  return (
                    <optgroup key={year} label={`${year}年`}>
                      {Object.keys(goalsByCategory)
                        .sort()
                        .map(category => {
                          const categoryGoals = goalsByCategory[category]
                          return categoryGoals.map(goal => (
                            <option key={goal.id} value={goal.id}>
                              [{categoryLabels[category] || category}] {goal.title}
                            </option>
                          ))
                        })}
                    </optgroup>
                  )
                })
            })()}
          </select>
        </div>
      )}

      <div>
        <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          タグ
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  const newTagIds = isSelected
                    ? selectedTagIds.filter(id => id !== tag.id)
                    : [...selectedTagIds, tag.id]
                  setSelectedTagIds(newTagIds)
                }}
                className={`tag-industrial transition-all duration-200 relative ${
                  isSelected
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-bg-primary)] ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg-primary)] shadow-lg scale-105'
                    : 'hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)]'
                }`}
                style={isSelected && tag.color ? { 
                  backgroundColor: tag.color, 
                  borderColor: tag.color, 
                  color: '#0c0c0c',
                  boxShadow: `0 4px 6px -1px ${tag.color}40, 0 2px 4px -1px ${tag.color}20`
                } : {}}
              >
                {isSelected && (
                  <svg 
                    className="w-3 h-3 mr-1.5 flex-shrink-0" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                )}
                <span>{tag.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="repeatPattern" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          繰り返し
        </label>
        <select
          id="repeatPattern"
          value={repeatPattern}
          onChange={(e) => setRepeatPattern(e.target.value as RepeatPattern)}
          className="input-industrial w-full"
        >
          <option value="none">なし</option>
          <option value="daily">毎日</option>
          <option value="weekly">毎週</option>
          <option value="monthly">毎月</option>
          <option value="custom">カスタム</option>
        </select>
      </div>

      {repeatPattern !== 'none' && (
        <div className="pl-4 border-l-2 border-[var(--color-secondary)]/30 space-y-3">
          <div>
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              間隔
            </label>
            <input
              type="number"
              min="1"
              value={repeatInterval}
              onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
              className="input-industrial w-full"
            />
            <p className="mt-1 font-display text-xs text-[var(--color-text-tertiary)]">
              {repeatPattern === 'daily' && '日'}
              {repeatPattern === 'weekly' && '週間'}
              {repeatPattern === 'monthly' && 'ヶ月'}
              {repeatPattern === 'custom' && '日間隔'}
            </p>
          </div>

          {repeatPattern === 'weekly' && (
            <div>
              <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
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
                    className={`tag-industrial transition-all duration-200 ${
                      repeatDaysOfWeek.includes(index)
                        ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-bg-primary)]'
                        : 'hover:border-[var(--color-accent)]'
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
              <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                日付
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={repeatDayOfMonth}
                onChange={(e) => setRepeatDayOfMonth(parseInt(e.target.value) || 1)}
                className="input-industrial w-full"
              />
            </div>
          )}

          <div>
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              終了日（任意）
            </label>
            <input
              type="date"
              value={repeatEndDate}
              onChange={(e) => setRepeatEndDate(e.target.value)}
              className="input-industrial w-full"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="dueDate" className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
          期限
        </label>
        <input
          id="dueDate"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="input-industrial w-full"
        />
      </div>

      {dueDate && (
        <div className="pl-4 border-l-2 border-[var(--color-secondary)]/30 space-y-3">
          <div>
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              リマインダー（期限の何分前に通知）
            </label>
            <div className="space-y-2">
              {[0, 15, 30, 60, 120, 1440].map((minutes) => {
                const hours = Math.floor(minutes / 60)
                const mins = minutes % 60
                const label =
                  minutes === 0
                    ? '期限時刻'
                    : hours > 0
                    ? `${hours}時間${mins > 0 ? `${mins}分` : ''}前`
                    : `${minutes}分前`
                
                return (
                  <label key={minutes} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderMinutes.includes(minutes)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReminderMinutes([...reminderMinutes, minutes].sort((a, b) => b - a))
                        } else {
                          setReminderMinutes(reminderMinutes.filter(m => m !== minutes))
                        }
                      }}
                      className="w-4 h-4 accent-[var(--color-accent)]"
                    />
                    <span className="font-display text-sm text-[var(--color-text-primary)]">
                      {label}
                    </span>
                  </label>
                )
              })}
              <div className="mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderMinutes.some(m => ![0, 15, 30, 60, 120, 1440].includes(m))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // カスタム時間を入力
                        const customMinutes = prompt('通知する時間（分）を入力してください:')
                        if (customMinutes) {
                          const minutes = parseInt(customMinutes)
                          if (!isNaN(minutes) && minutes >= 0) {
                            setReminderMinutes([...reminderMinutes, minutes].sort((a, b) => b - a))
                          }
                        }
                      } else {
                        // カスタム時間を削除
                        setReminderMinutes(reminderMinutes.filter(m => [0, 15, 30, 60, 120, 1440].includes(m)))
                      }
                    }}
                    className="w-4 h-4 accent-[var(--color-accent)]"
                  />
                  <span className="font-display text-sm text-[var(--color-text-primary)]">
                    カスタム時間
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={onCancel}
          className="btn-industrial"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="btn-industrial"
        >
          {task ? '更新' : '作成'}
        </button>
      </div>
    </form>
  )
}

