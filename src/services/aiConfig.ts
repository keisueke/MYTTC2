import { AIProvider, AIConfig, AIConfigs } from '../types'
import * as geminiConfigService from './geminiConfig'

const AI_CONFIGS_KEY = 'mytcc2_ai_configs'

/**
 * AI設定を読み込む（既存のGemini設定も移行）
 */
export function loadAIConfigs(): AIConfigs {
  try {
    const stored = localStorage.getItem(AI_CONFIGS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load AI configs:', error)
  }

  // 既存のGemini設定を移行
  const legacyGeminiConfig = geminiConfigService.loadGeminiConfig()
  if (legacyGeminiConfig) {
    const migrated: AIConfigs = {
      providers: [{
        provider: 'gemini',
        apiKey: legacyGeminiConfig.apiKey,
        enabled: legacyGeminiConfig.enabled,
        model: 'gemini-pro',
      }],
      primaryProvider: legacyGeminiConfig.enabled ? 'gemini' : null,
    }
    saveAIConfigs(migrated)
    // 既存の設定を削除
    geminiConfigService.deleteGeminiConfig()
    return migrated
  }

  // デフォルト設定
  return {
    providers: [],
    primaryProvider: null,
  }
}

/**
 * AI設定を保存
 */
export function saveAIConfigs(configs: AIConfigs): void {
  try {
    localStorage.setItem(AI_CONFIGS_KEY, JSON.stringify(configs))
  } catch (error) {
    console.error('Failed to save AI configs:', error)
    throw new Error('設定の保存に失敗しました')
  }
}

/**
 * 特定のプロバイダーの設定を取得
 */
export function getAIConfig(provider: AIProvider): AIConfig | null {
  const configs = loadAIConfigs()
  return configs.providers.find(p => p.provider === provider) || null
}

/**
 * プライマリAPIの設定を取得
 */
export function getPrimaryConfig(): AIConfig | null {
  const configs = loadAIConfigs()
  if (!configs.primaryProvider) {
    return null
  }
  return getAIConfig(configs.primaryProvider)
}

/**
 * プライマリAPIを設定
 */
export function setPrimaryProvider(provider: AIProvider | null): void {
  const configs = loadAIConfigs()
  configs.primaryProvider = provider
  saveAIConfigs(configs)
}

/**
 * プロバイダー設定を追加または更新
 */
export function saveAIConfig(config: AIConfig): void {
  const configs = loadAIConfigs()
  const existingIndex = configs.providers.findIndex(p => p.provider === config.provider)
  
  if (existingIndex >= 0) {
    configs.providers[existingIndex] = config
  } else {
    configs.providers.push(config)
  }

  // プライマリAPIが削除された場合、nullに設定
  if (configs.primaryProvider === config.provider && !config.enabled) {
    configs.primaryProvider = null
  }

  saveAIConfigs(configs)
}

/**
 * プロバイダー設定を削除
 */
export function deleteAIConfig(provider: AIProvider): void {
  const configs = loadAIConfigs()
  configs.providers = configs.providers.filter(p => p.provider !== provider)
  
  // プライマリAPIが削除された場合、nullに設定
  if (configs.primaryProvider === provider) {
    configs.primaryProvider = null
  }

  saveAIConfigs(configs)
}

