export type Priority = 'low' | 'medium' | 'high'

export type RepeatPattern = 
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom'

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: Priority
  dueDate?: string // ISO date string
  categoryId?: string
  repeatPattern: RepeatPattern
  repeatConfig?: RepeatConfig
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  // 時間計測関連
  startTime?: string // ISO date string (開始時刻)
  endTime?: string // ISO date string (終了時刻)
  elapsedTime?: number // 経過時間（秒）
  isRunning?: boolean // 現在実行中かどうか
}

export interface RepeatConfig {
  interval: number // 繰り返し間隔（例: 毎2日 = 2）
  endDate?: string // ISO date string（繰り返し終了日）
  daysOfWeek?: number[] // 0-6 (日-土) 週次繰り返しの場合
  dayOfMonth?: number // 1-31 月次繰り返しの場合
}

export interface Category {
  id: string
  name: string
  color?: string
  createdAt: string
}

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  dataPath: string // デフォルト: 'data/tasks.json'
}

export interface AppData {
  tasks: Task[]
  categories: Category[]
  lastSynced?: string
}

