// Cloudflare Workers API クライアント

import { AppData, Task, Project, Mode, Tag, RoutineExecution, DailyRecord, Goal, Memo, MemoTemplate, Wish, SubTask, UserSettings } from '../types'

export interface CloudflareConfig {
  apiUrl: string // Cloudflare Workers APIのURL
  apiKey?: string // API認証キー（オプション）
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

const CLOUDFLARE_CONFIG_KEY = 'mytcc2_cloudflare_config'

/**
 * Cloudflare設定を読み込む
 */
export function loadCloudflareConfig(): CloudflareConfig | null {
  try {
    const stored = localStorage.getItem(CLOUDFLARE_CONFIG_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load Cloudflare config:', error)
  }
  return null
}

/**
 * Cloudflare設定を保存
 */
export function saveCloudflareConfig(config: CloudflareConfig): void {
  try {
    localStorage.setItem(CLOUDFLARE_CONFIG_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save Cloudflare config:', error)
    throw new Error('設定の保存に失敗しました')
  }
}

/**
 * Cloudflare設定を削除
 */
export function deleteCloudflareConfig(): void {
  localStorage.removeItem(CLOUDFLARE_CONFIG_KEY)
}

/**
 * APIリクエストのヘルパー関数
 */
async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  apiKey?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (apiKey) {
    headers['X-API-Key'] = apiKey
  }

  // #region agent log
  console.log('[DEBUG][B,C] cloudflareApi:apiRequest beforeFetch', {url, method:options.method, hasApiKey:!!apiKey});
  // #endregion

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // #region agent log
  console.log('[DEBUG][B,C] cloudflareApi:apiRequest afterFetch', {status:response.status, ok:response.ok, statusText:response.statusText});
  // #endregion

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    // #region agent log
    console.error('[DEBUG][B,C] cloudflareApi:apiRequest errorResponse', {status:response.status, errorMessage:error.message, error});
    // #endregion
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  // #region agent log
  console.log('[DEBUG][D] cloudflareApi:apiRequest parseResponse', {hasData:!!data, hasDataProperty:!!data?.data, dataKeys:Object.keys(data||{}), data});
  // #endregion
  return data.data || data
}

/**
 * データ同期（取得）
 */
export async function syncFromCloudflare(config: CloudflareConfig, lastSynced?: string): Promise<SyncResponse> {
  const url = lastSynced
    ? `${config.apiUrl}/api/sync?lastSynced=${encodeURIComponent(lastSynced)}`
    : `${config.apiUrl}/api/sync`

  return apiRequest<SyncResponse>(url, {
    method: 'GET',
  }, config.apiKey)
}

/**
 * データ同期（送信）
 */
export async function syncToCloudflare(
  config: CloudflareConfig,
  data: Partial<AppData>,
  lastSynced?: string
): Promise<SyncResponse> {
  return apiRequest<SyncResponse>(
    `${config.apiUrl}/api/sync`,
    {
      method: 'POST',
      body: JSON.stringify({
        lastSynced,
        data: {
          tasks: data.tasks,
          projects: data.projects,
          modes: data.modes,
          tags: data.tags,
          routineExecutions: data.routineExecutions,
          dailyRecords: data.dailyRecords,
          goals: data.goals,
          memos: data.memos,
          memoTemplates: data.memoTemplates,
          wishes: data.wishes,
          subTasks: data.subTasks,
        },
      }),
    },
    config.apiKey
  )
}

/**
 * タスクを作成
 */
export async function createTaskOnCloudflare(
  config: CloudflareConfig,
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Task> {
  const newTask: Task = {
    ...task,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return apiRequest<Task>(
    `${config.apiUrl}/api/tasks`,
    {
      method: 'POST',
      body: JSON.stringify(newTask),
    },
    config.apiKey
  )
}

/**
 * タスクを更新
 */
export async function updateTaskOnCloudflare(
  config: CloudflareConfig,
  id: string,
  updates: Partial<Task>
): Promise<Task> {
  return apiRequest<Task>(
    `${config.apiUrl}/api/tasks/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(updates),
    },
    config.apiKey
  )
}

/**
 * タスクを削除
 */
export async function deleteTaskOnCloudflare(
  config: CloudflareConfig,
  id: string
): Promise<void> {
  await apiRequest(
    `${config.apiUrl}/api/tasks/${id}`,
    {
      method: 'DELETE',
    },
    config.apiKey
  )
}

/**
 * タスク一覧を取得
 */
export async function getTasksFromCloudflare(config: CloudflareConfig): Promise<Task[]> {
  return apiRequest<Task[]>(
    `${config.apiUrl}/api/tasks`,
    {
      method: 'GET',
    },
    config.apiKey
  )
}

/**
 * ヘルスチェック
 */
export async function checkCloudflareHealth(config: CloudflareConfig): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/health`)
    const data = await response.json()
    return data.status === 'ok'
  } catch (error) {
    console.error('Health check failed:', error)
    return false
  }
}

