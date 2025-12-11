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
 * 繰り返しタスクが指定日付に該当するかチェック
 */
export function isRepeatTaskForDate(task: Task, baseDate: Date): boolean {
  // repeatPatternが'none'の場合は繰り返しタスクではない
  if (task.repeatPattern === 'none') {
    return false
  }

  // createdAtがない場合は判定不可能なのでfalseを返す
  if (!task.createdAt) {
    // #region agent log
    console.log('[DEBUG] isRepeatTaskForDate: createdAt is missing', { taskId: task.id, title: task.title })
    // #endregion
    return false
  }

  const targetDate = new Date(baseDate)
  targetDate.setHours(0, 0, 0, 0)
  const taskCreatedDate = new Date(task.createdAt)
  
  // createdAtが無効な日付の場合はfalseを返す
  if (isNaN(taskCreatedDate.getTime())) {
    // #region agent log
    console.log('[DEBUG] isRepeatTaskForDate: createdAt is invalid', { taskId: task.id, title: task.title, createdAt: task.createdAt })
    // #endregion
    return false
  }
  taskCreatedDate.setHours(0, 0, 0, 0)

  // repeatConfigがない場合はデフォルト値を使用
  const repeatConfig = task.repeatConfig || { interval: 1 }

  // 終了日のチェック
  if (repeatConfig.endDate) {
    const endDate = new Date(repeatConfig.endDate)
    endDate.setHours(0, 0, 0, 0)
    if (targetDate > endDate) {
      return false
    }
  }

  // #region agent log
  console.log('[DEBUG] isRepeatTaskForDate', {
    taskId: task.id,
    title: task.title,
    repeatPattern: task.repeatPattern,
    repeatConfig,
    targetDate: targetDate.toISOString(),
    taskCreatedDate: taskCreatedDate.toISOString(),
  })
  // #endregion

  switch (task.repeatPattern) {
    case 'daily':
      const interval = repeatConfig.interval || 1
      const daysSinceCreation = Math.floor((targetDate.getTime() - taskCreatedDate.getTime()) / (1000 * 60 * 60 * 24))
      // #region agent log
      console.log('[DEBUG] isRepeatTaskForDate daily check', { taskId: task.id, interval, daysSinceCreation, result: daysSinceCreation >= 0 && daysSinceCreation % interval === 0 })
      // #endregion
      return daysSinceCreation >= 0 && daysSinceCreation % interval === 0

    case 'weekly':
      if (repeatConfig.daysOfWeek && repeatConfig.daysOfWeek.length > 0) {
        // 曜日指定がある場合は、対象日付の曜日が含まれているかチェック
        // ただし、タスク作成日以降であることも確認
        const daysSinceCreationWeekly = Math.floor((targetDate.getTime() - taskCreatedDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceCreationWeekly < 0) {
          return false
        }
        return repeatConfig.daysOfWeek.includes(targetDate.getDay())
      }
      // 曜日指定がない場合は、作成日からの週数で判定
      const weeksSinceCreation = Math.floor((targetDate.getTime() - taskCreatedDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
      const weekInterval = repeatConfig.interval || 1
      return weeksSinceCreation >= 0 && weeksSinceCreation % weekInterval === 0

    case 'monthly':
      // タスク作成日以降であることを確認
      const daysSinceCreationMonthly = Math.floor((targetDate.getTime() - taskCreatedDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceCreationMonthly < 0) {
        return false
      }
      if (repeatConfig.dayOfMonth) {
        return targetDate.getDate() === repeatConfig.dayOfMonth
      }
      // 日付指定がない場合は、作成日と同じ日付かチェック
      return targetDate.getDate() === taskCreatedDate.getDate()

    case 'custom':
      const customInterval = repeatConfig.interval || 1
      const customDaysSinceCreation = Math.floor((targetDate.getTime() - taskCreatedDate.getTime()) / (1000 * 60 * 60 * 24))
      return customDaysSinceCreation >= 0 && customDaysSinceCreation % customInterval === 0

    default:
      return false
  }
}

/**
 * 繰り返しタスクが今日の日付に該当するかチェック
 */
export function isRepeatTaskForToday(task: Task): boolean {
  return isRepeatTaskForDate(task, new Date())
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
 * ローカル日付文字列を取得（YYYY-MM-DD形式）
 */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 日付文字列からローカル日付部分を抽出（YYYY-MM-DD形式）
 * ISO文字列またはローカルISO文字列の両方に対応
 */
function extractLocalDateFromString(dateStr: string): string {
  // 日付文字列をDateオブジェクトに変換してローカル日付を取得
  const date = new Date(dateStr)
  return toLocalDateString(date)
}

/**
 * タスクが指定日付のタスクかどうかを判定
 */
export function isTaskForDate(task: Task, baseDate: Date): boolean {
  const targetDate = new Date(baseDate)
  targetDate.setHours(0, 0, 0, 0)
  const targetDateEnd = new Date(targetDate)
  targetDateEnd.setHours(23, 59, 59, 999)
  const targetDateStr = toLocalDateString(targetDate)

  // 繰り返しタスクの場合は、最初にチェックしてcreatedAtがその日付でない場合は除外
  if (task.repeatPattern !== 'none') {
    // 繰り返しタスクの場合は、createdAtがその日付であることを必須条件とする
    // これにより、別の日に作成された繰り返しタスクは表示されない
    if (!task.createdAt) {
      return false
    }
    const createdDateStr = extractLocalDateFromString(task.createdAt)
    if (createdDateStr !== targetDateStr) {
      return false
    }
    return isRepeatTaskForDate(task, baseDate)
  }

  // 1. 指定日付に作成されたタスク（繰り返しタスク以外）
  if (task.createdAt) {
    const createdDateStr = extractLocalDateFromString(task.createdAt)
    if (createdDateStr === targetDateStr) {
      return true
    }
  }

  // 2. 指定日付が期限日のタスク（繰り返しタスク以外）
  if (task.dueDate) {
    // dueDateは通常YYYY-MM-DD形式なのでそのまま比較
    if (task.dueDate.startsWith(targetDateStr)) {
      return true
    }
    // Dateオブジェクトでも比較（タイムゾーン考慮）
    const dueDate = new Date(task.dueDate)
    const dueDateStr = toLocalDateString(dueDate)
    if (dueDateStr === targetDateStr) {
      return true
    }
  }

  // 3. 指定日付に作業を開始したタスク（繰り返しタスク以外）
  if (task.startTime) {
    const startDateStr = extractLocalDateFromString(task.startTime)
    if (startDateStr === targetDateStr) {
      return true
    }
  }

  return false
}

/**
 * タスクが今日のタスクかどうかを判定
 */
export function isTaskForToday(task: Task): boolean {
  return isTaskForDate(task, new Date())
}

