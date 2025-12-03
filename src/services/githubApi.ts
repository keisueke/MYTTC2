import { AppData, GitHubConfig } from '../types'

const GITHUB_API_BASE = 'https://api.github.com'

/**
 * GitHub APIエラークラス
 */
export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'GitHubApiError'
  }
}

/**
 * GitHub APIリクエストを実行
 */
async function githubRequest(
  endpoint: string,
  config: GitHubConfig,
  options: RequestInit = {}
): Promise<any> {
  const url = `${GITHUB_API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new GitHubApiError(
      errorData.message || `GitHub API error: ${response.statusText}`,
      response.status,
      errorData
    )
  }

  return response.json()
}

/**
 * ファイルの内容を取得
 */
export async function getFileContent(
  config: GitHubConfig,
  path: string
): Promise<string> {
  try {
    const endpoint = `/repos/${config.owner}/${config.repo}/contents/${path}`
    const data = await githubRequest(endpoint, config)
    
    if (data.encoding === 'base64' && data.content) {
      // Base64デコード後、UTF-8として正しくデコード
      const base64Content = data.content.replace(/\s/g, '')
      const binaryString = atob(base64Content)
      // UTF-8のマルチバイト文字を正しく処理
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return new TextDecoder('utf-8').decode(bytes)
    }
    
    throw new GitHubApiError('Invalid file encoding')
  } catch (error) {
    if (error instanceof GitHubApiError) {
      throw error
    }
    throw new GitHubApiError(`Failed to get file content: ${error}`)
  }
}

/**
 * ファイルの内容を保存
 */
export async function saveFileContent(
  config: GitHubConfig,
  path: string,
  content: string,
  message: string = 'Update tasks data',
  sha?: string
): Promise<void> {
  try {
    const endpoint = `/repos/${config.owner}/${config.repo}/contents/${path}`
    const encodedContent = btoa(unescape(encodeURIComponent(content)))
    
    const body: any = {
      message,
      content: encodedContent,
    }
    
    if (sha) {
      body.sha = sha
    }

    await githubRequest(endpoint, config, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof GitHubApiError) {
      throw error
    }
    throw new GitHubApiError(`Failed to save file content: ${error}`)
  }
}

/**
 * GitHubからデータを読み込む
 */
export async function loadDataFromGitHub(config: GitHubConfig): Promise<AppData> {
  try {
    const content = await getFileContent(config, config.dataPath)
    return JSON.parse(content)
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      // ファイルが存在しない場合は空のデータを返す
      return {
        tasks: [],
        projects: [],
        modes: [],
        tags: [],
        wishes: [],
        goals: [],
        memos: [],
        dailyRecords: [],
        summaryConfig: {
          includeWeight: true,
          includeBedtime: true,
          includeWakeTime: true,
          includeSleepDuration: true,
          includeBreakfast: true,
          includeLunch: true,
          includeDinner: true,
          includeSnack: true,
        },
        theme: 'dark',
        weatherConfig: {
          cityName: '東京',
          latitude: 35.6762,
          longitude: 139.6503,
        },
      }
    }
    throw error
  }
}

/**
 * GitHubにデータを保存（ファイルが存在しない場合は作成）
 */
export async function saveDataToGitHub(
  config: GitHubConfig,
  data: AppData,
  sha?: string
): Promise<void> {
  const content = JSON.stringify(data, null, 2)
  const message = sha 
    ? `Update tasks data - ${new Date().toISOString()}`
    : `Create tasks data file - ${new Date().toISOString()}`
  
  try {
    await saveFileContent(
      config,
      config.dataPath,
      content,
      message,
      sha
    )
  } catch (error) {
    if (error instanceof GitHubApiError) {
      throw new GitHubApiError(
        `データの保存に失敗しました: ${error.message}`,
        error.status,
        error.response
      )
    }
    throw error
  }
}

/**
 * ファイルのSHAハッシュを取得（更新時の競合回避用）
 */
export async function getFileSha(
  config: GitHubConfig,
  path: string
): Promise<string | undefined> {
  try {
    const endpoint = `/repos/${config.owner}/${config.repo}/contents/${path}`
    const data = await githubRequest(endpoint, config)
    return data.sha
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      return undefined
    }
    throw error
  }
}

/**
 * ファイルの最終更新時刻を取得
 */
export async function getFileLastModified(
  config: GitHubConfig,
  path: string
): Promise<Date | null> {
  try {
    // GitHub APIは直接last_modifiedを返さないため、commits APIを使用
    const commitsEndpoint = `/repos/${config.owner}/${config.repo}/commits?path=${encodeURIComponent(path)}&per_page=1`
    const commitsData = await githubRequest(commitsEndpoint, config)
    if (commitsData && commitsData.length > 0) {
      return new Date(commitsData[0].commit.committer.date)
    }
    return null
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * GitHub設定を検証
 */
export async function validateGitHubConfig(config: GitHubConfig): Promise<boolean> {
  try {
    const endpoint = `/repos/${config.owner}/${config.repo}`
    await githubRequest(endpoint, config)
    return true
  } catch (error) {
    return false
  }
}

