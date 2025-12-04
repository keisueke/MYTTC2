import { DailyRecord } from '../../types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface SleepChartProps {
  records: DailyRecord[]
  width?: number
  height?: number
}

export default function SleepChart({ records, width = 800, height = 300 }: SleepChartProps) {
  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-text-tertiary)]">
        データがありません
      </div>
    )
  }

  const sleepRecords = records.filter(r => r.sleepDuration !== undefined && r.sleepDuration !== null)
  
  if (sleepRecords.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-text-tertiary)]">
        睡眠時間の記録がありません
      </div>
    )
  }

  const padding = { top: 20, right: 40, bottom: 40, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const durations = sleepRecords.map(r => r.sleepDuration!)
  const minDuration = Math.min(...durations)
  const maxDuration = Math.max(...durations)
  const durationRange = maxDuration - minDuration || 1
  const durationPadding = durationRange * 0.1

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? `${mins}m` : ''}`
  }

  const points = sleepRecords.map((record, index) => {
    const x = (index / (sleepRecords.length - 1 || 1)) * chartWidth
    const normalizedDuration = (record.sleepDuration! - minDuration + durationPadding) / (durationRange + durationPadding * 2)
    const y = chartHeight - (normalizedDuration * chartHeight)
    return { x: x + padding.left, y: y + padding.top, duration: record.sleepDuration!, date: record.date }
  })

  const pathData = points.length > 0
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
    : ''

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="min-w-full">
        {/* グリッド線 */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = padding.top + (chartHeight / 4) * i
          const value = maxDuration - (durationRange / 4) * i
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                style={{ fontSize: '12px', fill: 'var(--color-text-tertiary)' }}
              >
                {formatDuration(value)}
              </text>
            </g>
          )
        })}

        {/* 折れ線 */}
        <path
          d={pathData}
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth="2"
        />

        {/* データポイント */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="var(--color-secondary)"
              className="hover:r-6 transition-all cursor-pointer"
            />
            <title>
              {format(new Date(point.date), 'yyyy年MM月dd日', { locale: ja })}: {formatDuration(point.duration)}
            </title>
          </g>
        ))}

        {/* X軸ラベル */}
        {points.map((point, index) => {
          if (index % Math.ceil(points.length / 7) === 0 || index === points.length - 1) {
            return (
              <text
                key={index}
                x={point.x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                style={{ fontSize: '12px', fill: 'var(--color-text-tertiary)' }}
                transform={`rotate(-45 ${point.x} ${height - padding.bottom + 20})`}
              >
                {format(new Date(point.date), 'MM/dd', { locale: ja })}
              </text>
            )
          }
          return null
        })}
      </svg>
    </div>
  )
}

