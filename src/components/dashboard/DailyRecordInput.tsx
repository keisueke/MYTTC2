import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { DailyRecord, SummaryConfig } from '../../types'
import { getDailyRecord, saveDailyRecord, getSummaryConfig } from '../../services/taskService'
import { useNotification } from '../../context/NotificationContext'
import { useSelectedDate } from '../../context/SelectedDateContext'
import { validateTextInput } from '../../utils/validation'

export default function DailyRecordInput() {
  const { showNotification } = useNotification()
  const { selectedDate, isToday } = useSelectedDate()
  const [record, setRecord] = useState<Partial<DailyRecord>>({})
  const [config, setConfig] = useState<SummaryConfig>(getSummaryConfig())
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ローカル日付文字列を取得
  const toLocalDateStr = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // 選択日付が変わった時にデータを再読み込み
  useEffect(() => {
    const loadRecord = () => {
      const dateStr = toLocalDateStr(selectedDate)
      
      const existingRecord = getDailyRecord(selectedDate)
      if (existingRecord) {
        setRecord(existingRecord)
      } else {
        // 選択日付を設定
        setRecord({ date: dateStr })
      }
      
      setConfig(getSummaryConfig())
    }
    
    loadRecord()
  }, [selectedDate])

  const handleSave = () => {
    if (!record.date) return
    
    // バリデーション
    const newErrors: Record<string, string> = {}
    
    if (record.breakfast) {
      const breakfastValidation = validateTextInput(record.breakfast, '朝食')
      if (!breakfastValidation.valid && breakfastValidation.errorMessage) {
        newErrors.breakfast = breakfastValidation.errorMessage
      }
    }
    
    if (record.lunch) {
      const lunchValidation = validateTextInput(record.lunch, '昼食')
      if (!lunchValidation.valid && lunchValidation.errorMessage) {
        newErrors.lunch = lunchValidation.errorMessage
      }
    }
    
    if (record.dinner) {
      const dinnerValidation = validateTextInput(record.dinner, '夕食')
      if (!dinnerValidation.valid && dinnerValidation.errorMessage) {
        newErrors.dinner = dinnerValidation.errorMessage
      }
    }
    
    if (record.snack) {
      const snackValidation = validateTextInput(record.snack, '間食')
      if (!snackValidation.valid && snackValidation.errorMessage) {
        newErrors.snack = snackValidation.errorMessage
      }
    }
    
    setErrors(newErrors)
    
    // エラーがある場合は保存しない
    if (Object.keys(newErrors).length > 0) {
      showNotification('入力内容に問題があります', 'error')
      return
    }
    
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
      setErrors({}) // エラーをクリア
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
            {format(selectedDate, 'M/d(E)', { locale: ja })} の記録
            {isToday && (
              <span className="ml-2 text-sm font-normal text-[var(--color-accent)]">
                今日
              </span>
            )}
          </h2>
        </div>
        <Link
          to="/daily-records"
          className="btn-industrial text-xs px-3 py-1.5 hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-colors"
        >
          統計を確認 →
        </Link>
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
              onChange={(e) => {
                setRecord({ ...record, breakfast: e.target.value || undefined })
                // エラーをクリア
                if (errors.breakfast) {
                  setErrors({ ...errors, breakfast: '' })
                }
              }}
              placeholder="例: パン、コーヒー"
              className={`input-industrial w-full ${
                errors.breakfast ? 'border-[var(--color-error)]' : ''
              }`}
            />
            {errors.breakfast && (
              <p className="mt-1 font-display text-xs text-[var(--color-error)]">{errors.breakfast}</p>
            )}
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
              onChange={(e) => {
                setRecord({ ...record, lunch: e.target.value || undefined })
                if (errors.lunch) {
                  setErrors({ ...errors, lunch: '' })
                }
              }}
              placeholder="例: サラダ、スープ"
              className={`input-industrial w-full ${
                errors.lunch ? 'border-[var(--color-error)]' : ''
              }`}
            />
            {errors.lunch && (
              <p className="mt-1 font-display text-xs text-[var(--color-error)]">{errors.lunch}</p>
            )}
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
              onChange={(e) => {
                setRecord({ ...record, dinner: e.target.value || undefined })
                if (errors.dinner) {
                  setErrors({ ...errors, dinner: '' })
                }
              }}
              placeholder="例: ご飯、味噌汁、魚"
              className={`input-industrial w-full ${
                errors.dinner ? 'border-[var(--color-error)]' : ''
              }`}
            />
            {errors.dinner && (
              <p className="mt-1 font-display text-xs text-[var(--color-error)]">{errors.dinner}</p>
            )}
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
              onChange={(e) => {
                setRecord({ ...record, snack: e.target.value || undefined })
                if (errors.snack) {
                  setErrors({ ...errors, snack: '' })
                }
              }}
              placeholder="例: チョコレート"
              className={`input-industrial w-full ${
                errors.snack ? 'border-[var(--color-error)]' : ''
              }`}
            />
            {errors.snack && (
              <p className="mt-1 font-display text-xs text-[var(--color-error)]">{errors.snack}</p>
            )}
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
    </div>
  )
}

