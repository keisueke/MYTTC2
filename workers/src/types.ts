// Cloudflare Workers用の型定義

import type { D1Database } from '@cloudflare/workers-types'

export interface Env {
  DB: D1Database
  API_KEY?: string
  JWT_SECRET?: string
  ALLOWED_ORIGINS?: string // カンマ区切りの許可オリジン（例: "https://user.github.io,http://localhost:5173"）
}

export interface Task {
  id: string
  title: string
  description?: string
  project_id?: string
  mode_id?: string
  tag_ids?: string // JSON配列
  goal_id?: string
  repeat_pattern: string
  repeat_config?: string // JSON
  created_at: string
  updated_at: string
  start_time?: string
  end_time?: string
  elapsed_time?: number
  is_running?: number
  estimated_time?: number
  completed_at?: string
  skipped_at?: string
  order_index?: number
  due_date?: string
  time_section_id?: string
  show_in_routine_checker?: number
}

export interface Project {
  id: string
  name: string
  color?: string
  created_at: string
}

export interface Mode {
  id: string
  name: string
  color?: string
  created_at: string
}

export interface Tag {
  id: string
  name: string
  color?: string
  created_at: string
}

export interface RoutineExecution {
  id: string
  routine_task_id: string
  date: string
  completed_at?: string
  skipped_at?: string
  elapsed_time?: number
  start_time?: string
  end_time?: string
  created_at: string
  updated_at: string
}

export interface DailyRecord {
  id: string
  date: string
  weight?: number
  bedtime?: string
  wake_time?: string
  sleep_duration?: number
  breakfast?: string
  lunch?: string
  dinner?: string
  snack?: string
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  year: number
  category: string
  title: string
  description?: string
  progress?: number
  parent_goal_id?: string
  position?: number
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Memo {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface MemoTemplate {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface Wish {
  id: string
  title: string
  description?: string
  project_id?: string
  mode_id?: string
  tag_ids?: string // JSON配列
  created_at: string
  updated_at: string
}

export interface SubTask {
  id: string
  task_id: string
  title: string
  description?: string
  completed_at?: string
  order_index?: number
  created_at: string
  updated_at: string
}

export interface UserSettings {
  user_id: string
  theme?: string
  sidebar_always_visible?: number
  sidebar_width?: number
  week_start_day?: string
  time_section_settings?: string // JSON
  time_axis_settings?: string // JSON
  dashboard_layout?: string // JSON
  summary_config?: string // JSON
  weather_config?: string // JSON
  ui_mode?: string
  updated_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SyncRequest {
  lastSynced?: string
  data?: {
    tasks?: Task[]
    projects?: Project[]
    modes?: Mode[]
    tags?: Tag[]
    routineExecutions?: RoutineExecution[]
    dailyRecords?: DailyRecord[]
    goals?: Goal[]
    memos?: Memo[]
    memoTemplates?: MemoTemplate[]
    wishes?: Wish[]
    subTasks?: SubTask[]
  }
}

export interface SyncResponse {
  lastSynced: string
  data: {
    tasks: Task[]
    projects: Project[]
    modes: Mode[]
    tags: Tag[]
    routineExecutions: RoutineExecution[]
    dailyRecords: DailyRecord[]
    goals: Goal[]
    memos: Memo[]
    memoTemplates: MemoTemplate[]
    wishes: Wish[]
    subTasks: SubTask[]
    userSettings: UserSettings
  }
  conflict?: boolean
}

