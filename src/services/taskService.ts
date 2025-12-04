import { Task, Project, Mode, Tag, Wish, Goal, Memo, MemoTemplate, DailyRecord, SummaryConfig, WeatherConfig, AppData, SubTask } from '../types'
import { getStoredTheme, saveTheme as saveThemeToStorage } from '../utils/theme'
import { getWeatherConfig as getWeatherConfigFromStorage, saveWeatherConfig as saveWeatherConfigToStorage } from '../utils/weatherConfig'

const STORAGE_KEY = 'mytcc2_data'

/**
 * LocalStorageからデータを読み込む
 */
export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
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
  return data.tasks
}

/**
 * タスクを追加する
 */
export function addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
  const data = loadData()
  
  // 順序が指定されていない場合、最大のorder + 1を設定
  let order = task.order
  if (order === undefined) {
    const maxOrder = data.tasks
      .filter(t => t.order !== undefined)
      .reduce((max, t) => Math.max(max, t.order!), -1)
    order = maxOrder + 1
  }
  
  const newTask: Task = {
    ...task,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
  
  const updatedTask: Task = {
    ...data.tasks[taskIndex],
    ...updates,
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
  
  data.tasks.splice(taskIndex, 1)
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
  
  const startTime = new Date().toISOString()
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
  
  const endTime = new Date().toISOString()
  let updates: Partial<Omit<Task, 'id' | 'createdAt'>> = {
    isRunning: false,
    endTime,
    completedAt: endTime, // タイマー停止時に完了時刻を設定
  }
  
  // タイマーが実行中の場合、経過時間を計算
  if (task.isRunning && task.startTime) {
    const elapsed = Math.floor((new Date(endTime).getTime() - new Date(task.startTime).getTime()) / 1000)
    const totalElapsed = (task.elapsedTime || 0) + elapsed
    updates.elapsedTime = totalElapsed
    // 開始時間は保持する
  } else if (!task.startTime) {
    // タイマーが開始されていない場合でも、終了時間を記録
    updates.startTime = endTime // 開始時間がない場合は終了時間を開始時間として記録
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
  return data.projects || []
}

/**
 * プロジェクトを追加する
 */
export function addProject(project: Omit<Project, 'id' | 'createdAt'>): Project {
  const data = loadData()
  const newProject: Project = {
    ...project,
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
  
  const updatedProject: Project = {
    ...data.projects[projectIndex],
    ...updates,
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
  
  data.projects.splice(projectIndex, 1)
  saveData(data)
}

/**
 * モードを取得する
 */
export function getModes(): Mode[] {
  const data = loadData()
  return data.modes || []
}

/**
 * モードを追加する
 */
export function addMode(mode: Omit<Mode, 'id' | 'createdAt'>): Mode {
  const data = loadData()
  const newMode: Mode = {
    ...mode,
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
  
  const updatedMode: Mode = {
    ...data.modes[modeIndex],
    ...updates,
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
  
  data.modes.splice(modeIndex, 1)
  saveData(data)
}

/**
 * タグを取得する
 */
export function getTags(): Tag[] {
  const data = loadData()
  return data.tags || []
}

/**
 * タグを追加する
 */
export function addTag(tag: Omit<Tag, 'id' | 'createdAt'>): Tag {
  const data = loadData()
  const newTag: Tag = {
    ...tag,
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
  
  const updatedTag: Tag = {
    ...data.tags[tagIndex],
    ...updates,
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
  
  data.tags.splice(tagIndex, 1)
  saveData(data)
}

/**
 * Wishを取得する
 */
export function getWishes(): Wish[] {
  const data = loadData()
  return data.wishes || []
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
  
  data.wishes.splice(wishIndex, 1)
  saveData(data)
}

/**
 * Goalを取得する
 */
export function getGoals(): Goal[] {
  const data = loadData()
  return data.goals || []
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
  
  data.goals.splice(goalIndex, 1)
  saveData(data)
}

/**
 * Memoを取得する
 */
export function getMemos(): Memo[] {
  const data = loadData()
  return data.memos || []
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
  
  data.memos.splice(memoIndex, 1)
  saveData(data)
}

/**
 * MemoTemplateを取得する
 */
export function getMemoTemplates(): MemoTemplate[] {
  const data = loadData()
  return data.memoTemplates || []
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
  
  data.memoTemplates.splice(templateIndex, 1)
  saveData(data)
}

/**
 * 指定日の記録を取得
 */
export function getDailyRecord(date: Date): DailyRecord | undefined {
  const data = loadData()
  if (!data.dailyRecords) {
    return undefined
  }
  
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD形式
  return data.dailyRecords.find(record => record.date === dateStr)
}

/**
 * 記録を保存
 */
export function saveDailyRecord(record: Omit<DailyRecord, 'id' | 'createdAt' | 'updatedAt'>): DailyRecord {
  const data = loadData()
  
  if (!data.dailyRecords) {
    data.dailyRecords = []
  }
  
  // 既存の記録を検索
  const existingIndex = data.dailyRecords.findIndex(r => r.date === record.date)
  
  if (existingIndex !== -1) {
    // 既存の記録を更新
    const updatedRecord: DailyRecord = {
      ...data.dailyRecords[existingIndex],
      ...record,
      updatedAt: new Date().toISOString(),
    }
    data.dailyRecords[existingIndex] = updatedRecord
    saveData(data)
    return updatedRecord
  } else {
    // 新しい記録を作成
    const newRecord: DailyRecord = {
      ...record,
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
  const subTasks = data.subTasks || []
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
  
  data.subTasks.splice(subTaskIndex, 1)
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

