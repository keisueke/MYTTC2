import { Task, Category, AppData } from '../types'

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
    categories: [],
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
 * タスクの完了状態を切り替える
 */
export function toggleTaskCompletion(id: string): Task {
  const data = loadData()
  const task = data.tasks.find(t => t.id === id)
  
  if (!task) {
    throw new Error(`Task with id ${id} not found`)
  }
  
  // 完了時にタイマーを停止
  const updates: Partial<Omit<Task, 'id' | 'createdAt'>> = { completed: !task.completed }
  if (!task.completed && task.isRunning) {
    updates.isRunning = false
    if (task.startTime) {
      const endTime = new Date().toISOString()
      const elapsed = Math.floor((new Date(endTime).getTime() - new Date(task.startTime).getTime()) / 1000)
      updates.endTime = endTime
      updates.elapsedTime = (task.elapsedTime || 0) + elapsed
    }
  }
  
  return updateTask(id, updates)
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
  
  if (task.completed) {
    throw new Error('完了したタスクのタイマーは開始できません')
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
  
  if (!task.isRunning || !task.startTime) {
    return task
  }
  
  const endTime = new Date().toISOString()
  const elapsed = Math.floor((new Date(endTime).getTime() - new Date(task.startTime).getTime()) / 1000)
  const totalElapsed = (task.elapsedTime || 0) + elapsed
  
  return updateTask(id, {
    isRunning: false,
    endTime,
    elapsedTime: totalElapsed,
    startTime: undefined,
  })
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
 * カテゴリを取得する
 */
export function getCategories(): Category[] {
  const data = loadData()
  return data.categories
}

/**
 * カテゴリを追加する
 */
export function addCategory(category: Omit<Category, 'id' | 'createdAt'>): Category {
  const data = loadData()
  const newCategory: Category = {
    ...category,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  
  data.categories.push(newCategory)
  saveData(data)
  return newCategory
}

/**
 * カテゴリを更新する
 */
export function updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): Category {
  const data = loadData()
  const categoryIndex = data.categories.findIndex(c => c.id === id)
  
  if (categoryIndex === -1) {
    throw new Error(`Category with id ${id} not found`)
  }
  
  const updatedCategory: Category = {
    ...data.categories[categoryIndex],
    ...updates,
  }
  
  data.categories[categoryIndex] = updatedCategory
  saveData(data)
  return updatedCategory
}

/**
 * カテゴリを削除する
 */
export function deleteCategory(id: string): void {
  const data = loadData()
  const categoryIndex = data.categories.findIndex(c => c.id === id)
  
  if (categoryIndex === -1) {
    throw new Error(`Category with id ${id} not found`)
  }
  
  // カテゴリを使用しているタスクのcategoryIdをクリア
  data.tasks.forEach(task => {
    if (task.categoryId === id) {
      task.categoryId = undefined
    }
  })
  
  data.categories.splice(categoryIndex, 1)
  saveData(data)
}

