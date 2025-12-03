import { WeatherConfig } from '../types'

const WEATHER_CONFIG_STORAGE_KEY = 'mytcc2_weather_config'

/**
 * デフォルトの天気設定（東京）
 */
const DEFAULT_WEATHER_CONFIG: WeatherConfig = {
  cityName: '東京',
  latitude: 35.6762,
  longitude: 139.6503,
}

/**
 * 保存された天気設定を取得
 */
export function getWeatherConfig(): WeatherConfig {
  try {
    const stored = localStorage.getItem(WEATHER_CONFIG_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load weather config from localStorage:', error)
  }
  
  return DEFAULT_WEATHER_CONFIG
}

/**
 * 天気設定を保存
 */
export function saveWeatherConfig(config: WeatherConfig): void {
  try {
    localStorage.setItem(WEATHER_CONFIG_STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save weather config to localStorage:', error)
    throw new Error('天気設定の保存に失敗しました')
  }
}

