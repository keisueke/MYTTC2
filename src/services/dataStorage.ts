/**
 * データストレージサービス
 * LocalStorageとの読み書きを管理
 */
import { AppData } from '../types'

const STORAGE_KEY = 'mytcc2_data'

/**
 * ローカル時間をISO形式の文字列に変換（タイムゾーンを保持）
 */
export function toLocalISOString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  // タイムゾーンオフセットを取得
  const tzOffset = -date.getTimezoneOffset()
  const tzSign = tzOffset >= 0 ? '+' : '-'
  const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0')
  const tzMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${tzSign}${tzHours}:${tzMinutes}`
}

/**
 * ローカル日付文字列を取得（YYYY-MM-DD形式）
 */
export function toLocalDateStr(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * デフォルトのAppDataを取得
 */
function getDefaultAppData(): AppData {
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
    routineExecutions: [],
  }
}

/**
 * LocalStorageからデータを読み込む
 */
export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored) as AppData

      // データ修復: createdAtが欠落しているタスクを修復
      let needsSave = false
      if (data.tasks && Array.isArray(data.tasks)) {
        for (const task of data.tasks) {
          if (!task.createdAt) {
            // createdAtが欠落している場合、updatedAtを使用するか、現在時刻を設定
            task.createdAt = task.updatedAt || toLocalISOString(new Date())
            needsSave = true
            console.warn(`[Data Repair] Task "${task.title}" (${task.id}) was missing createdAt, set to ${task.createdAt}`)
          }
          if (!task.updatedAt) {
            task.updatedAt = task.createdAt
            needsSave = true
          }
        }
      }

      // 修復が必要な場合は保存
      if (needsSave) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
          console.log('[Data Repair] Fixed tasks with missing createdAt/updatedAt')
        } catch (e) {
          console.error('[Data Repair] Failed to save repaired data:', e)
        }
      }

      return data
    }
  } catch (error) {
    console.error('Failed to load data from localStorage:', error)
  }

  // デフォルトデータを返す
  return getDefaultAppData()
}

/**
 * LocalStorageにデータを保存する
 */
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    // データ変更を通知するカスタムイベントを発火
    window.dispatchEvent(new Event('mytcc2:dataChanged'))
  } catch (error) {
    console.error('Failed to save data to localStorage:', error)
    throw new Error('データの保存に失敗しました')
  }
}

/**
 * すべてのデータをクリアする（テスト用）
 */
export function clearAllData(): void {
  try {
    saveData(getDefaultAppData())
  } catch (error) {
    console.error('Failed to clear data:', error)
    throw new Error('データの削除に失敗しました')
  }
}

