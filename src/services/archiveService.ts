import { AppData, GitHubConfig, DailyRecord, Task } from '../types'
import * as githubApi from './githubApi'

/**
 * アーカイブ設定
 */
export interface ArchiveConfig {
  dailyRecordsArchiveAfterDays: number // 日次記録をアーカイブする日数（デフォルト: 365）
  completedTasksArchiveAfterDays: number // 完了済みタスクをアーカイブする日数（デフォルト: 365）
  oldMemosArchiveAfterDays: number // 古いメモをアーカイブする日数（デフォルト: 365）
}

const DEFAULT_ARCHIVE_CONFIG: ArchiveConfig = {
  dailyRecordsArchiveAfterDays: 365,
  completedTasksArchiveAfterDays: 365,
  oldMemosArchiveAfterDays: 365,
}

/**
 * アーカイブされたデータ
 */
export interface ArchivedData {
  year: number
  dailyRecords: DailyRecord[]
  completedTasks: Task[]
  oldMemos: AppData['memos']
}

/**
 * 古いデータをアーカイブ
 */
export async function archiveOldData(
  data: AppData,
  config: ArchiveConfig = DEFAULT_ARCHIVE_CONFIG,
  githubConfig?: GitHubConfig
): Promise<ArchivedData[]> {
  const now = new Date()
  const archivedDataByYear: Record<number, ArchivedData> = {}

  // 日次記録をアーカイブ
  if (data.dailyRecords) {
    const archiveDate = new Date(now)
    archiveDate.setDate(archiveDate.getDate() - config.dailyRecordsArchiveAfterDays)

    data.dailyRecords.forEach((record) => {
      const recordDate = new Date(record.date)
      if (recordDate < archiveDate) {
        const year = recordDate.getFullYear()
        if (!archivedDataByYear[year]) {
          archivedDataByYear[year] = {
            year,
            dailyRecords: [],
            completedTasks: [],
            oldMemos: [],
          }
        }
        archivedDataByYear[year].dailyRecords.push(record)
      }
    })
  }

  // 完了済みタスクをアーカイブ
  if (data.tasks) {
    const archiveDate = new Date(now)
    archiveDate.setDate(archiveDate.getDate() - config.completedTasksArchiveAfterDays)

    data.tasks.forEach((task) => {
      if (task.completedAt) {
        const completedDate = new Date(task.completedAt)
        if (completedDate < archiveDate) {
          const year = completedDate.getFullYear()
          if (!archivedDataByYear[year]) {
            archivedDataByYear[year] = {
              year,
              dailyRecords: [],
              completedTasks: [],
              oldMemos: [],
            }
          }
          archivedDataByYear[year].completedTasks.push(task)
        }
      }
    })
  }

  // 古いメモをアーカイブ
  if (data.memos) {
    const archiveDate = new Date(now)
    archiveDate.setDate(archiveDate.getDate() - config.oldMemosArchiveAfterDays)

    data.memos.forEach((memo) => {
      const updatedDate = new Date(memo.updatedAt)
      if (updatedDate < archiveDate) {
        const year = updatedDate.getFullYear()
        if (!archivedDataByYear[year]) {
          archivedDataByYear[year] = {
            year,
            dailyRecords: [],
            completedTasks: [],
            oldMemos: [],
          }
        }
        archivedDataByYear[year].oldMemos.push(memo)
      }
    })
  }

  const archivedDataList = Object.values(archivedDataByYear)

  // GitHubに保存する場合
  if (githubConfig) {
    const dataPath = githubConfig.dataPath || 'data/tasks.json'
    const basePath = dataPath.substring(0, dataPath.lastIndexOf('/') + 1)

    for (const archived of archivedDataList) {
      const archivePath = `${basePath}archive-${archived.year}.json`
      try {
        await githubApi.saveFileContent(
          githubConfig,
          archivePath,
          JSON.stringify(archived, null, 2),
          `Archive data for year ${archived.year}`
        )
      } catch (error) {
        console.error(`Failed to save archive for year ${archived.year}:`, error)
      }
    }
  }

  return archivedDataList
}

/**
 * アーカイブデータを読み込み
 */
export async function loadArchivedData(
  config: GitHubConfig,
  year: number
): Promise<ArchivedData | null> {
  const dataPath = config.dataPath || 'data/tasks.json'
  const basePath = dataPath.substring(0, dataPath.lastIndexOf('/') + 1)
  const archivePath = `${basePath}archive-${year}.json`

  try {
    const content = await githubApi.getFileContent(config, archivePath)
    return JSON.parse(content) as ArchivedData
  } catch (error) {
    if (error instanceof githubApi.GitHubApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * アーカイブから復元
 */
export function restoreFromArchive(
  archivedData: ArchivedData,
  currentData: AppData
): AppData {
  return {
    ...currentData,
    dailyRecords: [
      ...(currentData.dailyRecords || []),
      ...archivedData.dailyRecords,
    ],
    tasks: [
      ...currentData.tasks,
      ...archivedData.completedTasks,
    ],
    memos: [
      ...(currentData.memos || []),
      ...archivedData.oldMemos,
    ],
  }
}

