import { useWeather } from '../../hooks/useWeather'
import { getWeatherConfig } from '../../services/taskService'

/**
 * 天気コードからアイコンを取得
 */
function getWeatherIcon(code: number): string {
  if (code === 0 || code === 1) return '☀️' // 快晴・晴れ
  if (code >= 2 && code <= 3) return '☁️' // 一部曇り・曇り
  if (code >= 45 && code <= 48) return '🌫️' // 霧
  if (code >= 51 && code <= 67) return '🌧️' // 雨
  if (code >= 71 && code <= 86) return '❄️' // 雪
  if (code >= 95 && code <= 99) return '⛈️' // 雷雨
  return '☁️' // デフォルト
}

export default function WeatherCard() {
  const { weather, loading, error } = useWeather()
  const config = getWeatherConfig()

  if (loading) {
    return (
      <div className="card-industrial p-4">
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="card-industrial p-4">
        <div className="text-center py-2">
          <p className="font-display text-xs text-[var(--color-text-tertiary)]">
            天気情報の取得に失敗しました
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card-industrial p-4">
      <div className="flex items-center justify-between gap-4">
        {/* 天気アイコンと気温 */}
        <div className="flex items-center gap-3">
          <span className="text-4xl leading-none">{getWeatherIcon(weather.weatherCode)}</span>
          <div>
            <p className="font-display text-2xl font-semibold text-[var(--color-text-primary)] leading-none">
              {weather.temperature}°C
            </p>
            <p className="font-display text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
              {config.cityName}
            </p>
          </div>
        </div>

        {/* 気圧と湿度 */}
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="font-display text-[10px] tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]">
              気圧
            </p>
            <p className="font-display text-sm font-semibold text-[var(--color-text-primary)]">
              {weather.pressure}
              <span className="text-xs text-[var(--color-text-tertiary)] ml-0.5">hPa</span>
            </p>
          </div>
          <div>
            <p className="font-display text-[10px] tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]">
              湿度
            </p>
            <p className="font-display text-sm font-semibold text-[var(--color-text-primary)]">
              {Math.round(weather.humidity)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

