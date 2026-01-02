import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { DailyRecord, SummaryConfig } from '../../types'
import { getDailyRecord, saveDailyRecord, getSummaryConfig } from '../../services/taskService'
import { useNotification } from '../../context/NotificationContext'
import { useSelectedDate } from '../../context/SelectedDateContext'
import { validateTextInput } from '../../utils/validation'
import { notifyDataChanged } from '../../hooks/useSyncBackend'
import { toLocalDateStr } from '../../services/dataStorage'

export default function DailyRecordInput() {
  const { showNotification } = useNotification()
  const { selectedDate, isToday } = useSelectedDate()
  const [record, setRecord] = useState<Partial<DailyRecord>>({})
  const [config, setConfig] = useState<SummaryConfig>(getSummaryConfig())
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
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

  // フィールド名と日本語ラベルのマッピング
  const fieldLabels: Record<string, string> = {
    breakfast: '朝食',
    lunch: '昼食',
    dinner: '夕食',
    snack: '間食',
  }

  // 自動保存関数（フォーカスが外れたときに呼ばれる）
  const handleAutoSave = (fieldName?: string) => {
    if (!record.date) return
    
    // バリデーション（テキストフィールドのみ）
    const newErrors: Record<string, string> = { ...errors }
    
    // 特定フィールドのみバリデーションする場合
    if (fieldName && fieldLabels[fieldName]) {
      const fieldValue = record[fieldName as keyof DailyRecord]
      if (fieldValue && typeof fieldValue === 'string') {
        const validation = validateTextInput(fieldValue, fieldLabels[fieldName])
        if (!validation.valid && validation.errorMessage) {
          newErrors[fieldName] = validation.errorMessage
          setErrors(newErrors)
          return // バリデーションエラーがある場合は保存しない
        } else {
          delete newErrors[fieldName]
        }
      } else {
        delete newErrors[fieldName]
      }
    }
    
    setErrors(newErrors)
    
    // 保存処理
    setSaveStatus('saving')
    
    // 既存のタイムアウトをクリア
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current)
    }
    
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
      setSaveStatus('saved')
      notifyDataChanged()
      
      // 2秒後にステータスをリセット
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Failed to save daily record:', error)
      setSaveStatus('error')
      showNotification('記録の保存に失敗しました', 'error')
      
      // 3秒後にステータスをリセット
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    }
  }

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current)
      }
    }
  }, [])


  return (
    <div className="card-industrial p-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Daily Record
            </p>
            {/* 保存状態インジケーター */}
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                保存中
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-success)]">
                <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                保存済み
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-error)]">
                <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                エラー
              </span>
            )}
          </div>
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
              onBlur={() => handleAutoSave()}
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
                onBlur={() => handleAutoSave()}
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
                onBlur={() => handleAutoSave()}
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
                  onBlur={() => handleAutoSave()}
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
                  onBlur={() => handleAutoSave()}
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
              onBlur={() => handleAutoSave('breakfast')}
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
              onBlur={() => handleAutoSave('lunch')}
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
              onBlur={() => handleAutoSave('dinner')}
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
              onBlur={() => handleAutoSave('snack')}
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

      </div>
    </div>
  )
}

