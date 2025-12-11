// Cloudflare APIを使用するためのフック

import { useState, useCallback } from 'react'
import { AppData, Task, Project, Mode, Tag, RoutineExecution, DailyRecord, Goal, Memo, MemoTemplate, Wish, SubTask } from '../types'
import { CloudflareConfig } from '../services/cloudflareApi'
import * as cloudflareApi from '../services/cloudflareApi'
import * as taskService from '../services/taskService'

// ============================================
// タイムスタンプベースのマージユーティリティ
// ============================================

/**
 * updatedAtを持つエンティティをタイムスタンプでマージ
 * - 同じIDのエンティティ: updatedAt が新しい方を採用
 * - ローカルにしか存在しない: ローカルのデータを採用
 * - リモートにしか存在しない: リモートのデータを採用
 */
function mergeEntities<T extends { id: string; updatedAt?: string; createdAt?: string }>(
  local: T[],
  remote: T[]
): T[] {
  const merged = new Map<string, T>()
  
  // リモートのデータを先に追加
  for (const item of remote) {
    merged.set(item.id, item)
  }
  
  // ローカルのデータをマージ（より新しい場合は上書き）
  for (const item of local) {
    const existing = merged.get(item.id)
    if (!existing) {
      // リモートに存在しない → ローカルのデータを採用
      merged.set(item.id, item)
    } else {
      // 両方に存在する → updatedAtを比較
      const localTime = new Date(item.updatedAt || item.createdAt || 0).getTime()
      const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime()
      if (localTime > remoteTime) {
        merged.set(item.id, item)
      }
    }
  }
  
  return Array.from(merged.values())
}

/**
 * createdAtのみを持つエンティティをマージ（Project, Mode, Tagなど）
 * これらは基本的にリモートとローカルを統合するだけ
 */
function mergeSimpleEntities<T extends { id: string; createdAt?: string }>(
  local: T[],
  remote: T[]
): T[] {
  const merged = new Map<string, T>()
  
  // リモートのデータを先に追加
  for (const item of remote) {
    merged.set(item.id, item)
  }
  
  // ローカルのデータをマージ（リモートに無いものを追加）
  for (const item of local) {
    if (!merged.has(item.id)) {
      merged.set(item.id, item)
    }
  }
  
  return Array.from(merged.values())
}

/**
 * Cloudflare APIを使用するためのフック
 */
