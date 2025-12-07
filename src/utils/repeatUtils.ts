import { Task, RepeatPattern, RepeatConfig } from '../types'

/**
 * 繰り返しパターンに基づいて次のタスクの期限日を計算する
 */
export function calculateNextDueDate(
  currentDueDate: string,
  repeatPattern: RepeatPattern,
  repeatConfig?: RepeatConfig
): string | undefined {
  if (repeatPattern === 'none' || !repeatConfig) {
    return undefined
  }

  const currentDate = new Date(currentDueDate)
  const nextDate = new Date(currentDate)

  switch (repeatPattern) {
    case 'daily':
      nextDate.setDate(currentDate.getDate() + (repeatConfig.interval || 1))
      break

    case 'weekly':
      if (repeatConfig.daysOfWeek && repeatConfig.daysOfWeek.length > 0) {
        // 指定された曜日の次の日を探す
        const currentDay = currentDate.getDay()
        const sortedDays = [...repeatConfig.daysOfWeek].sort((a, b) => a - b)
        
        // 今週の残りの日をチェック
        let foundDay = sortedDays.find(day => day > currentDay)
        
        if (foundDay !== undefined) {
          const daysToAdd = foundDay - currentDay
          nextDate.setDate(currentDate.getDate() + daysToAdd)
        } else {
          // 来週の最初の日
          const daysToAdd = 7 - currentDay + sortedDays[0]
          nextDate.setDate(currentDate.getDate() + daysToAdd)
        }
      } else {
        // 曜日指定がない場合は間隔で計算
        nextDate.setDate(currentDate.getDate() + (repeatConfig.interval || 7))
      }
      break

    case 'monthly':
      if (repeatConfig.dayOfMonth) {
        // 指定された日付に設定
        nextDate.setMonth(currentDate.getMonth() + (repeatConfig.interval || 1))
        nextDate.setDate(repeatConfig.dayOfMonth)
      } else {
        // 同じ日付の次の月
        nextDate.setMonth(currentDate.getMonth() + (repeatConfig.interval || 1))
      }
      break

    case 'custom':
      // カスタムパターンは間隔で計算
      nextDate.setDate(currentDate.getDate() + (repeatConfig.interval || 1))
      break

    default:
      return undefined
  }

  // 終了日のチェック
  if (repeatConfig.endDate) {
    const endDate = new Date(repeatConfig.endDate)
    if (nextDate > endDate) {
      return undefined
    }
  }

  return nextDate.toISOString().split('T')[0]
}

/**
 * 完了した繰り返しタスクから次のタスクを生成する
 * 期限がないため、繰り返しタスクの生成は無効化されています
 */
export function generateNextRepeatTask(_task: Task): Task | null {
  // 期限がないため、繰り返しタスクは生成しない
  return null
}

/**
 * 繰り返しタスクが今日の日付に該当するかチェック
 */
