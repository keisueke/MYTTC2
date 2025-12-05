import { useState, useEffect } from 'react'
import { Task, DailyRecord } from '../../types'
import { useNotification } from '../../context/NotificationContext'
import * as aiConfig from '../../services/aiConfig'
import * as reflectionService from '../../services/reflectionService'
import { DailyReflection as DailyReflectionType } from '../../types'

interface DailyReflectionProps {
  tasks: Task[]
  dailyRecords?: DailyRecord[]
}

export default function DailyReflection({ tasks, dailyRecords }: DailyReflectionProps) {
  const { showNotification } = useNotification()
  const [primaryConfig, setPrimaryConfig] = useState(aiConfig.getPrimaryConfig())
  const [reflection, setReflection] = useState<DailyReflectionType | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const config = aiConfig.getPrimaryConfig()
    setPrimaryConfig(config)
    if (config?.enabled) {
      const existing = reflectionService.getReflectionByDate(today)
      setReflection(existing)
    }
  }, [today])

  const handleGenerate = async () => {
    const config = aiConfig.getPrimaryConfig()
    if (!config || !config.enabled || !config.apiKey) {
      showNotification('プライマリAI APIが設定されていません。設定画面でAPIキーを設定してください。', 'error')
      return
    }

    setGenerating(true)
    try {
      const newReflection = await reflectionService.generateReflection(
        tasks,
        dailyRecords
      )
      setReflection(newReflection)
      showNotification('振り返りを生成しました', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : '振り返りの生成に失敗しました'
      showNotification(message, 'error')
      console.error('Failed to generate reflection:', error)
    } finally {
      setGenerating(false)
    }
  }

  if (!primaryConfig || !primaryConfig.enabled) {
    return null
  }

  const todayTasks = tasks.filter(task => {
    if (task.completedAt) {
      return task.completedAt.startsWith(today)
    }
    if (task.createdAt) {
      return task.createdAt.startsWith(today)
    }
    return false
  })

  const completedTasks = todayTasks.filter(task => task.completedAt)
  const completionRate = todayTasks.length > 0 
    ? Math.round((completedTasks.length / todayTasks.length) * 100) 
    : 0

  return (
    <div className="card-industrial p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)]">
          今日の振り返り
        </h3>
        {!reflection && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-industrial text-xs"
          >
            {generating ? '生成中...' : '振り返りを生成'}
          </button>
        )}
      </div>

      {reflection ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-[var(--color-accent)]">
                {completionRate}%
              </p>
              <p className="font-display text-xs text-[var(--color-text-tertiary)]">
                完了率
              </p>
            </div>
            <div className="flex-1">
              <p className="font-display text-xs text-[var(--color-text-tertiary)] mb-1">
                完了: {reflection.completedTasks} / 総数: {reflection.totalTasks}
              </p>
              <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2">
                <div
                  className="bg-[var(--color-accent)] h-2 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-display text-xs font-medium text-[var(--color-text-primary)] mb-2">
              要約
            </h4>
            <p className="font-display text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {reflection.summary}
            </p>
          </div>

          {reflection.insights.length > 0 && (
            <div>
              <h4 className="font-display text-xs font-medium text-[var(--color-text-primary)] mb-2">
                インサイト
              </h4>
              <ul className="space-y-1">
                {reflection.insights.map((insight, index) => (
                  <li key={index} className="font-display text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                    <span className="text-[var(--color-accent)] mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reflection.suggestions.length > 0 && (
            <div>
              <h4 className="font-display text-xs font-medium text-[var(--color-text-primary)] mb-2">
                改善提案
              </h4>
              <ul className="space-y-1">
                {reflection.suggestions.map((suggestion, index) => (
                  <li key={index} className="font-display text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                    <span className="text-[var(--color-secondary)] mt-1">→</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 border-t border-[var(--color-border)]">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-industrial text-xs w-full"
            >
              {generating ? '再生成中...' : '振り返りを再生成'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="font-display text-sm text-[var(--color-text-tertiary)] mb-4">
            今日の振り返りを生成して、タスクの完了状況を分析しましょう
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-industrial"
          >
            {generating ? '生成中...' : '振り返りを生成'}
          </button>
        </div>
      )}
    </div>
  )
}