export function useCloudflare() {
  const [config, setConfig] = useState<CloudflareConfig | null>(cloudflareApi.loadCloudflareConfig())
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 設定を保存
  const saveConfig = useCallback((newConfig: CloudflareConfig) => {
    cloudflareApi.saveCloudflareConfig(newConfig)
    setConfig(newConfig)
  }, [])

  // 設定を削除
  const removeConfig = useCallback(() => {
    cloudflareApi.deleteCloudflareConfig()
    setConfig(null)
  }, [])

  // Cloudflareからデータを同期
  const syncFromCloudflare = useCallback(async (): Promise<AppData | null> => {
    if (!config) {
      throw new Error('Cloudflare設定がありません')
    }

    setSyncing(true)
    setError(null)

    try {
      const localData = taskService.loadData()
      const lastSynced = localData.lastSynced

      const syncResponse = await cloudflareApi.syncFromCloudflare(config, lastSynced)

      // データをマージ（簡易版：リモートを優先）
      const mergedData: AppData = {
        tasks: syncResponse.data.tasks,
        projects: syncResponse.data.projects,
        modes: syncResponse.data.modes,
        tags: syncResponse.data.tags,
        routineExecutions: syncResponse.data.routineExecutions,
        dailyRecords: syncResponse.data.dailyRecords,
        goals: syncResponse.data.goals,
        memos: syncResponse.data.memos,
        memoTemplates: syncResponse.data.memoTemplates,
        wishes: syncResponse.data.wishes,
        subTasks: syncResponse.data.subTasks,
        lastSynced: syncResponse.lastSynced,
      }

      // 設定情報をマージ（D1から取得したデータはsnake_case）
      if (syncResponse.data.userSettings) {
        const settings = syncResponse.data.userSettings as any // D1のsnake_case形式
        if (settings.theme) mergedData.theme = settings.theme as 'light' | 'dark'
        if (settings.sidebar_always_visible !== undefined) {
          mergedData.sidebarAlwaysVisible = settings.sidebar_always_visible === 1
        }
        if (settings.sidebar_width !== undefined) {
          mergedData.sidebarWidth = settings.sidebar_width
        }
        if (settings.week_start_day) {
          mergedData.weekStartDay = settings.week_start_day as 'sunday' | 'monday'
        }
        if (settings.time_section_settings) {
          mergedData.timeSectionSettings = JSON.parse(settings.time_section_settings)
        }
        if (settings.time_axis_settings) {
          mergedData.timeAxisSettings = JSON.parse(settings.time_axis_settings)
        }
        if (settings.dashboard_layout) {
          mergedData.dashboardLayout = JSON.parse(settings.dashboard_layout)
        }
        if (settings.summary_config) {
          mergedData.summaryConfig = JSON.parse(settings.summary_config)
        }
        if (settings.weather_config) {
          mergedData.weatherConfig = JSON.parse(settings.weather_config)
        }
        if (settings.ui_mode) {
          mergedData.uiMode = settings.ui_mode as 'desktop' | 'mobile'
        }
      }

      // ローカルストレージに保存
      taskService.saveData(mergedData)

      return mergedData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '同期に失敗しました'
      setError(errorMessage)
      throw err
    } finally {
      setSyncing(false)
    }
  }, [config])

  // 両方向の同期（タイムスタンプベースのマージ）
  const syncBidirectional = useCallback(async (): Promise<'pulled' | 'pushed' | 'up-to-date' | 'conflict'> => {
    console.log('[Cloudflare Sync] syncBidirectional called', { hasConfig: !!config })
    
    if (!config) {
      throw new Error('Cloudflare設定がありません')
    }

    setSyncing(true)
    setError(null)

    try {
      // 1. ローカルデータを読み込み
      const localData = taskService.loadData()
      console.log('[Cloudflare Sync] Local data loaded', {
        taskCount: localData.tasks?.length || 0,
        projectCount: localData.projects?.length || 0,
      })

      // 2. リモートから最新データを取得
      const syncResponse = await cloudflareApi.syncFromCloudflare(config)
      console.log('[Cloudflare Sync] Remote data fetched', {
        taskCount: syncResponse.data?.tasks?.length || 0,
        projectCount: syncResponse.data?.projects?.length || 0,
      })

      if (syncResponse.conflict) {
        return 'conflict'
      }

      const remoteData = syncResponse.data

      // 3. タイムスタンプベースでマージ
      const mergedTasks = mergeEntities(localData.tasks || [], remoteData.tasks || [])
      const mergedProjects = mergeSimpleEntities(localData.projects || [], remoteData.projects || [])
      const mergedModes = mergeSimpleEntities(localData.modes || [], remoteData.modes || [])
      const mergedTags = mergeSimpleEntities(localData.tags || [], remoteData.tags || [])
      const mergedRoutineExecutions = mergeEntities(localData.routineExecutions || [], remoteData.routineExecutions || [])
      const mergedDailyRecords = mergeEntities(localData.dailyRecords || [], remoteData.dailyRecords || [])
      const mergedGoals = mergeEntities(localData.goals || [], remoteData.goals || [])
      const mergedMemos = mergeEntities(localData.memos || [], remoteData.memos || [])
      const mergedMemoTemplates = mergeEntities(localData.memoTemplates || [], remoteData.memoTemplates || [])
      const mergedWishes = mergeEntities(localData.wishes || [], remoteData.wishes || [])
      const mergedSubTasks = mergeEntities(localData.subTasks || [], remoteData.subTasks || [])

      console.log('[Cloudflare Sync] Merged data', {
        taskCount: mergedTasks.length,
        projectCount: mergedProjects.length,
      })

      // 4. マージ結果をCloudflareに送信
      const mergedDataForUpload: Partial<AppData> = {
        tasks: mergedTasks,
        projects: mergedProjects,
        modes: mergedModes,
        tags: mergedTags,
        routineExecutions: mergedRoutineExecutions,
        dailyRecords: mergedDailyRecords,
        goals: mergedGoals,
        memos: mergedMemos,
        memoTemplates: mergedMemoTemplates,
        wishes: mergedWishes,
        subTasks: mergedSubTasks,
      }

      await cloudflareApi.syncToCloudflare(config, mergedDataForUpload)
      console.log('[Cloudflare Sync] Merged data uploaded to Cloudflare')

      // 5. ローカルにも保存
      const finalMergedData: AppData = {
        tasks: mergedTasks,
        projects: mergedProjects,
        modes: mergedModes,
        tags: mergedTags,
        routineExecutions: mergedRoutineExecutions,
        dailyRecords: mergedDailyRecords,
        goals: mergedGoals,
        memos: mergedMemos,
        memoTemplates: mergedMemoTemplates,
        wishes: mergedWishes,
        subTasks: mergedSubTasks,
        lastSynced: new Date().toISOString(),
        // 既存の設定を保持
        theme: localData.theme,
        sidebarAlwaysVisible: localData.sidebarAlwaysVisible,
        sidebarWidth: localData.sidebarWidth,
        weekStartDay: localData.weekStartDay,
        timeSectionSettings: localData.timeSectionSettings,
        timeAxisSettings: localData.timeAxisSettings,
        dashboardLayout: localData.dashboardLayout,
        summaryConfig: localData.summaryConfig,
        weatherConfig: localData.weatherConfig,
        uiMode: localData.uiMode,
      }

      taskService.saveData(finalMergedData)
      console.log('[Cloudflare Sync] Local data saved')

      // データ変更イベントを発火
      window.dispatchEvent(new Event('mytcc2:dataChanged'))

      // ローカルとリモートのどちらが新しかったかを判定
      const localTaskCount = localData.tasks?.length || 0
      const remoteTaskCount = remoteData.tasks?.length || 0
      
      if (localTaskCount === 0 && remoteTaskCount > 0) {
        return 'pulled' // リモートからデータを取得
      } else if (localTaskCount > 0 && remoteTaskCount === 0) {
        return 'pushed' // ローカルからデータをプッシュ
      } else if (mergedTasks.length === localTaskCount && mergedTasks.length === remoteTaskCount) {
        return 'up-to-date' // データは同じ
      } else {
        return 'pulled' // マージが発生
      }
    } catch (err) {
      console.error('[Cloudflare Sync] Error:', err)
      const errorMessage = err instanceof Error ? err.message : '同期に失敗しました'
      setError(errorMessage)
      throw err
    } finally {
      setSyncing(false)
    }
  }, [config])

  // 設定の検証
  const validateConfig = useCallback(async (testConfig: CloudflareConfig): Promise<boolean> => {
    try {
      return await cloudflareApi.checkCloudflareHealth(testConfig)
    } catch (error) {
      console.error('Config validation error:', error)
      return false
    }
  }, [])

  return {
    config,
    syncing,
    error,
    saveConfig,
    removeConfig,
    syncFromCloudflare,
    syncBidirectional,
    validateConfig,
  }
}

