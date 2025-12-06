import { useState, useEffect, useMemo } from 'react'
import { DailyRecord, SummaryConfig } from '../../types'
import { getDailyRecord, saveDailyRecord, getSummaryConfig, getDailyRecordsByPeriod } from '../../services/taskService'
import { useNotification } from '../../context/NotificationContext'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import WeightChart from '../dailyRecord/WeightChart'
import SleepChart from '../dailyRecord/SleepChart'
import MealTable from '../dailyRecord/MealTable'

type DailyRecordTab = 'input' | 'view'

export default function DailyRecordInput() {
  const { showNotification } = useNotification()
  const [record, setRecord] = useState<Partial<DailyRecord>>({})
  const [config, setConfig] = useState<SummaryConfig>(getSummaryConfig())
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<DailyRecordTab>('input')
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentDate, setCurrentDate] = useState<string>(() => {
    // 現在の日付を文字列で取得（YYYY-MM-DD）
    return new Date().toISOString().split('T')[0]
  })

  // 日付が変わった時にデータを再読み込み
  useEffect(() => {
    const loadTodayRecord = () => {
      const today = new Date()
      const todayDateStr = today.toISOString().split('T')[0]
      
      // 日付が変わった場合
      if (todayDateStr !== currentDate) {
        setCurrentDate(todayDateStr)
      }
      
      const todayRecord = getDailyRecord(today)
      if (todayRecord) {
        setRecord(todayRecord)
      } else {
        // 今日の日付を設定
        setRecord({ date: todayDateStr })
      }
      
      setConfig(getSummaryConfig())
    }
    
    loadTodayRecord()
    
    // ページが表示された時に日付をチェック（日付が変わった時にリセット）
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const today = new Date()
        const todayDateStr = today.toISOString().split('T')[0]
        if (todayDateStr !== currentDate) {
          loadTodayRecord()
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // 1時間ごとにも日付をチェック（念のため）
    const interval = setInterval(() => {
      const today = new Date()
      const todayDateStr = today.toISOString().split('T')[0]
      if (todayDateStr !== currentDate) {
        loadTodayRecord()
      }
    }, 60 * 60 * 1000) // 1時間ごと
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentDate])

  const handleSave = () => {
    if (!record.date) return
    
    setSaving(true)
    try {
      saveDailyRecord({
        date: record.date,
        weight: record.weight,
        bedtime: record.bedtime,
        wakeTime: record.wakeTime,
        sleepDuration: record.sleepDuration,
        breakfast: record.breakfast,
        lunch: record.lunch,
        dinner: record.dinner,
        snack: record.snack,
      })
      showNotification('記録を保存しました', 'success')
    } catch (error) {
      console.error('Failed to save daily record:', error)
      showNotification('記録の保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

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

  // 前の期間の統計を計算
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
    <div className="card-industrial p-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
            Daily Record
          </p>
          <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
            今日の記録
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('input')}
          className={`flex items-center gap-2 px-4 py-3 font-display text-sm transition-all duration-200 border-b-2 -mb-[2px] ${
            activeTab === 'input'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <span>✎</span>
          <span>入力</span>
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`flex items-center gap-2 px-4 py-3 font-display text-sm transition-all duration-200 border-b-2 -mb-[2px] ${
            activeTab === 'view'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <span>📊</span>
          <span>確認</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'input' && (
        <div className="space-y-4">
        {config.includeWeight && (
          <div>
            <label className="block font-display text-sm text-[var(--color-text-primary)] mb-2">
              体重 (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={record.weight || ''}
              onChange={(e) => setRecord({ ...record, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="例: 65.5"
              className="input-industrial w-full"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {config.includeBedtime && (
            <div>
              <label className="block font-display text-sm text-[var(--color-text-primary)] mb-2">
                就寝時間
              </label>
              <input
                type="time"
                value={record.bedtime || ''}
                onChange={(e) => setRecord({ ...record, bedtime: e.target.value || undefined })}
                className="input-industrial w-full"
              />
            </div>
          )}

          {config.includeWakeTime && (
            <div>
              <label className="block font-display text-sm text-[var(--color-text-primary)] mb-2">
                起床時間
              </label>
              <input
                type="time"
                value={record.wakeTime || ''}
                onChange={(e) => setRecord({ ...record, wakeTime: e.target.value || undefined })}
                className="input-industrial w-full"
              />
            </div>
          )}
        </div>

        {config.includeSleepDuration && (
          <div>
            <label className="block font-display text-sm text-[var(--color-text-primary)] mb-2">
              睡眠時間
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-display text-xs text-[var(--color-text-tertiary)] mb-1">
                  時間
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={record.sleepDuration !== undefined && record.sleepDuration !== null
                    ? Math.floor(record.sleepDuration / 60)
                    : ''}
                  onChange={(e) => {
                    const hours = e.target.value ? parseInt(e.target.value, 10) : 0
                    const currentMinutes = record.sleepDuration !== undefined && record.sleepDuration !== null
                      ? record.sleepDuration % 60
                      : 0
                    const totalMinutes = hours * 60 + currentMinutes
                    setRecord({ ...record, sleepDuration: totalMinutes > 0 ? totalMinutes : undefined })
                  }}
                  placeholder="7"
                  className="input-industrial w-full"
                />
              </div>
              <div>
                <label className="block font-display text-xs text-[var(--color-text-tertiary)] mb-1">
                  分
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={record.sleepDuration !== undefined && record.sleepDuration !== null
                    ? record.sleepDuration % 60
                    : ''}
                  onChange={(e) => {
                    const minutes = e.target.value ? parseInt(e.target.value, 10) : 0
                    const currentHours = record.sleepDuration !== undefined && record.sleepDuration !== null
                      ? Math.floor(record.sleepDuration / 60)
                      : 0
                    const totalMinutes = currentHours * 60 + minutes
                    setRecord({ ...record, sleepDuration: totalMinutes > 0 ? totalMinutes : undefined })
                  }}
                  placeholder="30"
                  className="input-industrial w-full"
                />
              </div>
            </div>
          </div>
        )}

        {config.includeBreakfast && (
          <div>
            <label className="block font-display text-sm text-[var(--color-text-primary)] mb-2">
              朝食
            </label>
            <input
              type="text"
              value={record.breakfast || ''}
              onChange={(e) => setRecord({ ...record, breakfast: e.target.value || undefined })}
              placeholder="例: パン、コーヒー"
              className="input-industrial w-full"
            />
          </div>
        )}

        {config.includeLunch && (
          <div>
            <label className="block font-display text-sm text-[var(--color-text-primary)] mb-2">
              昼食
            </label>
            <input
              type="text"
              value={record.lunch || ''}
              onChange={(e) => setRecord({ ...record, lunch: e.target.value || undefined })}
              placeholder="例: サラダ、スープ"
              className="input-industrial w-full"
            />
          </div>
        )}

        {config.includeDinner && (
          <div>
            <label className="block font-display text-sm text-[var(--color-text-primary)] mb-2">
              夕食
            </label>
            <input
              type="text"
              value={record.dinner || ''}
              onChange={(e) => setRecord({ ...record, dinner: e.target.value || undefined })}
              placeholder="例: ご飯、味噌汁、魚"
              className="input-industrial w-full"
            />
          </div>
        )}

        {config.includeSnack && (
          <div>
            <label className="block font-display text-sm text-[var(--color-text-primary)] mb-2">
              間食
            </label>
            <input
              type="text"
              value={record.snack || ''}
              onChange={(e) => setRecord({ ...record, snack: e.target.value || undefined })}
              placeholder="例: チョコレート"
              className="input-industrial w-full"
            />
          </div>
        )}

          <div className="pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-industrial w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'view' && (
        <div className="space-y-6">
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
                className="px-3 py-2 font-display text-xs hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                ←
              </button>
              <button
                onClick={handleToday}
                className="px-4 py-2 font-display text-xs hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                今日
              </button>
              <button
                onClick={handleNextPeriod}
                className="px-3 py-2 font-display text-xs hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                →
              </button>
            </div>
            <div className="ml-auto font-display text-xs text-[var(--color-text-secondary)]">
              {format(currentRange.start, 'yyyy年MM月dd日', { locale: ja })} ～ {format(currentRange.end, 'yyyy年MM月dd日', { locale: ja })}
            </div>
          </div>

          {/* Statistics Summary */}
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
                {stats.minWeight !== null && stats.maxWeight !== null && (
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    {stats.minWeight.toFixed(1)}～{stats.maxWeight.toFixed(1)}kg
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
                {previousStats.avgSleep !== null && stats.avgSleep !== null && (
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    前期間: {(previousStats.avgSleep / 60).toFixed(1)}時間
                    {stats.avgSleep !== previousStats.avgSleep && (
                      <span className={stats.avgSleep > previousStats.avgSleep ? 'text-[var(--color-secondary)]' : 'text-[var(--color-error)]'}>
                        {' '}({stats.avgSleep > previousStats.avgSleep ? '+' : ''}{((stats.avgSleep - previousStats.avgSleep) / 60).toFixed(1)}時間)
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

          {/* Charts */}
          <div className="p-4 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
            <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)] mb-4">
              体重の推移
            </h3>
            <WeightChart records={records} width={800} height={300} />
          </div>

          {stats.sleepRecords > 0 && (
            <div className="p-4 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
              <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)] mb-4">
                睡眠時間の推移
              </h3>
              <SleepChart records={records} width={800} height={300} />
            </div>
          )}

          {/* Meal Table */}
          <div className="p-4 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
            <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)] mb-4">
              食事記録
            </h3>
            <MealTable records={records} />
          </div>
        </div>
      )}
    </div>
  )
}

