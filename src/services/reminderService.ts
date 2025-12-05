import { Task, TaskReminder } from '../types'
import * as taskService from './taskService'
import { showNotification, scheduleNotification } from './notificationService'

/**
 * リマインダー管理サービス
 */

/**
 * タスクのリマインダーをスケジュール
 */
export function scheduleTaskReminder(task: Task): void {
  if (!task.dueDate || !task.reminders || task.reminders.length === 0) {
    return
  }

  const dueDate = new Date(task.dueDate)
  const now = new Date()

  task.reminders.forEach((reminder) => {
    if (reminder.notified) {
      return // 既に通知済み
    }

    const reminderTime = new Date(reminder.reminderTime)
    
    // リマインダー時間が未来の場合のみスケジュール
    if (reminderTime > now) {
      scheduleNotification(task.title, reminderTime, dueDate)
    } else if (reminderTime <= now && reminderTime >= new Date(now.getTime() - 60000)) {
      // 1分以内の場合は即座に通知
      const message = `「${task.title}」の期限が近づいています`
      showNotification(message, {
        body: `期限: ${dueDate.toLocaleString('ja-JP')}`,
        tag: `task-reminder-${task.id}`,
      })
      // 通知済みフラグを更新
      markReminderAsNotified(task.id, reminder.id)
    }
  })
}

/**
 * 期限が近いタスクを取得
 */
export function checkDueTasks(thresholdMinutes: number = 60): Task[] {
  const tasks = taskService.getTasks()
  const now = new Date()
  const threshold = new Date(now.getTime() + thresholdMinutes * 60 * 1000)

  return tasks.filter((task) => {
    if (!task.dueDate || task.completedAt) {
      return false
    }

    const dueDate = new Date(task.dueDate)
    return dueDate <= threshold && dueDate >= now
  })
}

/**
 * 実行日が来た繰り返しタスクを取得
 */
export function checkRepeatTasks(): Task[] {
  const tasks = taskService.getTasks()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return tasks.filter((task) => {
    if (task.repeatPattern === 'none' || task.completedAt) {
      return false
    }

    // 繰り返しタスクの次回実行日を計算
    const nextDate = calculateNextRepeatDate(task)
    if (!nextDate) {
      return false
    }

    const nextDateOnly = new Date(nextDate)
    nextDateOnly.setHours(0, 0, 0, 0)

    return nextDateOnly.getTime() === today.getTime()
  })
}

/**
 * 繰り返しタスクの次回実行日を計算
 */
export function calculateNextRepeatDate(task: Task): Date | null {
  if (task.repeatPattern === 'none' || !task.repeatConfig) {
    return null
  }

  const now = new Date()
  const lastCreated = new Date(task.createdAt)
  const config = task.repeatConfig

  switch (task.repeatPattern) {
    case 'daily':
      if (config.interval) {
        const daysSinceLast = Math.floor(
          (now.getTime() - lastCreated.getTime()) / (1000 * 60 * 60 * 24)
        )
        const nextDate = new Date(lastCreated)
        nextDate.setDate(
          lastCreated.getDate() + Math.ceil((daysSinceLast + 1) / config.interval) * config.interval
        )
        return nextDate
      }
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow

    case 'weekly':
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        const currentDay = now.getDay()
        const sortedDays = [...config.daysOfWeek].sort((a, b) => a - b)
        const nextDay = sortedDays.find((day) => day > currentDay) || sortedDays[0]
        const daysUntilNext = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay
        const nextDate = new Date(now)
        nextDate.setDate(now.getDate() + daysUntilNext)
        return nextDate
      }
      const nextWeek = new Date(now)
      nextWeek.setDate(nextWeek.getDate() + 7)
      return nextWeek

    case 'monthly':
      if (config.dayOfMonth) {
        const nextDate = new Date(now.getFullYear(), now.getMonth(), config.dayOfMonth)
        if (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + 1)
        }
        return nextDate
      }
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return nextMonth

    default:
      return null
  }
}

/**
 * リマインダーをキャンセル
 */
export function cancelReminder(taskId: string, reminderId: string): void {
  const task = taskService.getTaskById(taskId)
  if (!task || !task.reminders) {
    return
  }

  const updatedReminders = task.reminders.filter((r) => r.id !== reminderId)
  taskService.updateTask(taskId, {
    ...task,
    reminders: updatedReminders.length > 0 ? updatedReminders : undefined,
  })
}

/**
 * リマインダーを通知済みとしてマーク
 */
export function markReminderAsNotified(taskId: string, reminderId: string): void {
  const task = taskService.getTaskById(taskId)
  if (!task || !task.reminders) {
    return
  }

  const updatedReminders = task.reminders.map((r) =>
    r.id === reminderId ? { ...r, notified: true } : r
  )

  taskService.updateTask(taskId, {
    ...task,
    reminders: updatedReminders,
  })
}

/**
 * すべてのアクティブなリマインダーをチェックして通知
 */
export function checkAndNotifyReminders(): void {
  const tasks = taskService.getTasks()
  
  tasks.forEach((task) => {
    if (task.completedAt) {
      return // 完了済みタスクはスキップ
    }

    // リマインダーをチェック
    scheduleTaskReminder(task)

    // 期限が近いタスクをチェック
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate)
      const now = new Date()
      const timeUntilDue = dueDate.getTime() - now.getTime()
      const oneHour = 60 * 60 * 1000

      // 1時間以内の場合は通知
      if (timeUntilDue > 0 && timeUntilDue <= oneHour) {
        const message = `「${task.title}」の期限が1時間以内です`
        showNotification(message, {
          body: `期限: ${dueDate.toLocaleString('ja-JP')}`,
          tag: `task-due-${task.id}`,
        })
      }
    }
  })
}

