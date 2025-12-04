import { DailyRecord } from '../../types'

interface InsightsProps {
  records: DailyRecord[]
  previousRecords?: DailyRecord[]
}

export default function Insights({ records, previousRecords = [] }: InsightsProps) {
  if (records.length === 0) {
    return null
  }

  const insights: Array<{
    type: 'warning' | 'info' | 'success'
    title: string
    message: string
    icon: string
  }> = []

  // 体重の分析
  const weightRecords = records.filter(r => r.weight !== undefined && r.weight !== null)
  if (weightRecords.length >= 2) {
    const firstWeight = weightRecords[0].weight!
    const lastWeight = weightRecords[weightRecords.length - 1].weight!
    const weightChange = lastWeight - firstWeight
    const weightChangePercent = (weightChange / firstWeight) * 100

    if (weightChange < -1) {
      insights.push({
        type: 'warning',
        title: '体重減少',
        message: `${Math.abs(weightChange).toFixed(1)}kg減少しています（${Math.abs(weightChangePercent).toFixed(1)}%）`,
        icon: '⚠️',
      })
    } else if (weightChange > 1) {
      insights.push({
        type: 'info',
        title: '体重増加',
        message: `${weightChange.toFixed(1)}kg増加しています（${weightChangePercent.toFixed(1)}%）`,
        icon: '📈',
      })
    }
  }

  // 睡眠時間の分析
  const sleepRecords = records.filter(r => r.sleepDuration !== undefined && r.sleepDuration !== null)
  if (sleepRecords.length > 0) {
    const avgSleep = sleepRecords.reduce((sum, r) => sum + r.sleepDuration!, 0) / sleepRecords.length
    const avgSleepHours = avgSleep / 60

    if (avgSleepHours < 6) {
      insights.push({
        type: 'warning',
        title: '睡眠不足',
        message: `平均睡眠時間が${avgSleepHours.toFixed(1)}時間と短めです。7-8時間の睡眠を心がけましょう。`,
        icon: '😴',
      })
    } else if (avgSleepHours >= 7 && avgSleepHours <= 9) {
      insights.push({
        type: 'success',
        title: '良好な睡眠',
        message: `平均睡眠時間が${avgSleepHours.toFixed(1)}時間と適切です。`,
        icon: '✅',
      })
    } else if (avgSleepHours > 9) {
      insights.push({
        type: 'info',
        title: '睡眠時間が長め',
        message: `平均睡眠時間が${avgSleepHours.toFixed(1)}時間と長めです。`,
        icon: '💤',
      })
    }
  }

  // 体重と睡眠時間の関係
  if (weightRecords.length > 0 && sleepRecords.length > 0) {
    const weightChange = weightRecords.length >= 2
      ? weightRecords[weightRecords.length - 1].weight! - weightRecords[0].weight!
      : 0
    const avgSleep = sleepRecords.reduce((sum, r) => sum + r.sleepDuration!, 0) / sleepRecords.length
    const avgSleepHours = avgSleep / 60

    if (weightChange < -1 && avgSleepHours < 6) {
      insights.push({
        type: 'warning',
        title: '体重減少と睡眠不足',
        message: '体重が減っている一方で、睡眠時間が少ないです。睡眠不足は健康に影響を与える可能性があります。',
        icon: '⚠️',
      })
    }
  }

  // 食事パターンの分析
  const breakfastRecords = records.filter(r => r.breakfast && r.breakfast.trim() !== '')
  const breakfastRate = (breakfastRecords.length / records.length) * 100

  if (breakfastRate < 50) {
    insights.push({
      type: 'info',
      title: '朝食の記録が少ない',
      message: `朝食を記録している日が${breakfastRate.toFixed(0)}%と少ないです。`,
      icon: '🍳',
    })
  }

  // 前週/前月との比較
  if (previousRecords.length > 0) {
    const prevWeightRecords = previousRecords.filter(r => r.weight !== undefined && r.weight !== null)
    const currentWeightRecords = weightRecords

    if (prevWeightRecords.length > 0 && currentWeightRecords.length > 0) {
      const prevAvgWeight = prevWeightRecords.reduce((sum, r) => sum + r.weight!, 0) / prevWeightRecords.length
      const currentAvgWeight = currentWeightRecords.reduce((sum, r) => sum + r.weight!, 0) / currentWeightRecords.length
      const weightDiff = currentAvgWeight - prevAvgWeight

      if (Math.abs(weightDiff) > 0.5) {
        insights.push({
          type: weightDiff < 0 ? 'warning' : 'info',
          title: '前期間との比較',
          message: `平均体重が前期間と比べて${Math.abs(weightDiff).toFixed(1)}kg${weightDiff < 0 ? '減少' : '増加'}しています。`,
          icon: weightDiff < 0 ? '📉' : '📈',
        })
      }
    }

    const prevSleepRecords = previousRecords.filter(r => r.sleepDuration !== undefined && r.sleepDuration !== null)
    if (prevSleepRecords.length > 0 && sleepRecords.length > 0) {
      const prevAvgSleep = prevSleepRecords.reduce((sum, r) => sum + r.sleepDuration!, 0) / prevSleepRecords.length
      const currentAvgSleep = sleepRecords.reduce((sum, r) => sum + r.sleepDuration!, 0) / sleepRecords.length
      const sleepDiff = currentAvgSleep - prevAvgSleep
      const sleepDiffHours = sleepDiff / 60

      if (Math.abs(sleepDiffHours) > 0.5) {
        insights.push({
          type: sleepDiff < 0 ? 'warning' : 'success',
          title: '睡眠時間の変化',
          message: `平均睡眠時間が前期間と比べて${Math.abs(sleepDiffHours).toFixed(1)}時間${sleepDiff < 0 ? '減少' : '増加'}しています。`,
          icon: sleepDiff < 0 ? '😴' : '✅',
        })
      }
    }
  }

  if (insights.length === 0) {
    return (
      <div className="card-industrial p-6">
        <h3 className="font-display text-sm tracking-[0.1em] uppercase text-[var(--color-text-primary)] mb-4">
          分析インサイト
        </h3>
        <p className="text-[var(--color-text-tertiary)]">特筆すべき分析結果はありません。</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm tracking-[0.1em] uppercase text-[var(--color-text-primary)]">
        分析インサイト
      </h3>
      {insights.map((insight, index) => (
        <div
          key={index}
          className={`card-industrial p-4 border-l-4 ${
            insight.type === 'warning'
              ? 'border-[var(--color-error)] bg-[var(--color-error)]/5'
              : insight.type === 'info'
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
              : 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{insight.icon}</span>
            <div className="flex-1">
              <h4 className="font-display text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                {insight.title}
              </h4>
              <p className="text-sm text-[var(--color-text-secondary)]">{insight.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