export function isRepeatTaskForToday(task: Task): boolean {
  if (task.repeatPattern === 'none' || !task.repeatConfig) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const taskCreatedDate = new Date(task.createdAt)
  taskCreatedDate.setHours(0, 0, 0, 0)

  // 終了日のチェック
  if (task.repeatConfig.endDate) {
    const endDate = new Date(task.repeatConfig.endDate)
    endDate.setHours(0, 0, 0, 0)
    if (today > endDate) {
      return false
    }
  }

  switch (task.repeatPattern) {
    case 'daily':
      const interval = task.repeatConfig.interval || 1
      const daysSinceCreation = Math.floor((today.getTime() - taskCreatedDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceCreation >= 0 && daysSinceCreation % interval === 0

    case 'weekly':
      if (task.repeatConfig.daysOfWeek && task.repeatConfig.daysOfWeek.length > 0) {
        return task.repeatConfig.daysOfWeek.includes(today.getDay())
      }
      // 曜日指定がない場合は、作成日からの週数で判定
      const weeksSinceCreation = Math.floor((today.getTime() - taskCreatedDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
      const weekInterval = task.repeatConfig.interval || 1
      return weeksSinceCreation >= 0 && weeksSinceCreation % weekInterval === 0

    case 'monthly':
      if (task.repeatConfig.dayOfMonth) {
        return today.getDate() === task.repeatConfig.dayOfMonth
      }
      // 日付指定がない場合は、作成日と同じ日付かチェック
      return today.getDate() === taskCreatedDate.getDate()

    case 'custom':
      const customInterval = task.repeatConfig.interval || 1
      const customDaysSinceCreation = Math.floor((today.getTime() - taskCreatedDate.getTime()) / (1000 * 60 * 60 * 24))
      return customDaysSinceCreation >= 0 && customDaysSinceCreation % customInterval === 0

    default:
      return false
  }
}

/**
 * 今日の日付に該当する繰り返しタスクを生成
 */
export function generateTodayRepeatTask(originalTask: Task): Task | null {
  if (!isRepeatTaskForToday(originalTask)) {
    return null
  }

  // 今日の日付に該当する新しいタスクを生成
  const newTask: Task = {
    ...originalTask,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: undefined, // 未完了状態
    startTime: undefined, // タイマー状態をリセット
    endTime: undefined,
    elapsedTime: undefined,
    isRunning: false,
  }

  return newTask
}

/**
 * 繰り返しタスクが終了日を過ぎているかチェック
 */
export function isRepeatTaskExpired(task: Task): boolean {
  if (task.repeatPattern === 'none' || !task.repeatConfig?.endDate) {
    return false
  }

  const endDate = new Date(task.repeatConfig.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)

  return today > endDate
}

/**
 * 繰り返しタスクの説明文を生成
 */
export function getRepeatDescription(repeatPattern: RepeatPattern, repeatConfig?: RepeatConfig): string {
  if (repeatPattern === 'none' || !repeatConfig) {
    return ''
  }

  const interval = repeatConfig.interval || 1

  switch (repeatPattern) {
    case 'daily':
      return interval === 1 ? '毎日' : `毎${interval}日`

    case 'weekly':
      if (repeatConfig.daysOfWeek && repeatConfig.daysOfWeek.length > 0) {
        const dayNames = ['日', '月', '火', '水', '木', '金', '土']
        const days = repeatConfig.daysOfWeek.map(d => dayNames[d]).join('・')
        return `毎週 ${days}`
      }
      return interval === 1 ? '毎週' : `毎${interval}週間`

    case 'monthly':
      if (repeatConfig.dayOfMonth) {
        return `毎月${repeatConfig.dayOfMonth}日`
      }
      return interval === 1 ? '毎月' : `毎${interval}ヶ月`

    case 'custom':
      return `カスタム（${interval}日間隔）`

    default:
      return ''
  }
}

/**
 * タスクが今日のタスクかどうかを判定
 */
export function isTaskForToday(task: Task): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)
  const todayStr = today.toISOString().split('T')[0]

  // 1. 今日作成されたタスク
  if (task.createdAt) {
    // 日付文字列で比較（より確実）
    if (task.createdAt.startsWith(todayStr)) {
      return true
    }
    // Dateオブジェクトでも比較
    const createdDate = new Date(task.createdAt)
    if (createdDate >= today && createdDate <= todayEnd) {
      return true
    }
  }

  // 2. 今日が期限日のタスク
  if (task.dueDate) {
    // 日付文字列で比較
    if (task.dueDate.startsWith(todayStr)) {
      return true
    }
    // Dateオブジェクトでも比較
    const dueDate = new Date(task.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    if (dueDate.getTime() === today.getTime()) {
      return true
    }
  }

  // 3. 今日作業を開始したタスク
  if (task.startTime) {
    const startDate = new Date(task.startTime)
    if (startDate >= today && startDate <= todayEnd) {
      return true
    }
  }

  // 4. 繰り返しタスクで今日に該当するもの
  if (task.repeatPattern !== 'none') {
    return isRepeatTaskForToday(task)
  }

  return false
}

