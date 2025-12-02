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
  projectId?: string
  modeId?: string
  tagIds?: string[] // 複数選択可能
  repeatPattern: RepeatPattern
  repeatConfig?: RepeatConfig
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  // 時間計測関連
  startTime?: string // ISO date string (開始時刻)
  endTime?: string // ISO date string (終了時刻)
  elapsedTime?: number // 経過時間（秒）
  isRunning?: boolean // 現在実行中かどうか
  estimatedTime?: number // 予定時間（分）
}

export interface RepeatConfig {
  interval: number // 繰り返し間隔（例: 毎2日 = 2）
  endDate?: string // ISO date string（繰り返し終了日）
  daysOfWeek?: number[] // 0-6 (日-土) 週次繰り返しの場合
  dayOfMonth?: number // 1-31 月次繰り返しの場合
}

export interface Project {
  id: string
  name: string
  color?: string
  createdAt: string
}

export interface Mode {
  id: string
  name: string
  color?: string
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  color?: string
  createdAt: string
}

// 後方互換性のため残す（削除予定）
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

export interface Wish {
  id: string
  title: string
  description?: string
  projectId?: string
  modeId?: string
  tagIds?: string[]
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
}

export type GoalCategory = 
  | 'social-contribution' // 社会貢献
  | 'family' // 家族
  | 'relationships' // 人間関係
  | 'hobby' // 趣味
  | 'work' // 仕事
  | 'finance' // ファイナンス
  | 'health' // 健康
  | 'intelligence' // 知性
  | 'other' // その他

export interface Goal {
  id: string
  year: number // 年度（年）
  category: GoalCategory
  title: string
  description?: string
  progress?: number // 進捗率（0-100）
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
}

export interface AppData {
  tasks: Task[]
  projects: Project[]
  modes: Mode[]
  tags: Tag[]
  wishes?: Wish[] // wishリスト
  goals?: Goal[] // 目標リスト
  // 後方互換性のため残す（削除予定）
  categories?: Category[]
  lastSynced?: string
}

