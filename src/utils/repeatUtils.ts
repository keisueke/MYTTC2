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
 */
export function generateNextRepeatTask(task: Task): Task | null {
  if (task.repeatPattern === 'none' || !task.dueDate || !task.repeatConfig) {
    return null
  }

  const nextDueDate = calculateNextDueDate(
    task.dueDate,
    task.repeatPattern,
    task.repeatConfig
  )

  if (!nextDueDate) {
    return null
  }

  return {
    ...task,
    id: crypto.randomUUID(),
    completed: false,
    dueDate: nextDueDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
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

