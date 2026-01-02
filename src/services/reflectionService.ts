import { Task, DailyRecord, DailyReflection, AIProvider, Project, Mode, Tag } from '../types'
import * as aiConfig from './aiConfig'
import { geminiApiProvider } from './aiApi/geminiApi'
import { openaiApiProvider } from './aiApi/openaiApi'
import { claudeApiProvider } from './aiApi/claudeApi'
import { AIApiProvider } from './aiApi/base'
import { toLocalDateStr, toLocalISOString } from './dataStorage'

const REFLECTIONS_STORAGE_KEY = 'mytcc2_reflections'

/**
 * 振り返りデータを読み込む
 */
function loadReflections(): DailyReflection[] {
  try {
    const stored = localStorage.getItem(REFLECTIONS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load reflections:', error)
  }
  return []
}

/**
 * 振り返りデータを保存
 */
function saveReflections(reflections: DailyReflection[]): void {
  try {
    localStorage.setItem(REFLECTIONS_STORAGE_KEY, JSON.stringify(reflections))
  } catch (error) {
    console.error('Failed to save reflections:', error)
    throw new Error('振り返りの保存に失敗しました')
  }
}

/**
 * プロバイダーごとのAPI実装を取得
 */
function getApiProvider(provider: AIProvider): AIApiProvider {
  switch (provider) {
    case 'gemini':
      return geminiApiProvider
    case 'openai':
      return openaiApiProvider
    case 'claude':
      return claudeApiProvider
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

/**
 * 日次振り返りを生成
 */
export async function generateReflection(
  tasks: Task[],
  dailyRecords?: DailyRecord[],
  projects?: Project[],
  modes?: Mode[],
  tags?: Tag[]
): Promise<DailyReflection> {
  const config = aiConfig.getPrimaryConfig()
  
  if (!config || !config.enabled || !config.apiKey) {
    throw new Error('プライマリAI APIが設定されていません。設定画面でAPIキーを設定してください。')
  }

  const today = toLocalDateStr(new Date())
  
  // 既存の振り返りをチェック
  const existing = getReflectionByDate(today)
  if (existing) {
    return existing
  }

  // 今日のタスクを集計
  const todayTasks = tasks.filter(task => {
    if (task.completedAt) {
      const completedDateStr = toLocalDateStr(new Date(task.completedAt))
      return completedDateStr === today
    }
    if (task.createdAt) {
      const createdDateStr = toLocalDateStr(new Date(task.createdAt))
      return createdDateStr === today
    }
    return false
  })

  const completedTasks = todayTasks.filter(task => task.completedAt)
  const totalTasks = todayTasks.length

  // プロバイダーごとのAPI実装を取得
  const apiProvider = getApiProvider(config.provider)

  // AI APIで振り返りを生成
  const result = await apiProvider.generateReflection(
    config.apiKey,
    tasks,
    dailyRecords,
    projects,
    modes,
    tags,
    config.model
  )

  // DailyReflectionオブジェクトを作成
  const reflection: DailyReflection = {
    id: crypto.randomUUID(),
    date: today,
    summary: result.summary,
    completedTasks: completedTasks.length,
    totalTasks: totalTasks,
    insights: result.insights,
    suggestions: result.suggestions,
    provider: config.provider,
    createdAt: toLocalISOString(new Date()),
  }

  // 保存
  saveReflection(reflection)

  return reflection
}

/**
 * 日付で振り返りを取得
 */
export function getReflectionByDate(date: string): DailyReflection | null {
  const reflections = loadReflections()
  const dateOnly = date.split('T')[0]
  return reflections.find(r => r.date === dateOnly) || null
}

/**
 * 振り返りを保存
 */
export function saveReflection(reflection: DailyReflection): void {
  const reflections = loadReflections()
  const existingIndex = reflections.findIndex(r => r.id === reflection.id)
  
  if (existingIndex >= 0) {
    reflections[existingIndex] = reflection
  } else {
    reflections.push(reflection)
  }

  saveReflections(reflections)
}

/**
 * すべての振り返りを取得
 */
export function getAllReflections(): DailyReflection[] {
  return loadReflections()
}

/**
 * 振り返りを削除
 */
export function deleteReflection(id: string): void {
  const reflections = loadReflections()
  const filtered = reflections.filter(r => r.id !== id)
  saveReflections(filtered)
}

