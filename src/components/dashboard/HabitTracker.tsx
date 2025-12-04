import { useState } from 'react'
import { Task } from '../../types'

interface HabitTrackerProps {
  tasks: Task[]
}

/**
 * 今週の範囲（月曜日〜日曜日）を取得
 */
const getWeekRange = () => {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 (日曜日) から 6 (土曜日)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // 月曜日までのオフセット
  
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  return { monday, sunday }
}

/**
 * 今週の各日（月〜日）を取得
 */
const getWeekDays = () => {
  const { monday } = getWeekRange()
  const days: Date[] = []
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
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
 * 指定された日付にタスクが完了したかどうかを判定
 */
const isCompletedOnDate = (task: Task, date: Date): boolean => {
  if (!task.completedAt) return false
  const completedDate = new Date(task.completedAt)
  return completedDate.toDateString() === date.toDateString()
}

/**
 * 今日の日付かどうかを判定
 */
const isToday = (date: Date): boolean => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export default function HabitTracker({ tasks }: HabitTrackerProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
  
  // 繰り返しパターンが設定されているタスクのみをフィルタリング
  const repeatTasks = tasks.filter(task => task.repeatPattern !== 'none')
  
  const weekDays = getWeekDays()
  const monthDays = getMonthDays()
  const dayLabels = ['月', '火', '水', '木', '金', '土', '日']
  
  const displayDays = viewMode === 'daily' ? weekDays : monthDays
  
  if (repeatTasks.length === 0) {
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
            {repeatTasks.map((task) => (
              <tr key={task.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <td className="p-2 font-display text-xs text-[var(--color-text-primary)] leading-tight">
                  <div className="line-clamp-2">
                    {task.title}
                  </div>
                </td>
                {displayDays.map((day, dayIndex) => {
                  const completed = isCompletedOnDate(task, day)
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

