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
      
      // ファイルが存在しなかった場合（空データが返された場合）、
      // 初回同期として空のファイルを作成
      try {
        // ファイルが存在するか確認
        await githubApi.getFileSha(config, config.dataPath)
      } catch (err) {
        // ファイルが存在しない場合は、空のデータでファイルを作成
        if (err instanceof githubApi.GitHubApiError && err.status === 404) {
          await githubApi.saveDataToGitHub(config, data)
        } else {
          throw err
        }
      }
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '同期に失敗しました'
      setError(errorMessage)
      throw err
    } finally {
      setSyncing(false)
    }
  }, [config])

  // 両方向の同期（自動的に最新の状態に合わせる）
  const syncBidirectional = useCallback(async (): Promise<'pulled' | 'pushed' | 'up-to-date'> => {
    if (!config) {
      throw new Error('GitHub設定がありません')
    }

    setSyncing(true)
    setError(null)

    try {
      const localData = taskService.loadData()
      const localLastSynced = localData.lastSynced ? new Date(localData.lastSynced) : null

      // GitHubからファイルの最終更新時刻を取得
      let remoteLastModified: Date | null = null
      try {
        remoteLastModified = await githubApi.getFileLastModified(config, config.dataPath)
      } catch (err) {
        // ファイルが存在しない場合は新規作成として処理
        if (err instanceof githubApi.GitHubApiError && err.status === 404) {
          remoteLastModified = null
        } else {
          throw err
        }
      }

      // リモートファイルが存在しない場合、またはローカルの方が新しい場合はGitHubに保存
      if (!remoteLastModified || (localLastSynced && localLastSynced > remoteLastModified)) {
        // ローカルが新しい、またはリモートファイルが存在しない場合はGitHubに保存
        let sha: string | undefined
        try {
          sha = await githubApi.getFileSha(config, config.dataPath)
        } catch (err) {
          if (err instanceof githubApi.GitHubApiError && err.status === 404) {
            sha = undefined
          } else {
            throw err
          }
        }

        await githubApi.saveDataToGitHub(config, localData, sha)
        
        // 最終同期時刻を更新
        const updatedData: AppData = {
          ...localData,
          lastSynced: new Date().toISOString(),
        }
        taskService.saveData(updatedData)
        
        return 'pushed'
      } else if (localLastSynced && remoteLastModified && localLastSynced.getTime() === remoteLastModified.getTime()) {
        // 同じ時刻の場合は最新
        return 'up-to-date'
      } else {
        // リモートが新しい場合はGitHubから取得
        const data = await githubApi.loadDataFromGitHub(config)
        taskService.saveData(data)
        return 'pulled'
      }
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
      // ファイルが存在しない場合はundefinedが返される（新規作成）
      let sha: string | undefined
      try {
        sha = await githubApi.getFileSha(config, config.dataPath)
      } catch (err) {
        // ファイルが存在しない場合（404）は新規作成として処理
        if (err instanceof githubApi.GitHubApiError && err.status === 404) {
          sha = undefined // 新規作成
        } else {
          throw err
        }
      }

      // GitHubに保存（ファイルが存在しない場合は新規作成）
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
    syncBidirectional,
    validateConfig,
  }
}

