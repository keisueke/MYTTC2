/**
 * ブラウザ通知APIを使用した通知サービス
 */

/**
 * 通知の許可をリクエスト
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission
  }

  return 'denied'
}

/**
 * 通知を表示
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!('Notification' in window)) {
    console.warn('このブラウザは通知をサポートしていません')
    return null
  }

  if (Notification.permission !== 'granted') {
    console.warn('通知の許可がありません')
    return null
  }

  const notification = new Notification(title, {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    ...options,
  })

  // 通知をクリックしたら閉じる
  notification.onclick = () => {
    notification.close()
    window.focus()
  }

  return notification
}

/**
 * タスクのリマインダー通知をスケジュール
 */
export function scheduleNotification(
  taskTitle: string,
  reminderTime: Date,
  dueDate?: Date
): void {
  const now = new Date()
  const timeUntilReminder = reminderTime.getTime() - now.getTime()

  if (timeUntilReminder <= 0) {
    // 既に時間が過ぎている場合は即座に通知
    const message = dueDate
      ? `「${taskTitle}」の期限が近づいています`
      : `「${taskTitle}」のリマインダーです`
    showNotification(message, {
      body: dueDate
        ? `期限: ${dueDate.toLocaleString('ja-JP')}`
        : 'タスクを確認してください',
      tag: `task-reminder-${taskTitle}`,
    })
    return
  }

  // 指定された時間に通知
  setTimeout(() => {
    const message = dueDate
      ? `「${taskTitle}」の期限が近づいています`
      : `「${taskTitle}」のリマインダーです`
    showNotification(message, {
      body: dueDate
        ? `期限: ${dueDate.toLocaleString('ja-JP')}`
        : 'タスクを確認してください',
      tag: `task-reminder-${taskTitle}`,
    })
  }, timeUntilReminder)
}

