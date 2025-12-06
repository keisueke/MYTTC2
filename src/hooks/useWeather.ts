import { useState, useEffect } from 'react'
import { getWeatherData, getWeatherDescriptionFromCode } from '../services/weatherService'

interface WeatherInfo {
  temperature: number
  maxTemperature: number
  minTemperature: number
  pressure: number
  humidity: number
  description: string
  weatherCode: number
  time: string
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const data = await getWeatherData()
        
        if (data) {
          setWeather({
            temperature: data.temperature,
            maxTemperature: data.maxTemperature,
            minTemperature: data.minTemperature,
            pressure: data.pressure,
            humidity: data.humidity,
            description: getWeatherDescriptionFromCode(data.weatherCode),
            weatherCode: data.weatherCode,
            time: data.time,
          })
        } else {
          setError('天気情報の取得に失敗しました')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '天気情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    
    // 1時間ごとに更新
    const interval = setInterval(fetchWeather, 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  return { weather, loading, error }
}

