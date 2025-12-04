import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DailyRecord, SummaryConfig } from '../../types'
import { getDailyRecord, saveDailyRecord, getSummaryConfig } from '../../services/taskService'
import { useNotification } from '../../context/NotificationContext'

export default function DailyRecordInput() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [record, setRecord] = useState<Partial<DailyRecord>>({})
  const [config, setConfig] = useState<SummaryConfig>(getSummaryConfig())
  const [saving, setSaving] = useState(false)
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
              睡眠時間 (分)
            </label>
            <input
              type="number"
              value={record.sleepDuration || ''}
              onChange={(e) => setRecord({ ...record, sleepDuration: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="例: 450 (7時間30分)"
              className="input-industrial w-full"
            />
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

        <div className="pt-4 border-t border-[var(--color-border)] flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-industrial disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={() => navigate('/daily-records')}
            className="btn-industrial"
          >
            記録を確認
          </button>
        </div>
      </div>
    </div>
  )
}

