/**
 * タスク管理サービス
 * タスク、プロジェクト、モード、タグ、その他エンティティのCRUD操作
 * 
 * 後方互換性のため、分割されたモジュールから再エクスポートしています。
 */

import { Task, Project, Mode, Tag, Wish, Goal, Memo, MemoTemplate, DailyRecord, SubTask } from '../types'
import { sanitizeText } from '../utils/validation'
import { isRepeatTaskForToday, generateTodayRepeatTask } from '../utils/repeatUtils'

// =====================================
// 分割されたモジュールから再エクスポート
// =====================================

// データストレージ
export { 
  loadData, 
  saveData, 
  clearAllData, 
  toLocalISOString, 
  toLocalDateStr 
} from './dataStorage'

// ルーティン管理
export {
  getRoutineExecutions,
  addRoutineExecution,
  updateRoutineExecution,
  deleteRoutineExecution,
  getYesterdayDateStr,
  isSubTaskCompletedYesterday,
  getYesterdayRoutineExecution,
  getRoutineExecutionForDate,
  updateRoutineExecutionForDate,
  getIncompleteRoutinesFromYesterday,
  processIncompleteTasksFromYesterday,
  ensureTodayRoutineExecutions,
} from './routineService'

// 設定管理
export {
  getSummaryConfig,
  saveSummaryConfig,
  getTheme,
  saveTheme,
  getWeatherConfig,
  saveWeatherConfig,
  getSidebarVisibility,
  saveSidebarVisibility,
  getSidebarWidth,
  saveSidebarWidth,
  getDashboardLayout,
  saveDashboardLayout,
  getTimeSectionSettings,
  saveTimeSectionSettings,
  getTimeSectionsForWeekday,
  findTimeSectionForDateTime,
  findTimeSectionForTask,
  getWeekStartDay,
  saveWeekStartDay,
  getTimeAxisSettings,
  saveTimeAxisSettings,
  getUIMode,
  saveUIMode,
} from './settingsService'

// 型の再エクスポート
export type { TimeAxisSettings } from './settingsService'

// ローカルで使用するためのインポート
import { loadData, saveData, toLocalISOString, toLocalDateStr } from './dataStorage'
import { addRoutineExecution, updateRoutineExecution } from './routineService'

// =====================================
// タスク管理
// =====================================

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

// =====================================
// プロジェクト管理
// =====================================

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

// =====================================
// モード管理
// =====================================

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

// =====================================
// タグ管理
// =====================================

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

// =====================================
// Wish管理
// =====================================

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

// =====================================
// Goal管理
// =====================================

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

// =====================================
// Memo管理
// =====================================

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

// =====================================
// MemoTemplate管理
// =====================================

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

// =====================================
// DailyRecord管理
// =====================================

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

// =====================================
// SubTask管理
// =====================================

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
 * 指定した日付のSubTaskの完了状態を修正
 */
export function updateSubTaskCompletionForDate(
  subTaskId: string,
  date: string, // YYYY-MM-DD形式
  completed: boolean
): SubTask | null {
  const data = loadData()
  const subTask = data.subTasks?.find(st => st.id === subTaskId && !st.deletedAt)
  
  if (!subTask) {
    return null
  }

  if (completed) {
    // 完了にする場合、指定した日付の時刻を設定
    const dateObj = new Date(date)
    dateObj.setHours(12, 0, 0, 0) // 正午に設定
    subTask.completedAt = toLocalISOString(dateObj)
  } else {
    // 完了を取り消す場合
    const currentCompletedDate = subTask.completedAt 
      ? toLocalDateStr(new Date(subTask.completedAt))
      : null
    
    if (currentCompletedDate === date) {
      subTask.completedAt = undefined
    }
  }

  subTask.updatedAt = toLocalISOString(new Date())
  saveData(data)
  return subTask
}
