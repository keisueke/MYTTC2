import { Task, Project, Mode, Tag, Wish, Goal, Memo, MemoTemplate, DailyRecord, SummaryConfig, WeatherConfig, AppData, SubTask, DashboardLayoutConfig, RoutineExecution, TimeSectionSettings, TimeSectionDayConfig, TimeSection, Weekday } from '../types'
import { getStoredTheme, saveTheme as saveThemeToStorage } from '../utils/theme'
import { getWeatherConfig as getWeatherConfigFromStorage, saveWeatherConfig as saveWeatherConfigToStorage } from '../utils/weatherConfig'
import { isRepeatTaskForToday, generateTodayRepeatTask } from '../utils/repeatUtils'
import { sanitizeText } from '../utils/validation'

const STORAGE_KEY = 'mytcc2_data'

/**
 * LocalStorageからデータを読み込む
 */
export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored) as AppData

      // データ修復: createdAtが欠落しているタスクを修復
      let needsSave = false
      if (data.tasks && Array.isArray(data.tasks)) {
        for (const task of data.tasks) {
          if (!task.createdAt) {
            // createdAtが欠落している場合、updatedAtを使用するか、現在時刻を設定
            task.createdAt = task.updatedAt || toLocalISOString(new Date())
            needsSave = true
            console.warn(`[Data Repair] Task "${task.title}" (${task.id}) was missing createdAt, set to ${task.createdAt}`)
          }
          if (!task.updatedAt) {
            task.updatedAt = task.createdAt
            needsSave = true
          }
        }
      }

      // 修復が必要な場合は保存
      if (needsSave) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
          console.log('[Data Repair] Fixed tasks with missing createdAt/updatedAt')
        } catch (e) {
          console.error('[Data Repair] Failed to save repaired data:', e)
        }
      }

      return data
    }
  } catch (error) {
    console.error('Failed to load data from localStorage:', error)
  }

  // デフォルトデータを返す
  return {
    tasks: [],
    projects: [],
    modes: [],
    tags: [],
    wishes: [],
    goals: [],
    memos: [],
    memoTemplates: [],
    dailyRecords: [],
    subTasks: [],
    routineExecutions: [],
  }
}

/**
 * LocalStorageにデータを保存する
 */
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    // データ変更を通知するカスタムイベントを発火
    window.dispatchEvent(new Event('mytcc2:dataChanged'))
  } catch (error) {
    console.error('Failed to save data to localStorage:', error)
    throw new Error('データの保存に失敗しました')
  }
}

/**
 * すべてのデータをクリアする（テスト用）
 */
export function clearAllData(): void {
  try {
    const defaultData: AppData = {
      tasks: [],
      projects: [],
      modes: [],
      tags: [],
      wishes: [],
      goals: [],
      memos: [],
      memoTemplates: [],
      dailyRecords: [],
      subTasks: [],
      routineExecutions: [],
    }
    saveData(defaultData)
  } catch (error) {
    console.error('Failed to clear data:', error)
    throw new Error('データの削除に失敗しました')
  }
}

/**
 * タスクを取得する
 */
export function getTasks(): Task[] {
  const data = loadData()
  return data.tasks.filter(t => !t.deletedAt)
}

/**
 * IDでタスクを取得する
 */
export function getTaskById(id: string): Task | undefined {
  const data = loadData()
  return data.tasks.find(t => t.id === id)
}

/**
 * ローカル時間をISO形式の文字列に変換（タイムゾーンを保持）
 */
