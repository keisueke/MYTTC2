import { AppData, GitHubConfig } from '../types'
import * as githubApi from './githubApi'

/**
 * 分割されたデータの構造
 */
export interface SplitData {
  tasks: {
    tasks: AppData['tasks']
    projects: AppData['projects']
    modes: AppData['modes']
    tags: AppData['tags']
    subTasks: NonNullable<AppData['subTasks']>
  }
  memos: {
    memos: NonNullable<AppData['memos']>
    memoTemplates: NonNullable<AppData['memoTemplates']>
  }
  dailyRecords: {
    dailyRecords: NonNullable<AppData['dailyRecords']>
  }
  goals: {
    goals: NonNullable<AppData['goals']>
    wishes: NonNullable<AppData['wishes']>
  }
  settings: {
    summaryConfig: AppData['summaryConfig']
    theme: AppData['theme']
    weatherConfig: AppData['weatherConfig']
    sidebarAlwaysVisible: AppData['sidebarAlwaysVisible']
    sidebarWidth: AppData['sidebarWidth']
    dashboardLayout: AppData['dashboardLayout']
    lastSynced: AppData['lastSynced']
  }
}

/**
 * データを分割
 */
export function splitData(data: AppData): SplitData {
  return {
    tasks: {
      tasks: data.tasks,
      projects: data.projects,
      modes: data.modes,
      tags: data.tags,
      subTasks: data.subTasks ?? [],
    },
    memos: {
      memos: data.memos ?? [],
      memoTemplates: data.memoTemplates ?? [],
    },
    dailyRecords: {
      dailyRecords: data.dailyRecords ?? [],
    },
    goals: {
      goals: data.goals ?? [],
      wishes: data.wishes ?? [],
    },
    settings: {
      summaryConfig: data.summaryConfig,
      theme: data.theme,
      weatherConfig: data.weatherConfig,
      sidebarAlwaysVisible: data.sidebarAlwaysVisible,
      sidebarWidth: data.sidebarWidth,
      dashboardLayout: data.dashboardLayout,
      lastSynced: data.lastSynced,
    },
  }
}

/**
 * 分割されたデータを統合
 */
export function mergeData(splitData: SplitData): AppData {
  return {
    tasks: splitData.tasks.tasks,
    projects: splitData.tasks.projects,
    modes: splitData.tasks.modes,
    tags: splitData.tasks.tags,
    subTasks: splitData.tasks.subTasks,
    memos: splitData.memos.memos,
    memoTemplates: splitData.memos.memoTemplates,
    dailyRecords: splitData.dailyRecords.dailyRecords,
    goals: splitData.goals.goals,
    wishes: splitData.goals.wishes,
    summaryConfig: splitData.settings.summaryConfig,
    theme: splitData.settings.theme,
    weatherConfig: splitData.settings.weatherConfig,
    sidebarAlwaysVisible: splitData.settings.sidebarAlwaysVisible,
    sidebarWidth: splitData.settings.sidebarWidth,
    dashboardLayout: splitData.settings.dashboardLayout,
    lastSynced: splitData.settings.lastSynced,
  }
}

/**
 * 分割されたファイルからデータを読み込み
 */
export async function loadDataFromGitHubSplit(config: GitHubConfig): Promise<AppData> {
  const dataPath = config.dataPath || 'data/tasks.json'
  const basePath = dataPath.substring(0, dataPath.lastIndexOf('/') + 1)

  try {
    // 各ファイルを並列で読み込み
    const [tasksData, memosData, dailyRecordsData, goalsData, settingsData] = await Promise.all([
      githubApi.getFileContent(config, `${basePath}tasks.json`).catch(() => '{}'),
      githubApi.getFileContent(config, `${basePath}memos.json`).catch(() => '{}'),
      githubApi.getFileContent(config, `${basePath}dailyRecords.json`).catch(() => '{}'),
      githubApi.getFileContent(config, `${basePath}goals.json`).catch(() => '{}'),
      githubApi.getFileContent(config, `${basePath}settings.json`).catch(() => '{}'),
    ])

    const splitData: SplitData = {
      tasks: JSON.parse(tasksData),
      memos: JSON.parse(memosData),
      dailyRecords: JSON.parse(dailyRecordsData),
      goals: JSON.parse(goalsData),
      settings: JSON.parse(settingsData),
    }

    return mergeData(splitData)
  } catch (error) {
    console.error('Failed to load split data:', error)
    // エラー時は空のデータを返す
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

/**
 * 分割されたファイルにデータを保存
 */
export async function saveDataToGitHubSplit(
  config: GitHubConfig,
  data: AppData
): Promise<void> {
  const dataPath = config.dataPath || 'data/tasks.json'
  const basePath = dataPath.substring(0, dataPath.lastIndexOf('/') + 1)

  const split = splitData(data)

  // 各ファイルのSHAを取得（存在する場合）
  const getSha = async (path: string): Promise<string | undefined> => {
    try {
      return await githubApi.getFileSha(config, path)
    } catch {
      return undefined
    }
  }

  // 各ファイルを並列で保存
  await Promise.all([
    githubApi.saveFileContent(
      config,
      `${basePath}tasks.json`,
      JSON.stringify(split.tasks, null, 2),
      'Update tasks data',
      await getSha(`${basePath}tasks.json`)
    ).catch(() => {}),
    githubApi.saveFileContent(
      config,
      `${basePath}memos.json`,
      JSON.stringify(split.memos, null, 2),
      'Update memos data',
      await getSha(`${basePath}memos.json`)
    ).catch(() => {}),
    githubApi.saveFileContent(
      config,
      `${basePath}dailyRecords.json`,
      JSON.stringify(split.dailyRecords, null, 2),
      'Update daily records data',
      await getSha(`${basePath}dailyRecords.json`)
    ).catch(() => {}),
    githubApi.saveFileContent(
      config,
      `${basePath}goals.json`,
      JSON.stringify(split.goals, null, 2),
      'Update goals data',
      await getSha(`${basePath}goals.json`)
    ).catch(() => {}),
    githubApi.saveFileContent(
      config,
      `${basePath}settings.json`,
      JSON.stringify(split.settings, null, 2),
      'Update settings data',
      await getSha(`${basePath}settings.json`)
    ).catch(() => {}),
  ])
}

