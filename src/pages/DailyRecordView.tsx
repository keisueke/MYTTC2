import { useState, useMemo } from 'react'
import { getDailyRecordsByPeriod } from '../services/taskService'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import WeightChart from '../components/dailyRecord/WeightChart'
import SleepChart from '../components/dailyRecord/SleepChart'
import MealTable from '../components/dailyRecord/MealTable'
import Insights from '../components/dailyRecord/Insights'

export default function DailyRecordView() {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // 週の開始日と終了日を計算
  const getWeekRange = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 0 }) // 日曜日開始
    const end = endOfWeek(date, { weekStartsOn: 0 })
    return { start, end }
  }

  // 月の開始日と終了日を計算
  const getMonthRange = (date: Date) => {
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    return { start, end }
  }

  // 現在の期間の範囲を取得
  const currentRange = useMemo(() => {
    return period === 'week' ? getWeekRange(selectedDate) : getMonthRange(selectedDate)
  }, [period, selectedDate])

  // 前の期間の範囲を取得（比較用）
  const previousRange = useMemo(() => {
    if (period === 'week') {
      const prevDate = subWeeks(selectedDate, 1)
      return getWeekRange(prevDate)
    } else {
      const prevDate = subMonths(selectedDate, 1)
      return getMonthRange(prevDate)
    }
  }, [period, selectedDate])

  // 記録を取得
  const records = useMemo(() => {
    return getDailyRecordsByPeriod(currentRange.start, currentRange.end)
  }, [currentRange])

  const previousRecords = useMemo(() => {
    return getDailyRecordsByPeriod(previousRange.start, previousRange.end)
  }, [previousRange])

  // 統計サマリーを計算
  const stats = useMemo(() => {
    const weightRecords = records.filter(r => r.weight !== undefined && r.weight !== null)
    const sleepRecords = records.filter(r => r.sleepDuration !== undefined && r.sleepDuration !== null)

    const avgWeight = weightRecords.length > 0
      ? weightRecords.reduce((sum, r) => sum + r.weight!, 0) / weightRecords.length
      : null

    const minWeight = weightRecords.length > 0
      ? Math.min(...weightRecords.map(r => r.weight!))
      : null

    const maxWeight = weightRecords.length > 0
      ? Math.max(...weightRecords.map(r => r.weight!))
      : null

    const avgSleep = sleepRecords.length > 0
      ? sleepRecords.reduce((sum, r) => sum + r.sleepDuration!, 0) / sleepRecords.length
      : null

    const avgSleepHours = avgSleep ? avgSleep / 60 : null

    const mealRecords = records.filter(r => r.breakfast || r.lunch || r.dinner || r.snack)

    return {
      recordCount: records.length,
      weightRecords: weightRecords.length,
      sleepRecords: sleepRecords.length,
      mealRecords: mealRecords.length,
      avgWeight,
      minWeight,
      maxWeight,
      avgSleep,
      avgSleepHours,
    }
  }, [records])

  // 前の期間との比較
  const previousStats = useMemo(() => {
    const weightRecords = previousRecords.filter(r => r.weight !== undefined && r.weight !== null)
    const sleepRecords = previousRecords.filter(r => r.sleepDuration !== undefined && r.sleepDuration !== null)

    const avgWeight = weightRecords.length > 0
      ? weightRecords.reduce((sum, r) => sum + r.weight!, 0) / weightRecords.length
      : null

    const avgSleep = sleepRecords.length > 0
      ? sleepRecords.reduce((sum, r) => sum + r.sleepDuration!, 0) / sleepRecords.length
      : null

    return { avgWeight, avgSleep }
  }, [previousRecords])

  const handlePreviousPeriod = () => {
    if (period === 'week') {
      setSelectedDate(subWeeks(selectedDate, 1))
    } else {
      setSelectedDate(subMonths(selectedDate, 1))
    }
  }

  const handleNextPeriod = () => {
    if (period === 'week') {
      setSelectedDate(subWeeks(selectedDate, -1))
    } else {
      setSelectedDate(subMonths(selectedDate, -1))
    }
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-[var(--color-border)] pb-6">
        <div>
          <p className="font-display text-[10px] tracking-[0.3em] uppercase text-[var(--color-accent)] mb-2">
            Daily Records
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            日次記録
          </h1>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${
              period === 'week'
                ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            週次
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${
              period === 'month'
                ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            月次
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousPeriod}
            className="btn-industrial px-3 py-2"
          >
            ←
          </button>
          <div className="px-4 py-2 font-display text-sm text-[var(--color-text-primary)] min-w-[200px] text-center">
            {period === 'week'
              ? `${format(currentRange.start, 'yyyy年MM月dd日', { locale: ja })} - ${format(currentRange.end, 'MM月dd日', { locale: ja })}`
              : format(selectedDate, 'yyyy年MM月', { locale: ja })}
          </div>
          <button
            onClick={handleNextPeriod}
            className="btn-industrial px-3 py-2"
          >
            →
          </button>
          <button
            onClick={handleToday}
            className="btn-industrial px-4 py-2"
          >
            今日
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-industrial p-4">
          <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            記録日数
          </p>
          <p className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
            {stats.recordCount}
            <span className="text-sm text-[var(--color-text-tertiary)] ml-1">日</span>
          </p>
        </div>

        {stats.avgWeight !== null && (
          <div className="card-industrial p-4">
            <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              平均体重
            </p>
            <p className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
              {stats.avgWeight.toFixed(1)}
              <span className="text-sm text-[var(--color-text-tertiary)] ml-1">kg</span>
            </p>
            {previousStats.avgWeight !== null && (
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                前期間: {previousStats.avgWeight.toFixed(1)}kg
                {stats.avgWeight !== previousStats.avgWeight && (
                  <span className={stats.avgWeight > previousStats.avgWeight ? 'text-[var(--color-error)]' : 'text-[var(--color-secondary)]'}>
                    {' '}({stats.avgWeight > previousStats.avgWeight ? '+' : ''}{(stats.avgWeight - previousStats.avgWeight).toFixed(1)}kg)
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {stats.avgSleepHours !== null && (
          <div className="card-industrial p-4">
            <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              平均睡眠時間
            </p>
            <p className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
              {stats.avgSleepHours.toFixed(1)}
              <span className="text-sm text-[var(--color-text-tertiary)] ml-1">時間</span>
            </p>
            {previousStats.avgSleep !== null && (
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                前期間: {(previousStats.avgSleep / 60).toFixed(1)}時間
                {stats.avgSleep !== previousStats.avgSleep && (
                  <span className={stats.avgSleep! > previousStats.avgSleep ? 'text-[var(--color-secondary)]' : 'text-[var(--color-error)]'}>
                    {' '}({stats.avgSleep! > previousStats.avgSleep ? '+' : ''}{((stats.avgSleep! - previousStats.avgSleep) / 60).toFixed(1)}時間)
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        <div className="card-industrial p-4">
          <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            食事記録
          </p>
          <p className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
            {stats.mealRecords}
            <span className="text-sm text-[var(--color-text-tertiary)] ml-1">日</span>
          </p>
        </div>
      </div>

      {/* Insights */}
      <Insights records={records} previousRecords={previousRecords} />

      {/* Weight Chart */}
      {stats.weightRecords > 0 && (
        <div className="card-industrial p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
            <div>
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
                Weight Trend
              </p>
              <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                体重の推移
              </h2>
            </div>
            {stats.minWeight !== null && stats.maxWeight !== null && (
              <div className="text-right">
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  最小: {stats.minWeight.toFixed(1)}kg / 最大: {stats.maxWeight.toFixed(1)}kg
                </p>
              </div>
            )}
          </div>
          <WeightChart records={records} />
        </div>
      )}

      {/* Sleep Chart */}
      {stats.sleepRecords > 0 && (
        <div className="card-industrial p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
            <div>
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
                Sleep Trend
              </p>
              <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                睡眠時間の推移
              </h2>
            </div>
          </div>
          <SleepChart records={records} />
        </div>
      )}

      {/* Meal Table */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Meal Records
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              食事記録
            </h2>
          </div>
        </div>
        <MealTable records={records} />
      </div>
    </div>
  )
}

