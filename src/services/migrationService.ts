import { AppData, GitHubConfig } from '../types'
import * as githubApi from './githubApi'
import * as dataSplitService from './dataSplitService'

/**
 * 既存の単一ファイル形式から分割形式に移行
 */
export async function migrateFromSingleFile(config: GitHubConfig): Promise<void> {
  const dataPath = config.dataPath || 'data/tasks.json'
  const basePath = dataPath.substring(0, dataPath.lastIndexOf('/') + 1)

  try {
    // 既存の単一ファイルを読み込み
    const existingData = await githubApi.loadDataFromGitHub(config)

    // 分割されたファイルを保存
    await dataSplitService.saveDataToGitHubSplit(config, existingData)

    // 移行完了のマーカーを保存（オプション）
    try {
      await githubApi.saveFileContent(
        config,
        `${basePath}.migrated`,
        JSON.stringify({ migrated: true, migratedAt: new Date().toISOString() }),
        'Migration completed'
      )
    } catch {
      // マーカーの保存に失敗しても続行
    }
  } catch (error) {
    if (error instanceof githubApi.GitHubApiError && error.status === 404) {
      // ファイルが存在しない場合は移行不要
      return
    }
    throw error
  }
}

/**
 * 移行済みかどうかを確認
 */
export async function isMigrated(config: GitHubConfig): Promise<boolean> {
  const dataPath = config.dataPath || 'data/tasks.json'
  const basePath = dataPath.substring(0, dataPath.lastIndexOf('/') + 1)

  try {
    await githubApi.getFileContent(config, `${basePath}.migrated`)
    return true
  } catch {
    // 移行マーカーが存在しない、または分割ファイルが存在する場合は移行済みとみなす
    try {
      await githubApi.getFileContent(config, `${basePath}tasks.json`)
      return true
    } catch {
      return false
    }
  }
}

/**
 * データ形式を自動検出して読み込み
 */
export async function loadDataAutoDetect(config: GitHubConfig): Promise<AppData> {
  const dataPath = config.dataPath || 'data/tasks.json'
  const basePath = dataPath.substring(0, dataPath.lastIndexOf('/') + 1)

  try {
    // 分割形式を試す
    await githubApi.getFileContent(config, `${basePath}tasks.json`)
    return await dataSplitService.loadDataFromGitHubSplit(config)
  } catch {
    // 分割形式が存在しない場合は単一ファイル形式を試す
    try {
      return await githubApi.loadDataFromGitHub(config)
    } catch {
      // どちらも存在しない場合は空のデータを返す
      return {
        tasks: [],
        projects: [],
        modes: [],
        tags: [],
        wishes: [],
        goals: [],
        memos: [],
        memoTemplates: [],
        dailyRecords: [],
        subTasks: [],
      }
    }
  }
}

