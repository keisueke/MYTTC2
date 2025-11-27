import { useState, useCallback } from 'react'
import { GitHubConfig, AppData } from '../types'
import * as githubApi from '../services/githubApi'
import * as taskService from '../services/taskService'

const GITHUB_CONFIG_KEY = 'mytcc2_github_config'

/**
 * GitHub設定を読み込む
 */
export function loadGitHubConfig(): GitHubConfig | null {
  try {
    const stored = localStorage.getItem(GITHUB_CONFIG_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load GitHub config:', error)
  }
  return null
}

/**
 * GitHub設定を保存
 */
export function saveGitHubConfig(config: GitHubConfig): void {
  try {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save GitHub config:', error)
    throw new Error('設定の保存に失敗しました')
  }
}

/**
 * GitHub設定を削除
 */
export function deleteGitHubConfig(): void {
  localStorage.removeItem(GITHUB_CONFIG_KEY)
}

/**
 * GitHub APIを使用するためのフック
 */
export function useGitHub() {
  const [config, setConfig] = useState<GitHubConfig | null>(loadGitHubConfig())
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 設定を保存
  const saveConfig = useCallback((newConfig: GitHubConfig) => {
    saveGitHubConfig(newConfig)
    setConfig(newConfig)
  }, [])

  // 設定を削除
  const removeConfig = useCallback(() => {
    deleteGitHubConfig()
    setConfig(null)
  }, [])

  // GitHubからデータを同期
  const syncFromGitHub = useCallback(async (): Promise<AppData | null> => {
    if (!config) {
      throw new Error('GitHub設定がありません')
    }

    setSyncing(true)
    setError(null)

    try {
      const data = await githubApi.loadDataFromGitHub(config)
      // ローカルストレージに保存
      taskService.saveData(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '同期に失敗しました'
      setError(errorMessage)
      throw err
    } finally {
      setSyncing(false)
    }
  }, [config])

  // GitHubにデータを同期
  const syncToGitHub = useCallback(async (): Promise<void> => {
    if (!config) {
      throw new Error('GitHub設定がありません')
    }

    setSyncing(true)
    setError(null)

    try {
      // 現在のローカルデータを取得
      const localData = taskService.loadData()
      
      // SHAハッシュを取得（競合回避）
      let sha: string | undefined
      try {
        sha = await githubApi.getFileSha(config, config.dataPath)
      } catch (err) {
        // ファイルが存在しない場合は無視
        if (!(err instanceof githubApi.GitHubApiError && err.status === 404)) {
          throw err
        }
      }

      // GitHubに保存
      await githubApi.saveDataToGitHub(config, localData, sha)
      
      // 最終同期時刻を更新
      const updatedData: AppData = {
        ...localData,
        lastSynced: new Date().toISOString(),
      }
      taskService.saveData(updatedData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '同期に失敗しました'
      setError(errorMessage)
      throw err
    } finally {
      setSyncing(false)
    }
  }, [config])

  // 設定を検証
  const validateConfig = useCallback(async (testConfig: GitHubConfig): Promise<boolean> => {
    try {
      return await githubApi.validateGitHubConfig(testConfig)
    } catch {
      return false
    }
  }, [])

  return {
    config,
    syncing,
    error,
    saveConfig,
    removeConfig,
    syncFromGitHub,
    syncToGitHub,
    validateConfig,
  }
}

