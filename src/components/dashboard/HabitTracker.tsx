import { useState, useMemo } from 'react'
import { Task, RoutineExecution } from '../../types'
import { getWeekStartDay } from '../../services/taskService'

interface HabitTrackerProps {
  tasks: Task[]
  routineExecutions?: RoutineExecution[]
}

/**
 * 今週の範囲を取得（週の開始日設定に基づく）
 */
const getWeekRange = (weekStartDay: 'sunday' | 'monday') => {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 (日曜日) から 6 (土曜日)
  
  let startOffset: number
  if (weekStartDay === 'sunday') {
    // 日曜日始まり: 今日が日曜(0)なら0、月曜(1)なら-1、...、土曜(6)なら-6
    startOffset = -dayOfWeek
  } else {
    // 月曜日始まり: 今日が日曜(0)なら-6、月曜(1)なら0、...、土曜(6)なら-5
    startOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  }
  
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() + startOffset)
  weekStart.setHours(0, 0, 0, 0)
  
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  
  return { weekStart, weekEnd }
}

/**
 * 今週の各日を取得（週の開始日設定に基づく）
 */
const getWeekDays = (weekStartDay: 'sunday' | 'monday') => {
  const { weekStart } = getWeekRange(weekStartDay)
  const days: Date[] = []
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    days.push(day)
  }
  
  return days
}

/**
 * 今月の各日を取得
 */
const getMonthDays = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const day = new Date(year, month, i)
    days.push(day)
  }
  
  return days
}

/**
 * ローカル日付文字列を取得（YYYY-MM-DD形式）
 */
const toLocalDateStr = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 指定された日付にルーティンが完了したかどうかを判定
 * RoutineExecutionから実行履歴を取得
 */
const isCompletedOnDate = (routineTaskId: string, routineExecutions: RoutineExecution[], date: Date): boolean => {
  const dateStr = toLocalDateStr(date)
  
  // 指定された日付の実行記録を探す
  const execution = routineExecutions.find(e => 
    e.routineTaskId === routineTaskId && e.date.startsWith(dateStr)
  )
  
  if (execution && execution.completedAt) {
    const completedDate = new Date(execution.completedAt)
    return completedDate.toDateString() === date.toDateString()
  }
  
  return false
}

/**
 * 今日の日付かどうかを判定
 */
const isToday = (date: Date): boolean => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export default function HabitTracker({ tasks, routineExecutions = [] }: HabitTrackerProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
  
  // 週の開始日設定を取得
  const weekStartDay = useMemo(() => getWeekStartDay(), [])
  
  // 繰り返しパターンが設定されているタスクのみをフィルタリング
  const repeatTasks = tasks.filter(task => task.repeatPattern !== 'none')
  
  // 同じタイトルと繰り返しパターンのタスクをグループ化
  // 各グループの代表タスク（最初に作成されたタスク）を取得
  const groupedTasks = useMemo(() => {
    const groups = new Map<string, { representative: Task; allTasks: Task[] }>()
    
    for (const task of repeatTasks) {
      const key = `${task.title}|${task.repeatPattern}`
      
      if (!groups.has(key)) {
        groups.set(key, { representative: task, allTasks: [task] })
      } else {
        const group = groups.get(key)!
        group.allTasks.push(task)
        // 代表タスクは最初に作成されたもの（createdAtが最も古いもの）
        if (new Date(task.createdAt) < new Date(group.representative.createdAt)) {
          group.representative = task
        }
      }
    }
    
    // ルーティンページと同じ順番（orderプロパティ優先）でソート
    const result = Array.from(groups.values())
    result.sort((a, b) => {
      // orderが設定されている場合はそれを優先
      const aOrder = a.representative.order
      const bOrder = b.representative.order
      
      if (aOrder !== undefined && bOrder !== undefined) {
        return aOrder - bOrder
      }
      if (aOrder !== undefined) return -1
      if (bOrder !== undefined) return 1
      
      // orderが設定されていない場合は作成日順（新しい順）
      return new Date(b.representative.createdAt).getTime() - new Date(a.representative.createdAt).getTime()
    })
    
    return result
  }, [repeatTasks])
  
  const weekDays = useMemo(() => getWeekDays(weekStartDay), [weekStartDay])
  const monthDays = getMonthDays()
  // 週の開始日に応じた曜日ラベル
  const dayLabels = weekStartDay === 'sunday' 
    ? ['日', '月', '火', '水', '木', '金', '土']
    : ['月', '火', '水', '木', '金', '土', '日']
  
  const displayDays = viewMode === 'daily' ? weekDays : monthDays
  
  if (groupedTasks.length === 0) {
    return (
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Habit Tracker
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              ハビットトラッカー
            </h2>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="font-display text-sm text-[var(--color-text-tertiary)]">
            繰り返しパターンが設定されているタスクがありません
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="card-industrial p-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
            Habit Tracker
          </p>
          <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
            ハビットトラッカー
          </h2>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${
              viewMode === 'daily'
                ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            デイリー
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${
              viewMode === 'monthly'
                ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            マンスリー
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 font-display text-[10px] tracking-[0.1em] uppercase text-[var(--color-text-tertiary)] border-b border-[var(--color-border)] w-24">
                タスク
              </th>
              {displayDays.map((day, index) => {
                const isTodayDate = isToday(day)
                const dayOfWeek = day.getDay()
                const dayLabel = viewMode === 'daily' 
                  ? dayLabels[dayOfWeek === 0 ? 6 : dayOfWeek - 1] // 月曜日を0にする
                  : `${day.getDate()}`
                
                return (
                  <th
                    key={index}
                    className={`text-center p-2 font-display text-[10px] tracking-[0.1em] uppercase border-b border-[var(--color-border)] ${
                      isTodayDate
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-text-tertiary)]'
                    }`}
                  >
                    {viewMode === 'daily' ? (
                      <>
                        {dayLabel}
                        <br />
                        <span className="text-[8px] font-normal">
                          {day.getDate()}
                        </span>
                      </>
                    ) : (
                      <span className="text-[8px] font-normal">
                        {dayLabel}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {groupedTasks.map((group) => (
              <tr key={group.representative.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <td className="p-2 font-display text-xs text-[var(--color-text-primary)] leading-tight">
                  <div className="line-clamp-2">
                    {group.representative.title}
                  </div>
                </td>
                {displayDays.map((day, dayIndex) => {
                  const completed = isCompletedOnDate(group.representative.id, routineExecutions, day)
                  const isTodayDate = isToday(day)
                  
                  return (
                    <td
                      key={dayIndex}
                      className={`text-center p-2 ${
                        isTodayDate
                          ? 'bg-[var(--color-bg-tertiary)]'
                          : ''
                      }`}
                    >
                      {completed ? (
                        <div className="w-5 h-5 mx-auto flex items-center justify-center bg-[var(--color-accent)] rounded-full">
                          <svg className="w-3 h-3 text-[var(--color-bg-primary)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 mx-auto flex items-center justify-center border-2 border-[var(--color-border)] rounded-full">
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

