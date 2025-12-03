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
  completedAt?: string // ISO date string (完了時刻)
  order?: number // 表示順序
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

export interface WeatherConfig {
  cityName: string // 都市名
  latitude: number // 緯度
  longitude: number // 経度
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
  parentGoalId?: string // 親目標のID（細分化された目標の場合）
  position?: number // 曼荼羅チャートでの位置（0-8、0が中央、1-8が周囲）
  completedAt?: string // ISO date string（完了日時）
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
}

export interface Memo {
  id: string
  title: string
  content: string
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
}

export interface MemoTemplate {
  id: string
  title: string
  content: string
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
}

export interface DailyRecord {
  id: string
  date: string // ISO date string (日付のみ YYYY-MM-DD)
  weight?: number // 体重 kg
  bedtime?: string // 就寝時間 HH:mm
  wakeTime?: string // 起床時間 HH:mm
  sleepDuration?: number // 睡眠時間 分
  breakfast?: string // 朝食
  lunch?: string // 昼食
  dinner?: string // 夕食
  snack?: string // 間食
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
}

export interface SummaryConfig {
  includeWeight: boolean
  includeBedtime: boolean
  includeWakeTime: boolean
  includeSleepDuration: boolean
  includeBreakfast: boolean
  includeLunch: boolean
  includeDinner: boolean
  includeSnack: boolean
}

export interface AppData {
  tasks: Task[]
  projects: Project[]
  modes: Mode[]
  tags: Tag[]
  wishes?: Wish[] // wishリスト
  goals?: Goal[] // 目標リスト
  memos?: Memo[] // メモリスト
  memoTemplates?: MemoTemplate[] // メモテンプレートリスト
  dailyRecords?: DailyRecord[] // 日次記録
  summaryConfig?: SummaryConfig // 今日のまとめ設定
  theme?: 'light' | 'dark' // テーマ設定
  weatherConfig?: WeatherConfig // 天気設定
  sidebarAlwaysVisible?: boolean // サイドバー常時表示設定
  sidebarWidth?: number // サイドバー幅（px、デフォルト: 320）
  // 後方互換性のため残す（削除予定）
  categories?: Category[]
  lastSynced?: string
}