function toLocalISOString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  // タイムゾーンオフセットを取得
  const tzOffset = -date.getTimezoneOffset()
  const tzSign = tzOffset >= 0 ? '+' : '-'
  const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0')
  const tzMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${tzSign}${tzHours}:${tzMinutes}`
}

/**
 * タスクを追加する
 * @param task タスクデータ
 * @param referenceDate 基準日付（指定された場合、その日付の現在時刻でcreatedAtを設定）
 */
export function addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, referenceDate?: Date): Task {
  const data = loadData()

  // 順序が指定されていない場合、最大のorder + 1を設定
  let order = task.order
  if (order === undefined) {
    const maxOrder = data.tasks
      .filter(t => t.order !== undefined)
      .reduce((max, t) => Math.max(max, t.order!), -1)
    order = maxOrder + 1
  }

  // createdAtの日付を決定
  // referenceDateが指定された場合、その日付の現在時刻を使用
  let createdAt: string
  if (referenceDate) {
    const now = new Date()
    const refDate = new Date(referenceDate)
    refDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
    createdAt = toLocalISOString(refDate)
  } else {
    createdAt = toLocalISOString(new Date())
  }

  // 最終防衛線: テキストフィールドをサニタイズ（制御文字を削除）
  const sanitizedTask = {
    ...task,
    title: sanitizeText(task.title),
    description: task.description ? sanitizeText(task.description) : undefined,
  }

  const newTask: Task = {
    ...sanitizedTask,
    id: crypto.randomUUID(),
    createdAt,
    updatedAt: toLocalISOString(new Date()),
    order,
  }

  data.tasks.push(newTask)
  saveData(data)
  return newTask
}

/**
 * タスクを更新する
 */
export function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task {
  const data = loadData()
  const taskIndex = data.tasks.findIndex(t => t.id === id)

  if (taskIndex === -1) {
    throw new Error(`Task with id ${id} not found`)
  }

  // 最終防衛線: テキストフィールドをサニタイズ（制御文字を削除）
  const sanitizedUpdates: Partial<Omit<Task, 'id' | 'createdAt'>> = { ...updates }
  if (updates.title !== undefined) {
    sanitizedUpdates.title = sanitizeText(updates.title)
  }
  if (updates.description !== undefined && updates.description !== null) {
    sanitizedUpdates.description = sanitizeText(updates.description)
  }

  const updatedTask: Task = {
    ...data.tasks[taskIndex],
    ...sanitizedUpdates,
    updatedAt: new Date().toISOString(),
  }

  data.tasks[taskIndex] = updatedTask
  saveData(data)
  return updatedTask
}

/**
 * タスクを削除する
 */
export function deleteTask(id: string): void {
  const data = loadData()
  const taskIndex = data.tasks.findIndex(t => t.id === id)

  if (taskIndex === -1) {
    throw new Error(`Task with id ${id} not found`)
  }

  const task = data.tasks[taskIndex]
  task.deletedAt = new Date().toISOString()
  task.updatedAt = new Date().toISOString()
  saveData(data)
}

/**
 * タスクの順番を変更する
 */
export function reorderTasks(taskIds: string[]): void {
  const data = loadData()

  // 指定された順序でorderを更新
  taskIds.forEach((taskId, index) => {
    const task = data.tasks.find(t => t.id === taskId)
    if (task) {
      task.order = index
      task.updatedAt = new Date().toISOString()
    }
  })

  saveData(data)
}

/**
 * タスクの順番を移動（フィルタリングされたリスト内での移動）
 */
export function moveTaskToPosition(taskId: string, newIndex: number, filteredTaskIds: string[]): void {
  const data = loadData()

  // フィルタリングされたタスクの順番を更新
  const reorderedIds = [...filteredTaskIds]
  const currentIndex = reorderedIds.indexOf(taskId)

  if (currentIndex === -1 || currentIndex === newIndex) {
    return // 移動不要
  }

  // 配列から削除して新しい位置に挿入
  reorderedIds.splice(currentIndex, 1)
  reorderedIds.splice(newIndex, 0, taskId)

  // 新しい順番でorderを更新
  reorderedIds.forEach((id, index) => {
    const task = data.tasks.find(t => t.id === id)
    if (task) {
      task.order = index
      task.updatedAt = new Date().toISOString()
    }
  })

  saveData(data)
}

/**
 * タスクを上に移動
 */
export function moveTaskUp(id: string): Task {
  const data = loadData()
  const task = data.tasks.find(t => t.id === id)

  if (!task) {
    throw new Error(`Task with id ${id} not found`)
  }

  // orderでソート
  const sortedTasks = [...data.tasks].sort((a, b) => {
    const aOrder = a.order ?? Infinity
    const bOrder = b.order ?? Infinity
    return aOrder - bOrder
  })

  const currentIndex = sortedTasks.findIndex(t => t.id === id)

  if (currentIndex === 0) {
    // 既に最上位
    return task
  }

  const previousTask = sortedTasks[currentIndex - 1]

  // orderを入れ替え
  const tempOrder = task.order
  task.order = previousTask.order
  previousTask.order = tempOrder

  task.updatedAt = new Date().toISOString()
  previousTask.updatedAt = new Date().toISOString()

  saveData(data)
  return task
}

/**
 * タスクを下に移動
 */
export function moveTaskDown(id: string): Task {
  const data = loadData()
  const task = data.tasks.find(t => t.id === id)

  if (!task) {
    throw new Error(`Task with id ${id} not found`)
  }

  // orderでソート
  const sortedTasks = [...data.tasks].sort((a, b) => {
    const aOrder = a.order ?? Infinity
    const bOrder = b.order ?? Infinity
    return aOrder - bOrder
  })

  const currentIndex = sortedTasks.findIndex(t => t.id === id)

  if (currentIndex === sortedTasks.length - 1) {
    // 既に最下位
    return task
  }

  const nextTask = sortedTasks[currentIndex + 1]

  // orderを入れ替え
  const tempOrder = task.order
  task.order = nextTask.order
  nextTask.order = tempOrder

  task.updatedAt = new Date().toISOString()
  nextTask.updatedAt = new Date().toISOString()

  saveData(data)
  return task
}

/**
 * タスクをコピーする（完了状態をリセットして新しいタスクとして作成）
 */
export function copyTask(id: string): Task {
  const data = loadData()
  const task = data.tasks.find(t => t.id === id)

  if (!task) {
    throw new Error(`Task with id ${id} not found`)
  }

  // 完了状態をリセットして新しいタスクを作成
  const newTask: Task = {
    ...task,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: undefined,
    isRunning: false,
    startTime: undefined,
    endTime: undefined,
    elapsedTime: 0, // 経過時間もリセット
  }

  data.tasks.push(newTask)
  saveData(data)
  return newTask
}

/**
 * ローカル日付文字列を取得（YYYY-MM-DD形式）
 */
export function toLocalDateStr(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * タスクのタイマーを開始
 */
export function startTaskTimer(id: string): Task {
  const data = loadData()
  const task = data.tasks.find(t => t.id === id)

  if (!task) {
    throw new Error(`Task with id ${id} not found`)
  }

  // 他の実行中のタスクを停止
  data.tasks.forEach(t => {
    if (t.isRunning && t.id !== id) {
      stopTaskTimer(t.id)
    }
  })

  const now = new Date()
  const startTime = toLocalISOString(now)
  const today = toLocalDateStr(now)

  // ルーティンタスクの場合は、RoutineExecutionも更新
  if (task.repeatPattern !== 'none') {
    if (!data.routineExecutions) {
      data.routineExecutions = []
    }

    let execution = data.routineExecutions.find(e =>
      e.routineTaskId === task.id && e.date.startsWith(today)
    )

    if (!execution) {
      // 実行記録が存在しない場合は作成
      execution = addRoutineExecution({
        routineTaskId: task.id,
        date: today,
        startTime,
      })
    } else {
      // 既存の実行記録を更新
      execution = updateRoutineExecution(execution.id, {
        startTime,
      })
    }
  }

  return updateTask(id, {
    isRunning: true,
    startTime,
    endTime: undefined,
  })
}

/**
 * タスクのタイマーを停止
 */
export function stopTaskTimer(id: string): Task {
  const data = loadData()
  const task = data.tasks.find(t => t.id === id)

  if (!task) {
    throw new Error(`Task with id ${id} not found`)
  }

  const now = new Date()
  const endTime = toLocalISOString(now)
  const today = toLocalDateStr(now)

  let updates: Partial<Omit<Task, 'id' | 'createdAt'>> = {
    isRunning: false,
    endTime,
    completedAt: endTime, // タイマー停止時に完了時刻を設定
  }

  // タイマーが実行中の場合、経過時間を計算
  let elapsed = 0
  if (task.isRunning && task.startTime) {
    elapsed = Math.floor((now.getTime() - new Date(task.startTime).getTime()) / 1000)
    const totalElapsed = (task.elapsedTime || 0) + elapsed
    updates.elapsedTime = totalElapsed
    // 開始時間は保持する
  } else if (!task.startTime) {
    // タイマーが開始されていない場合でも、終了時間を記録
    updates.startTime = endTime // 開始時間がない場合は終了時間を開始時間として記録
  }

  // ルーティンタスクの場合は、RoutineExecutionも更新
  if (task.repeatPattern !== 'none') {
    if (!data.routineExecutions) {
      data.routineExecutions = []
    }

    let execution = data.routineExecutions.find(e =>
      e.routineTaskId === task.id && e.date.startsWith(today)
    )

    if (execution) {
      // 既存の実行記録を更新
      const executionElapsed = (execution.elapsedTime || 0) + elapsed
      updateRoutineExecution(execution.id, {
        endTime,
        completedAt: endTime,
        elapsedTime: executionElapsed,
      })
    }
  }

  return updateTask(id, updates)
}

/**
 * タスクのタイマーをリセット
 */
export function resetTaskTimer(id: string): Task {
  return updateTask(id, {
    isRunning: false,
    startTime: undefined,
    endTime: undefined,
    elapsedTime: 0,
  })
}

/**
 * プロジェクトを取得する
 */
export function getProjects(): Project[] {
  const data = loadData()
  return (data.projects || []).filter(p => !p.deletedAt)
}

/**
 * プロジェクトを追加する
 */
export function addProject(project: Omit<Project, 'id' | 'createdAt'>): Project {
  const data = loadData()
  // 最終防衛線: プロジェクト名をサニタイズ
  const sanitizedProject = {
    ...project,
    name: sanitizeText(project.name),
  }
  const newProject: Project = {
    ...sanitizedProject,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }

  if (!data.projects) {
    data.projects = []
  }
  data.projects.push(newProject)
  saveData(data)
  return newProject
}

/**
 * プロジェクトを更新する
 */
export function updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Project {
  const data = loadData()
  if (!data.projects) {
    data.projects = []
  }
  const projectIndex = data.projects.findIndex(p => p.id === id)

  if (projectIndex === -1) {
    throw new Error(`Project with id ${id} not found`)
  }

  // 最終防衛線: プロジェクト名をサニタイズ
  const sanitizedUpdates: Partial<Omit<Project, 'id' | 'createdAt'>> = { ...updates }
  if (updates.name !== undefined) {
    sanitizedUpdates.name = sanitizeText(updates.name)
  }

  const updatedProject: Project = {
    ...data.projects[projectIndex],
    ...sanitizedUpdates,
  }

  data.projects[projectIndex] = updatedProject
  saveData(data)
  return updatedProject
}

/**
 * プロジェクトを削除する
 */
export function deleteProject(id: string): void {
  const data = loadData()
  if (!data.projects) {
    return
  }
  const projectIndex = data.projects.findIndex(p => p.id === id)

  if (projectIndex === -1) {
    throw new Error(`Project with id ${id} not found`)
  }

  // プロジェクトを使用しているタスクのprojectIdをクリア
  data.tasks.forEach(task => {
    if (task.projectId === id) {
      task.projectId = undefined
    }
  })

  const project = data.projects[projectIndex]
  project.deletedAt = new Date().toISOString()
  // プロジェクト名は更新しない（履歴のため）
  saveData(data)
}

/**
 * モードを取得する
 */
export function getModes(): Mode[] {
  const data = loadData()
  return (data.modes || []).filter(m => !m.deletedAt)
}

/**
 * モードを追加する
 */
export function addMode(mode: Omit<Mode, 'id' | 'createdAt'>): Mode {
  const data = loadData()
  // 最終防衛線: モード名をサニタイズ
  const sanitizedMode = {
    ...mode,
    name: sanitizeText(mode.name),
  }
  const newMode: Mode = {
    ...sanitizedMode,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }

  if (!data.modes) {
    data.modes = []
  }
  data.modes.push(newMode)
  saveData(data)
  return newMode
}

/**
 * モードを更新する
 */
export function updateMode(id: string, updates: Partial<Omit<Mode, 'id' | 'createdAt'>>): Mode {
  const data = loadData()
  if (!data.modes) {
    data.modes = []
  }
  const modeIndex = data.modes.findIndex(m => m.id === id)

  if (modeIndex === -1) {
    throw new Error(`Mode with id ${id} not found`)
  }

  // 最終防衛線: モード名をサニタイズ
  const sanitizedUpdates: Partial<Omit<Mode, 'id' | 'createdAt'>> = { ...updates }
  if (updates.name !== undefined) {
    sanitizedUpdates.name = sanitizeText(updates.name)
  }

  const updatedMode: Mode = {
    ...data.modes[modeIndex],
    ...sanitizedUpdates,
  }

  data.modes[modeIndex] = updatedMode
  saveData(data)
  return updatedMode
}

/**
 * モードを削除する
 */
export function deleteMode(id: string): void {
  const data = loadData()
  if (!data.modes) {
    return
  }
  const modeIndex = data.modes.findIndex(m => m.id === id)

  if (modeIndex === -1) {
    throw new Error(`Mode with id ${id} not found`)
  }

  // モードを使用しているタスクのmodeIdをクリア
  data.tasks.forEach(task => {
    if (task.modeId === id) {
      task.modeId = undefined
    }
  })

  const mode = data.modes[modeIndex]
  mode.deletedAt = new Date().toISOString()
  saveData(data)
}

/**
 * タグを取得する
 */
export function getTags(): Tag[] {
  const data = loadData()
  return (data.tags || []).filter(t => !t.deletedAt)
}

/**
 * タグを追加する
 */
export function addTag(tag: Omit<Tag, 'id' | 'createdAt'>): Tag {
  const data = loadData()
  // 最終防衛線: タグ名をサニタイズ
  const sanitizedTag = {
    ...tag,
    name: sanitizeText(tag.name),
  }
  const newTag: Tag = {
    ...sanitizedTag,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }

  if (!data.tags) {
    data.tags = []
  }
  data.tags.push(newTag)
  saveData(data)
  return newTag
}

/**
 * タグを更新する
 */
export function updateTag(id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>): Tag {
  const data = loadData()
  if (!data.tags) {
    data.tags = []
  }
  const tagIndex = data.tags.findIndex(t => t.id === id)

  if (tagIndex === -1) {
    throw new Error(`Tag with id ${id} not found`)
  }

  // 最終防衛線: タグ名をサニタイズ
  const sanitizedUpdates: Partial<Omit<Tag, 'id' | 'createdAt'>> = { ...updates }
  if (updates.name !== undefined) {
    sanitizedUpdates.name = sanitizeText(updates.name)
  }

  const updatedTag: Tag = {
    ...data.tags[tagIndex],
    ...sanitizedUpdates,
  }

  data.tags[tagIndex] = updatedTag
  saveData(data)
  return updatedTag
}

/**
 * タグを削除する
 */
export function deleteTag(id: string): void {
  const data = loadData()
  if (!data.tags) {
    return
  }
  const tagIndex = data.tags.findIndex(t => t.id === id)

  if (tagIndex === -1) {
    throw new Error(`Tag with id ${id} not found`)
  }

  // タグを使用しているタスクのtagIdsから削除
  data.tasks.forEach(task => {
    if (task.tagIds && task.tagIds.includes(id)) {
      task.tagIds = task.tagIds.filter(tagId => tagId !== id)
      if (task.tagIds.length === 0) {
        task.tagIds = undefined
      }
    }
  })

  const tag = data.tags[tagIndex]
  tag.deletedAt = new Date().toISOString()
  saveData(data)
}

/**
 * Wishを取得する
 */
export function getWishes(): Wish[] {
  const data = loadData()
  return (data.wishes || []).filter(w => !w.deletedAt)
}

/**
 * Wishを追加する
 */
export function addWish(wish: Omit<Wish, 'id' | 'createdAt' | 'updatedAt'>): Wish {
  const data = loadData()
  const newWish: Wish = {
    ...wish,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (!data.wishes) {
    data.wishes = []
  }
  data.wishes.push(newWish)
  saveData(data)
  return newWish
}

/**
 * Wishを更新する
 */
export function updateWish(id: string, updates: Partial<Omit<Wish, 'id' | 'createdAt'>>): Wish {
  const data = loadData()
  if (!data.wishes) {
    data.wishes = []
  }
  const wishIndex = data.wishes.findIndex(w => w.id === id)

  if (wishIndex === -1) {
    throw new Error(`Wish with id ${id} not found`)
  }

  const updatedWish: Wish = {
    ...data.wishes[wishIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  data.wishes[wishIndex] = updatedWish
  saveData(data)
  return updatedWish
}

/**
 * Wishを削除する
 */
export function deleteWish(id: string): void {
  const data = loadData()
  if (!data.wishes) {
    return
  }
  const wishIndex = data.wishes.findIndex(w => w.id === id)

  if (wishIndex === -1) {
    throw new Error(`Wish with id ${id} not found`)
  }

  const wish = data.wishes[wishIndex]
  wish.deletedAt = new Date().toISOString()
  wish.updatedAt = new Date().toISOString()
  saveData(data)
}

/**
 * Goalを取得する
 */
export function getGoals(): Goal[] {
  const data = loadData()
  return (data.goals || []).filter(g => !g.deletedAt)
}

/**
 * Goalを追加する
 */
export function addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Goal {
  const data = loadData()
  const newGoal: Goal = {
    ...goal,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (!data.goals) {
    data.goals = []
  }
  data.goals.push(newGoal)
  saveData(data)
  return newGoal
}

/**
 * Goalを更新する
 */
export function updateGoal(id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>): Goal {
  const data = loadData()
  if (!data.goals) {
    data.goals = []
  }
  const goalIndex = data.goals.findIndex(g => g.id === id)

  if (goalIndex === -1) {
    throw new Error(`Goal with id ${id} not found`)
  }

  const updatedGoal: Goal = {
    ...data.goals[goalIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  data.goals[goalIndex] = updatedGoal
  saveData(data)
  return updatedGoal
}

/**
 * Goalを削除する
 */
export function deleteGoal(id: string): void {
  const data = loadData()
  if (!data.goals) {
    return
  }
  const goalIndex = data.goals.findIndex(g => g.id === id)

  if (goalIndex === -1) {
    throw new Error(`Goal with id ${id} not found`)
  }

  const goal = data.goals[goalIndex]
  goal.deletedAt = new Date().toISOString()
  goal.updatedAt = new Date().toISOString()
  saveData(data)
}

/**
 * Memoを取得する
 */
export function getMemos(): Memo[] {
  const data = loadData()
  return (data.memos || []).filter(m => !m.deletedAt)
}

/**
 * Memoを追加する
 */
export function addMemo(memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>): Memo {
  const data = loadData()
  const newMemo: Memo = {
    ...memo,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (!data.memos) {
    data.memos = []
  }
  data.memos.push(newMemo)
  saveData(data)
  return newMemo
}

/**
 * Memoを更新する
 */
export function updateMemo(id: string, updates: Partial<Omit<Memo, 'id' | 'createdAt'>>): Memo {
  const data = loadData()
  if (!data.memos) {
    data.memos = []
  }
  const memoIndex = data.memos.findIndex(m => m.id === id)

  if (memoIndex === -1) {
    throw new Error(`Memo with id ${id} not found`)
  }

  const updatedMemo: Memo = {
    ...data.memos[memoIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  data.memos[memoIndex] = updatedMemo
  saveData(data)
  return updatedMemo
}

/**
 * Memoを削除する
 */
export function deleteMemo(id: string): void {
  const data = loadData()
  if (!data.memos) {
    return
  }
  const memoIndex = data.memos.findIndex(m => m.id === id)

  if (memoIndex === -1) {
    throw new Error(`Memo with id ${id} not found`)
  }

  const memo = data.memos[memoIndex]
  memo.deletedAt = new Date().toISOString()
  memo.updatedAt = new Date().toISOString()
  saveData(data)
}

/**
 * MemoTemplateを取得する
 */
export function getMemoTemplates(): MemoTemplate[] {
  const data = loadData()
  return (data.memoTemplates || []).filter(t => !t.deletedAt)
}

/**
 * MemoTemplateを追加する
 */
export function addMemoTemplate(template: Omit<MemoTemplate, 'id' | 'createdAt' | 'updatedAt'>): MemoTemplate {
  const data = loadData()
  const newTemplate: MemoTemplate = {
    ...template,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (!data.memoTemplates) {
    data.memoTemplates = []
  }
  data.memoTemplates.push(newTemplate)
  saveData(data)
  return newTemplate
}

/**
 * MemoTemplateを更新する
 */
export function updateMemoTemplate(id: string, updates: Partial<Omit<MemoTemplate, 'id' | 'createdAt'>>): MemoTemplate {
  const data = loadData()
  if (!data.memoTemplates) {
    data.memoTemplates = []
  }
  const templateIndex = data.memoTemplates.findIndex(t => t.id === id)

  if (templateIndex === -1) {
    throw new Error(`MemoTemplate with id ${id} not found`)
  }

  const updatedTemplate: MemoTemplate = {
    ...data.memoTemplates[templateIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  data.memoTemplates[templateIndex] = updatedTemplate
  saveData(data)
  return updatedTemplate
}

/**
 * MemoTemplateを削除する
 */
export function deleteMemoTemplate(id: string): void {
  const data = loadData()
  if (!data.memoTemplates) {
    return
  }
  const templateIndex = data.memoTemplates.findIndex(t => t.id === id)

  if (templateIndex === -1) {
    throw new Error(`MemoTemplate with id ${id} not found`)
  }

  const template = data.memoTemplates[templateIndex]
  template.deletedAt = new Date().toISOString()
  template.updatedAt = new Date().toISOString()
  saveData(data)
}

/**
 * すべての日次記録を取得
 */
export function getDailyRecords(): DailyRecord[] {
  const data = loadData()
  return (data.dailyRecords || []).filter(r => !r.deletedAt)
}

/**
 * 指定日の記録を取得
 */
export function getDailyRecord(date: Date): DailyRecord | undefined {
  const data = loadData()
  if (!data.dailyRecords) {
    return undefined
  }

  const dateStr = toLocalDateStr(date) // YYYY-MM-DD形式
  return data.dailyRecords.find(record => record.date === dateStr)
}

/**
 * 期間指定で記録を取得
 */
export function getDailyRecordsByPeriod(startDate: Date, endDate: Date): DailyRecord[] {
  const data = loadData()
  if (!data.dailyRecords) {
    return []
  }

  const startStr = toLocalDateStr(startDate)
  const endStr = toLocalDateStr(endDate)

  return data.dailyRecords.filter(record => {
    return record.date >= startStr && record.date <= endStr
  }).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * 記録を保存
 */
export function saveDailyRecord(record: Omit<DailyRecord, 'id' | 'createdAt' | 'updatedAt'>): DailyRecord {
  const data = loadData()

  if (!data.dailyRecords) {
    data.dailyRecords = []
  }

  // 最終防衛線: テキストフィールドをサニタイズ
  const sanitizedRecord: Omit<DailyRecord, 'id' | 'createdAt' | 'updatedAt'> = {
    ...record,
    breakfast: record.breakfast ? sanitizeText(record.breakfast) : undefined,
    lunch: record.lunch ? sanitizeText(record.lunch) : undefined,
    dinner: record.dinner ? sanitizeText(record.dinner) : undefined,
    snack: record.snack ? sanitizeText(record.snack) : undefined,
  }

  // 既存の記録を検索
  const existingIndex = data.dailyRecords.findIndex(r => r.date === sanitizedRecord.date)

  if (existingIndex !== -1) {
    // 既存の記録を更新
    const updatedRecord: DailyRecord = {
      ...data.dailyRecords[existingIndex],
      ...sanitizedRecord,
      updatedAt: new Date().toISOString(),
    }
    data.dailyRecords[existingIndex] = updatedRecord
    saveData(data)
    return updatedRecord
  } else {
    // 新しい記録を作成
    const newRecord: DailyRecord = {
      ...sanitizedRecord,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    data.dailyRecords.push(newRecord)
    saveData(data)
    return newRecord
  }
}

/**
 * 設定を取得（デフォルト値: すべてtrue）
 */
export function getSummaryConfig(): SummaryConfig {
  const data = loadData()

  if (data.summaryConfig) {
    return data.summaryConfig
  }

  // デフォルト値（すべてtrue）
  return {
    includeWeight: true,
    includeBedtime: true,
    includeWakeTime: true,
    includeSleepDuration: true,
    includeBreakfast: true,
    includeLunch: true,
    includeDinner: true,
    includeSnack: true,
  }
}

/**
 * 設定を保存
 */
export function saveSummaryConfig(config: SummaryConfig): void {
  const data = loadData()
  data.summaryConfig = config
  saveData(data)
}

/**
 * テーマ設定を取得
 */
export function getTheme(): 'light' | 'dark' {
  const data = loadData()
  if (data.theme) {
    return data.theme
  }
  // AppDataにない場合はLocalStorageから取得
  return getStoredTheme()
}

/**
 * テーマ設定を保存
 */
export function saveTheme(theme: 'light' | 'dark'): void {
  const data = loadData()
  data.theme = theme
  saveData(data)
  // LocalStorageにも保存（後方互換性のため）
  saveThemeToStorage(theme)
}

/**
 * 天気設定を取得
 */
export function getWeatherConfig(): WeatherConfig {
  const data = loadData()
  if (data.weatherConfig) {
    return data.weatherConfig
  }
  // AppDataにない場合はLocalStorageから取得
  return getWeatherConfigFromStorage()
}

/**
 * 天気設定を保存
 */
export function saveWeatherConfig(config: WeatherConfig): void {
  const data = loadData()
  data.weatherConfig = config
  saveData(data)
  // LocalStorageにも保存（後方互換性のため）
  saveWeatherConfigToStorage(config)
}

/**
 * サイドバー表示設定を取得
 */
export function getSidebarVisibility(): boolean {
  const data = loadData()
  return data.sidebarAlwaysVisible ?? false // デフォルトはfalse（非表示）
}

/**
 * サイドバー表示設定を保存
 */
export function saveSidebarVisibility(alwaysVisible: boolean): void {
  const data = loadData()
  data.sidebarAlwaysVisible = alwaysVisible
  saveData(data)
}

/**
 * サイドバー幅を取得
 */
export function getSidebarWidth(): number {
  const data = loadData()
  return data.sidebarWidth ?? 320 // デフォルト: 320px
}

/**
 * サイドバー幅を保存
 */
export function saveSidebarWidth(width: number): void {
  const data = loadData()
  data.sidebarWidth = width
  saveData(data)
}

/**
 * 詳細タスクを取得（親タスクIDでフィルタリング）
 */
export function getSubTasks(taskId?: string): SubTask[] {
  const data = loadData()
  const subTasks = (data.subTasks || []).filter(st => !st.deletedAt)
  if (taskId) {
    return subTasks.filter(st => st.taskId === taskId)
  }
  return subTasks
}

/**
 * 詳細タスクを追加
 */
export function addSubTask(subTask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'>): SubTask {
  const data = loadData()
  if (!data.subTasks) {
    data.subTasks = []
  }

  // 順序が指定されていない場合、最大のorder + 1を設定
  let order = subTask.order
  if (order === undefined) {
    const taskSubTasks = data.subTasks.filter(st => st.taskId === subTask.taskId)
    const maxOrder = taskSubTasks
      .filter(st => st.order !== undefined)
      .reduce((max, st) => Math.max(max, st.order!), -1)
    order = maxOrder + 1
  }

  const newSubTask: SubTask = {
    ...subTask,
    order,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  data.subTasks.push(newSubTask)
  saveData(data)
  return newSubTask
}

/**
 * 詳細タスクを更新
 */
export function updateSubTask(id: string, updates: Partial<Omit<SubTask, 'id' | 'createdAt'>>): SubTask {
  const data = loadData()
  if (!data.subTasks) {
    data.subTasks = []
  }

  const subTaskIndex = data.subTasks.findIndex(st => st.id === id)
  if (subTaskIndex === -1) {
    throw new Error(`SubTask with id ${id} not found`)
  }

  const updatedSubTask: SubTask = {
    ...data.subTasks[subTaskIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  data.subTasks[subTaskIndex] = updatedSubTask
  saveData(data)
  return updatedSubTask
}

/**
 * 詳細タスクを削除
 */
export function deleteSubTask(id: string): void {
  const data = loadData()
  if (!data.subTasks) {
    return
  }

  const subTaskIndex = data.subTasks.findIndex(st => st.id === id)
  if (subTaskIndex === -1) {
    throw new Error(`SubTask with id ${id} not found`)
  }

  const subTask = data.subTasks[subTaskIndex]
  subTask.deletedAt = new Date().toISOString()
  subTask.updatedAt = new Date().toISOString()
  saveData(data)
}

/**
 * 詳細タスクの完了状態を切り替え
 */
export function toggleSubTaskComplete(id: string, completed: boolean): void {
  const data = loadData()
  if (!data.subTasks) {
    return
  }

  const subTaskIndex = data.subTasks.findIndex(st => st.id === id)
  if (subTaskIndex === -1) {
    throw new Error(`SubTask with id ${id} not found`)
  }

  data.subTasks[subTaskIndex].completedAt = completed ? new Date().toISOString() : undefined
  data.subTasks[subTaskIndex].updatedAt = new Date().toISOString()
  saveData(data)
}

/**
 * デフォルトのダッシュボードレイアウトを取得
 */
function getDefaultDashboardLayout(): DashboardLayoutConfig {
  return {
    widgets: [
      { id: 'tasks-summary', order: 0, visible: true },
      { id: 'routine-summary', order: 1, visible: true },
      { id: 'analyze-summary', order: 2, visible: true },
      { id: 'weather-card', order: 3, visible: true },
      { id: 'daily-timeline', order: 4, visible: true },
      { id: 'habit-tracker', order: 5, visible: true },
      { id: 'daily-record-input', order: 6, visible: true },
    ]
  }
}

/**
 * ダッシュボードレイアウトを取得
 */
export function getDashboardLayout(): DashboardLayoutConfig {
  const data = loadData()
  let currentLayout = data.dashboardLayout || getDefaultDashboardLayout()

  // 削除対象のウィジェット（完全に削除）
  const removedWidgets = ['stats-grid', 'time-summary', 'time-axis-chart', 'daily-review', 'daily-reflection', 'recent-tasks', 'daily-records-summary']

  // 新しいデフォルトウィジェット
  const defaultWidgets = getDefaultDashboardLayout().widgets
  const validWidgetIds = new Set(defaultWidgets.map(w => w.id))

  let needsUpdate = false

  // 削除対象のウィジェットを除去
  const filteredWidgets = currentLayout.widgets.filter(w => !removedWidgets.includes(w.id))
  if (filteredWidgets.length !== currentLayout.widgets.length) {
    currentLayout.widgets = filteredWidgets
    needsUpdate = true
  }

  // 新しいウィジェットを既存のレイアウトに追加
  const existingWidgetIds = new Set(currentLayout.widgets.map(w => w.id))
  for (const defaultWidget of defaultWidgets) {
    if (!existingWidgetIds.has(defaultWidget.id)) {
      currentLayout.widgets.push(defaultWidget)
      needsUpdate = true
    }
  }

  // 無効なウィジェットを削除
  const finalFilteredWidgets = currentLayout.widgets.filter(w => validWidgetIds.has(w.id))
  if (finalFilteredWidgets.length !== currentLayout.widgets.length) {
    currentLayout.widgets = finalFilteredWidgets
    needsUpdate = true
  }

  // orderを再割り当て
  currentLayout.widgets = currentLayout.widgets.map((widget, index) => ({
    ...widget,
    order: index,
  }))

  if (needsUpdate) {
    saveDashboardLayout(currentLayout)
  }

  return currentLayout
}

/**
 * ダッシュボードレイアウトを保存
 */
export function saveDashboardLayout(layout: DashboardLayoutConfig): void {
  const data = loadData()
  data.dashboardLayout = layout
  saveData(data)
}

/**
 * 昨日の未完了ルーティンタスクを検出
 * 朝5時時点で前日の未完了ルーティンを返す
 */
export function getIncompleteRoutinesFromYesterday(): Task[] {
  const data = loadData()
  const now = new Date()

  // 朝5時時点での「昨日」を計算
  // 現在時刻が5時未満の場合は、さらに1日前を「昨日」とする
  const yesterday = new Date(now)
  if (now.getHours() < 5) {
    yesterday.setDate(yesterday.getDate() - 1)
  }
  yesterday.setHours(0, 0, 0, 0)
  const yesterdayStr = toLocalDateStr(yesterday)

  // 昨日のルーティン実行記録を取得
  const yesterdayExecutions = data.routineExecutions?.filter(execution => {
    return execution.date.startsWith(yesterdayStr) && !execution.completedAt && !execution.skippedAt
  }) || []

  // 未完了のルーティンタスク（テンプレート）を取得
  const incompleteRoutines = yesterdayExecutions
    .map(execution => data.tasks.find(task => task.id === execution.routineTaskId))
    .filter((task): task is Task => task !== undefined && task.repeatPattern !== 'none')

  return incompleteRoutines
}

/**
 * 昨日の未完了タスクを処理し、今日の繰り返しタスクを生成
 * 朝5時時点で前日の未完了タスクを「やらなかったこと」として記録
 * @deprecated この関数は後方互換性のため残しています。新しい実装ではgetIncompleteRoutinesFromYesterdayを使用してください。
 */
export function processIncompleteTasksFromYesterday(): void {
  const data = loadData()
  const now = new Date()

  // 朝5時時点での「昨日」を計算
  // 現在時刻が5時未満の場合は、さらに1日前を「昨日」とする
  const yesterday = new Date(now)
  if (now.getHours() < 5) {
    yesterday.setDate(yesterday.getDate() - 1)
  }
  yesterday.setHours(0, 0, 0, 0)
  const yesterdayStr = toLocalDateStr(yesterday)

  // 昨日作成されたタスクで、完了していないタスクを検出
  const incompleteTasks = data.tasks.filter(task => {
    if (!task.createdAt) return false  // createdAtがない場合はスキップ
    const taskDateStr = task.createdAt.split('T')[0]
    return taskDateStr === yesterdayStr &&
      !task.completedAt &&
      !task.skippedAt &&
      !task.deletedAt
  })

  // 未完了タスクに`skippedAt`を設定
  let hasUpdates = false
  for (const task of incompleteTasks) {
    task.skippedAt = toLocalISOString(new Date())
    task.updatedAt = toLocalISOString(new Date())
    hasUpdates = true
  }

  if (hasUpdates) {
    saveData(data)
  }

  // 今日のルーティン実行記録を生成
  ensureTodayRoutineExecutions()
}

/**
 * 今日の日付に該当する繰り返しタスクを生成
 */
export function ensureTodayRepeatTasks(): void {
  const data = loadData()
  const today = toLocalDateStr(new Date())

  // 繰り返しタスクを取得（元のタスクのみ、今日作成されたタスクは除外、削除済みは除外）
  // 元のタスクは、createdAtが今日の日付でない繰り返しタスク
  const originalRepeatTasks = data.tasks.filter(task =>
    task.repeatPattern !== 'none' &&
    task.createdAt &&
    !task.createdAt.startsWith(today) &&
    !task.deletedAt
  )

  let hasNewTasks = false

  for (const repeatTask of originalRepeatTasks) {
    // 今日の日付に該当するかチェック
    if (!isRepeatTaskForToday(repeatTask)) {
      continue
    }

    // 今日の日付に該当するタスクが既に存在するかチェック
    // 同じタイトル、同じ繰り返しパターン、今日作成されたタスク
    const todayTask = data.tasks.find(task => {
      return task.title === repeatTask.title &&
        task.repeatPattern === repeatTask.repeatPattern &&
        task.createdAt.startsWith(today)
    })

    // 存在しない場合、新しいタスクを生成
    if (!todayTask) {
      const newTask = generateTodayRepeatTask(repeatTask)
      if (newTask) {
        data.tasks.push(newTask)
        hasNewTasks = true
      }
    }
  }

  if (hasNewTasks) {
    saveData(data)
  }
}

/**
 * ルーティン実行記録を取得する
 */
export function getRoutineExecutions(routineTaskId?: string, date?: string): RoutineExecution[] {
  const data = loadData()
  if (!data.routineExecutions) {
    return []
  }

  let executions = data.routineExecutions

  if (routineTaskId) {
    executions = executions.filter(e => e.routineTaskId === routineTaskId)
  }

  if (date) {
    const dateStr = date.split('T')[0]
    executions = executions.filter(e => e.date.startsWith(dateStr))
  }

  return executions.filter(e => !e.deletedAt).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * ルーティン実行記録を追加する
 */
export function addRoutineExecution(execution: Omit<RoutineExecution, 'id' | 'createdAt' | 'updatedAt'>): RoutineExecution {
  const data = loadData()
  if (!data.routineExecutions) {
    data.routineExecutions = []
  }

  const newExecution: RoutineExecution = {
    ...execution,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  data.routineExecutions.push(newExecution)
  saveData(data)
  return newExecution
}

/**
 * ルーティン実行記録を更新する
 */
export function updateRoutineExecution(id: string, updates: Partial<Omit<RoutineExecution, 'id' | 'createdAt'>>): RoutineExecution {
  const data = loadData()
  if (!data.routineExecutions) {
    throw new Error(`RoutineExecution with id ${id} not found`)
  }

  const executionIndex = data.routineExecutions.findIndex(e => e.id === id)
  if (executionIndex === -1) {
    throw new Error(`RoutineExecution with id ${id} not found`)
  }

  const updatedExecution: RoutineExecution = {
    ...data.routineExecutions[executionIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  data.routineExecutions[executionIndex] = updatedExecution
  saveData(data)
  return updatedExecution
}

/**
 * ルーティン実行記録を削除する
 */
export function deleteRoutineExecution(id: string): void {
  const data = loadData()
  if (!data.routineExecutions) {
    return
  }

  const executionIndex = data.routineExecutions.findIndex(e => e.id === id)
  if (executionIndex === -1) {
    return
  }

  const execution = data.routineExecutions[executionIndex]
  execution.deletedAt = new Date().toISOString()
  execution.updatedAt = new Date().toISOString()
  saveData(data)
}

/**
 * 今日のルーティン実行記録を生成
 */
export function ensureTodayRoutineExecutions(): void {
  const data = loadData()
  const today = toLocalDateStr(new Date())

  // 繰り返しタスク（テンプレート）を取得（削除済みを除く）
  const routineTasks = data.tasks.filter(task => task.repeatPattern !== 'none' && !task.deletedAt)

  if (!data.routineExecutions) {
    data.routineExecutions = []
  }

  let hasNewExecutions = false

  for (const routineTask of routineTasks) {
    // 今日の実行記録が既に存在するかチェック
    const todayExecution = data.routineExecutions.find(e =>
      e.routineTaskId === routineTask.id && e.date.startsWith(today)
    )

    // 存在しない場合、新しい実行記録を生成
    if (!todayExecution) {
      // 今日に該当するかチェック
      if (isRepeatTaskForToday(routineTask)) {
        addRoutineExecution({
          routineTaskId: routineTask.id,
          date: today,
        })
        hasNewExecutions = true
      }
    }
  }

  if (hasNewExecutions) {
    // saveDataはaddRoutineExecution内で既に呼ばれているが、念のため
    saveData(data)
  }
}

// =====================================
// 時間セクション設定
// =====================================

/**
 * デフォルトの時間セクション設定を生成
 */
function getDefaultTimeSectionSettings(): TimeSectionSettings {
  // デフォルトのセクション（全曜日共通）
  const defaultSections: TimeSection[] = [
    { id: 'morning', name: '朝', start: '06:00', end: '09:00', color: '#FFB74D', order: 0 },
    { id: 'work', name: '仕事', start: '09:00', end: '18:00', color: '#64B5F6', order: 1 },
    { id: 'evening', name: '夕方', start: '18:00', end: '21:00', color: '#81C784', order: 2 },
    { id: 'night', name: '夜', start: '21:00', end: '24:00', color: '#9575CD', order: 3 },
  ]

  // 全曜日に同じデフォルト設定を適用
  const dayConfigs: TimeSectionDayConfig[] = []
  for (let i = 0; i < 7; i++) {
    dayConfigs.push({
      weekday: i as Weekday,
      sections: defaultSections.map(s => ({ ...s, id: `${s.id}-${i}` })),
    })
  }

  return {
    enabled: false, // デフォルトは無効
    dayConfigs,
  }
}

/**
 * 時間セクション設定を取得
 */
export function getTimeSectionSettings(): TimeSectionSettings {
  const data = loadData()
  if (!data.timeSectionSettings) {
    return getDefaultTimeSectionSettings()
  }
  return data.timeSectionSettings
}

/**
 * 時間セクション設定を保存
 */
export function saveTimeSectionSettings(settings: TimeSectionSettings): void {
  const data = loadData()

  // バリデーション
  validateTimeSectionSettings(settings)

  data.timeSectionSettings = settings
  saveData(data)
}

/**
 * 時間セクション設定のバリデーション
 */
function validateTimeSectionSettings(settings: TimeSectionSettings): void {
  for (const dayConfig of settings.dayConfigs) {
    const sections = dayConfig.sections

    // セクション数は2〜5
    if (sections.length < 2 || sections.length > 5) {
      throw new Error(`曜日 ${dayConfig.weekday} のセクション数は2〜5である必要があります（現在: ${sections.length}）`)
    }

    // 各セクションのバリデーション
    for (const section of sections) {
      // 名前が空でないこと
      if (!section.name.trim()) {
        throw new Error('セクション名は空にできません')
      }

      // 開始時刻 < 終了時刻（24:00は特別扱い）
      const startMinutes = timeToMinutes(section.start)
      const endMinutes = section.end === '24:00' ? 24 * 60 : timeToMinutes(section.end)

      if (startMinutes >= endMinutes) {
        throw new Error(`セクション「${section.name}」の開始時刻は終了時刻より前である必要があります`)
      }
    }

    // セクション間の重なりチェック（orderでソートして隣接チェック）
    const sortedSections = [...sections].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
    for (let i = 0; i < sortedSections.length - 1; i++) {
      const current = sortedSections[i]
      const next = sortedSections[i + 1]

      const currentEnd = current.end === '24:00' ? 24 * 60 : timeToMinutes(current.end)
      const nextStart = timeToMinutes(next.start)

      if (currentEnd > nextStart) {
        throw new Error(`セクション「${current.name}」と「${next.name}」の時間帯が重なっています`)
      }
    }
  }
}

/**
 * HH:mm形式の時刻を分に変換
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * 指定された曜日の時間セクション設定を取得
 */
export function getTimeSectionsForWeekday(weekday: Weekday): TimeSection[] {
  const settings = getTimeSectionSettings()
  if (!settings.enabled) {
    return []
  }

  const dayConfig = settings.dayConfigs.find(dc => dc.weekday === weekday)
  return dayConfig?.sections || []
}

/**
 * 指定された日時が属する時間セクションを取得
 */
export function findTimeSectionForDateTime(date: Date): TimeSection | undefined {
  const settings = getTimeSectionSettings()
  if (!settings.enabled) {
    return undefined
  }

  const weekday = date.getDay() as Weekday
  const sections = getTimeSectionsForWeekday(weekday)

  if (sections.length === 0) {
    return undefined
  }

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const currentMinutes = hours * 60 + minutes

  for (const section of sections) {
    const startMinutes = timeToMinutes(section.start)
    const endMinutes = section.end === '24:00' ? 24 * 60 : timeToMinutes(section.end)

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return section
    }
  }

  return undefined
}

/**
 * タスクの時間セクションを自動判定
 * startTime, dueDate, createdAtの順で判定
 */
export function findTimeSectionForTask(task: Task, baseDate?: Date): TimeSection | undefined {
  // 既にtimeSectionIdが設定されている場合はそれを使用
  if (task.timeSectionId) {
    const settings = getTimeSectionSettings()
    if (!settings.enabled) {
      return undefined
    }

    // 全曜日から該当するセクションを探す
    for (const dayConfig of settings.dayConfigs) {
      const section = dayConfig.sections.find(s => s.id === task.timeSectionId)
      if (section) {
        return section
      }
    }
    return undefined
  }

  // startTimeがあればその時刻で判定
  if (task.startTime) {
    return findTimeSectionForDateTime(new Date(task.startTime))
  }

  // dueDateがあればその時刻で判定
  if (task.dueDate) {
    return findTimeSectionForDateTime(new Date(task.dueDate))
  }

  // baseDateが指定されていればその日の最初のセクションを返す
  if (baseDate) {
    const weekday = baseDate.getDay() as Weekday
    const sections = getTimeSectionsForWeekday(weekday)
    return sections[0]
  }

  return undefined
}

/**
 * 週の開始日を取得
 */
export function getWeekStartDay(): 'sunday' | 'monday' {
  const data = loadData()
  return data.weekStartDay || 'monday'
}

/**
 * 週の開始日を保存
 */
export function saveWeekStartDay(weekStartDay: 'sunday' | 'monday'): void {
  const data = loadData()
  data.weekStartDay = weekStartDay
  saveData(data)
}

/**
 * 時間軸チャートの表示範囲設定
 */
export interface TimeAxisSettings {
  startHour: number // 表示開始時間（0-23）
  endHour: number // 表示終了時間（1-24）
}

/**
 * 時間軸チャートの表示範囲設定を取得
 */
export function getTimeAxisSettings(): TimeAxisSettings {
  const data = loadData()
  return data.timeAxisSettings || { startHour: 0, endHour: 24 }
}

/**
 * 時間軸チャートの表示範囲設定を保存
 */
export function saveTimeAxisSettings(settings: TimeAxisSettings): void {
  const data = loadData()
  data.timeAxisSettings = settings
  saveData(data)
}

/**
 * UIモードを取得
 */
export function getUIMode(): 'desktop' | 'mobile' {
  const data = loadData()
  return data.uiMode || 'desktop'
}

/**
 * UIモードを保存
 */
export function saveUIMode(mode: 'desktop' | 'mobile'): void {
  const data = loadData()
  data.uiMode = mode
  saveData(data)
  window.dispatchEvent(new Event('mytcc2:dataChanged'))
}

