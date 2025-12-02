import { Task, Project, Mode, Tag, AppData } from '../types'

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
  const newTask: Task = {
    ...task,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

