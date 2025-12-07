export type RepeatPattern = 
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom'

export interface TaskReminder {
  id: string
  taskId: string
  reminderTime: string // ISO date string
  notified: boolean
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  projectId?: string
  modeId?: string
  tagIds?: string[] // 複数選択可能
  goalId?: string // 関連する目標のID
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
  skippedAt?: string // ISO date string (未完了として記録された時刻)
  order?: number // 表示順序
  // リマインダー関連
  dueDate?: string // ISO date string（期限）
  reminders?: TaskReminder[] // リマインダー配列
  // ルーティンチェッカー表示設定
  showInRoutineChecker?: boolean // ルーティンチェッカーで表示するかどうか（デフォルト: true）
}

export interface RepeatConfig {
  interval: number // 繰り返し間隔（例: 毎2日 = 2）
  endDate?: string // ISO date string（繰り返し終了日）
  daysOfWeek?: number[] // 0-6 (日-土) 週次繰り返しの場合
  dayOfMonth?: number // 1-31 月次繰り返しの場合
}

// ルーティン実行記録
export interface RoutineExecution {
  id: string
  routineTaskId: string // ルーティンタスク（テンプレート）のID
  date: string // ISO date string (実行日)
  completedAt?: string // ISO date string (完了時刻)
  skippedAt?: string // ISO date string (未完了として記録された時刻)
  elapsedTime?: number // 経過時間（秒）
  startTime?: string // ISO date string (開始時刻)
  endTime?: string // ISO date string (終了時刻)
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
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

export interface SubTask {
  id: string
  taskId: string // 親タスクのID
  title: string
  description?: string
  completedAt?: string // ISO date string（完了日時）
  order?: number // 表示順序
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

export type DashboardWidgetId = 
  | 'stats-grid'
  | 'weather-card'
  | 'habit-tracker'
  | 'daily-record-input'
  | 'time-summary'
  | 'time-axis-chart'
  | 'recent-tasks'
  | 'daily-reflection'
  | 'daily-review'

export interface DashboardWidget {
  id: DashboardWidgetId
  order: number // 表示順序（0から開始）
  visible: boolean // 表示/非表示
}

export interface DashboardLayoutConfig {
  widgets: DashboardWidget[]
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
  subTasks?: SubTask[] // 詳細タスク（ルーティンチェッカー用）
  dashboardLayout?: DashboardLayoutConfig // ダッシュボードレイアウト設定
  routineExecutions?: RoutineExecution[] // ルーティン実行記録
  // 後方互換性のため残す（削除予定）
  categories?: Category[]
  lastSynced?: string
}

export type ConflictResolution = 'local' | 'remote' | 'cancel'

export interface ConflictInfo {
  localData: AppData
  remoteData: AppData
  localLastModified: Date | null
  remoteLastModified: Date | null
}

// 後方互換性のため残す（削除予定）
export interface GeminiConfig {
  apiKey: string
  enabled: boolean
}

export type AIProvider = 'gemini' | 'openai' | 'claude'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  enabled: boolean
  model?: string // モデル名（例: 'gpt-4', 'claude-3-opus', 'gemini-pro'）
}

export interface AIConfigs {
  providers: AIConfig[]
  primaryProvider: AIProvider | null // プライマリAPI
}

export interface DailyReflection {
  id: string
  date: string // ISO date string (YYYY-MM-DD)
  summary: string // 振り返りの要約
  completedTasks: number // 完了したタスク数
  totalTasks: number // 総タスク数
  insights: string[] // 分析結果のインサイト
  suggestions: string[] // 改善提案
  provider?: AIProvider // 使用したAPIプロバイダー
  createdAt: string // ISO date string
}

