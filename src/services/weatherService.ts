/**
 * Open-Meteo APIを使用して天気情報を取得
 */

import { getWeatherConfig } from '../utils/weatherConfig'

interface WeatherData {
  temperature: number // 気温（℃）
  pressure: number // 気圧（hPa）
  humidity: number // 湿度（%）
  weatherCode: number // 天気コード
  time: string // 時刻
}

interface WeatherApiResponse {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    pressure_msl: number
    weather_code: number
    time: string
  }
}

/**
 * 天気コードを日本語の説明に変換
 */
function getWeatherDescription(code: number): string {
  // WMO Weather interpretation codes (WW)
  const weatherCodes: Record<number, string> = {
    0: '快晴',
    1: '晴れ',
    2: '一部曇り',
    3: '曇り',
    45: '霧',
    48: '着氷性霧',
    51: '小雨',
    53: '中程度の雨',
    55: '強い雨',
    56: '凍る小雨',
    57: '凍る強い雨',
    61: '雨',
    63: '中程度の雨',
    65: '強い雨',
    66: '凍る雨',
    67: '凍る強い雨',
    71: '小雪',
    73: '中程度の雪',
    75: '強い雪',
    77: '雪の粒',
    80: 'にわか雨',
    81: '中程度のにわか雨',
    82: '強いにわか雨',
    85: 'にわか雪',
    86: '強いにわか雪',
    95: '雷雨',
    96: '雹を伴う雷雨',
    99: '強い雹を伴う雷雨',
  }
  
  return weatherCodes[code] || '不明'
}

/**
 * 都市名から座標を取得
 */
export async function getCoordinatesFromCity(cityName: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=ja&format=json`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      return {
        latitude: data.results[0].latitude,
        longitude: data.results[0].longitude,
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to fetch coordinates from city name:', error)
    return null
  }
}

/**
 * 天気情報を取得（設定された座標を使用）
 */
export async function getWeatherData(): Promise<WeatherData | null> {
  try {
    const config = getWeatherConfig()
    const latitude = config.latitude
    const longitude = config.longitude
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,pressure_msl,weather_code&timezone=Asia%2FTokyo`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`)
    }
    
    const data: WeatherApiResponse = await response.json()
    
    return {
      temperature: Math.round(data.current.temperature_2m),
      pressure: Math.round(data.current.pressure_msl),
      humidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      time: data.current.time,
    }
  } catch (error) {
    console.error('Failed to fetch weather data:', error)
    return null
  }
}

/**
 * 天気コードから説明を取得
 */
export function getWeatherDescriptionFromCode(code: number): string {
  return getWeatherDescription(code)
}

