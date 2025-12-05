import { GeminiConfig } from '../types'

const GEMINI_CONFIG_KEY = 'mytcc2_gemini_config'

/**
 * Gemini設定を読み込む
 */
export function loadGeminiConfig(): GeminiConfig | null {
  try {
    const stored = localStorage.getItem(GEMINI_CONFIG_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load Gemini config:', error)
  }
  return null
}

/**
 * Gemini設定を保存
 */
export function saveGeminiConfig(config: GeminiConfig): void {
  try {
    localStorage.setItem(GEMINI_CONFIG_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save Gemini config:', error)
    throw new Error('設定の保存に失敗しました')
  }
}

/**
 * Gemini設定を削除
 */
export function deleteGeminiConfig(): void {
  localStorage.removeItem(GEMINI_CONFIG_KEY)
}

