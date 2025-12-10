// Cloudflare移行ヘルパー関数

import { AppData } from '../src/types'

export interface CloudflareConfig {
  apiUrl: string
  apiKey?: string
}

/**
 * APIリクエストのヘルパー関数
 */
async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  apiKey?: string
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (apiKey) {
    headers['X-API-Key'] = apiKey
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.data || data
}

/**
 * データ同期（送信）
 */
export async function syncToCloudflare(
  config: CloudflareConfig,
  data: Partial<AppData>
): Promise<{ lastSynced: string }> {
  return apiRequest<{ lastSynced: string }>(
    `${config.apiUrl}/api/sync`,
    {
      method: 'POST',
      body: JSON.stringify({
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
 * データ同期（取得）
 */
export async function syncFromCloudflare(
  config: CloudflareConfig,
  lastSynced?: string
): Promise<{
  lastSynced: string
  data: {
    tasks: any[]
    projects: any[]
    modes: any[]
    tags: any[]
    routineExecutions: any[]
    dailyRecords: any[]
    goals: any[]
    memos: any[]
    memoTemplates: any[]
    wishes: any[]
    subTasks: any[]
  }
}> {
  const url = lastSynced
    ? `${config.apiUrl}/api/sync?lastSynced=${encodeURIComponent(lastSynced)}`
    : `${config.apiUrl}/api/sync`

  return apiRequest(
    url,
    {
      method: 'GET',
    },
    config.apiKey
  )
}

export const cloudflareApi = {
  syncToCloudflare,
  syncFromCloudflare,
}

