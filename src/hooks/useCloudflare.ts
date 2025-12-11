// Cloudflare APIを使用するためのフック

import { useState, useCallback } from 'react'
import { AppData } from '../types'
import { CloudflareConfig } from '../services/cloudflareApi'
import * as cloudflareApi from '../services/cloudflareApi'
import * as taskService from '../services/taskService'

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

  // 両方向の同期（自動的に最新の状態に合わせる）
  const syncBidirectional = useCallback(async (): Promise<'pulled' | 'pushed' | 'up-to-date' | 'conflict'> => {
    // #region agent log
    console.log('[DEBUG][A] useCloudflare:syncBidirectional called', {hasConfig:!!config, configApiUrl:config?.apiUrl});
    // #endregion
    if (!config) {
      // #region agent log
      console.error('[DEBUG][A] config is null, throwing error');
      // #endregion
      throw new Error('Cloudflare設定がありません')
    }

    setSyncing(true)
    setError(null)

    try {
      const localData = taskService.loadData()
      const lastSynced = localData.lastSynced
      // #region agent log
      console.log('[DEBUG][B] calling syncFromCloudflare', {lastSynced, apiUrl:config.apiUrl});
      // #endregion

      // リモートから最新データを取得
      const syncResponse = await cloudflareApi.syncFromCloudflare(config, lastSynced)

      // #region agent log
      console.log('[DEBUG][B,D] syncFromCloudflare returned', {hasConflict:syncResponse.conflict, lastSynced:syncResponse.lastSynced, taskCount:syncResponse.data?.tasks?.length, syncResponse});
      // #endregion
      // 簡易的な同期ロジック：リモートを優先
      // より高度な競合解決が必要な場合は、ここを拡張
      if (syncResponse.conflict) {
        return 'conflict'
      }

      // #region agent log
      console.log('[DEBUG][C] calling syncToCloudflare', {localTaskCount:localData.tasks?.length});
      // #endregion
      // ローカルデータをリモートに送信
      await cloudflareApi.syncToCloudflare(config, localData, lastSynced)

      // リモートから最新データを再取得
      const finalSyncResponse = await cloudflareApi.syncFromCloudflare(config)

      // データをマージ
      const mergedData: AppData = {
        tasks: finalSyncResponse.data.tasks,
        projects: finalSyncResponse.data.projects,
        modes: finalSyncResponse.data.modes,
        tags: finalSyncResponse.data.tags,
        routineExecutions: finalSyncResponse.data.routineExecutions,
        dailyRecords: finalSyncResponse.data.dailyRecords,
        goals: finalSyncResponse.data.goals,
        memos: finalSyncResponse.data.memos,
        memoTemplates: finalSyncResponse.data.memoTemplates,
        wishes: finalSyncResponse.data.wishes,
        subTasks: finalSyncResponse.data.subTasks,
        lastSynced: finalSyncResponse.lastSynced,
      }

      taskService.saveData(mergedData)

      return 'pulled'
    } catch (err) {
      // #region agent log
      console.error('[DEBUG][B,C,D] sync error caught in hook', {errorMessage:err instanceof Error ? err.message : String(err), err});
      // #endregion
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

