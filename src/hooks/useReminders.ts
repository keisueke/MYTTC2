import { useEffect, useCallback } from 'react'
import { checkAndNotifyReminders, checkDueTasks, checkRepeatTasks } from '../services/reminderService'
import { requestNotificationPermission } from '../services/notificationService'

/**
 * リマインダー管理用のフック
 */
export function useReminders() {
  // 通知の許可をリクエスト
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // 定期的にリマインダーをチェック
  useEffect(() => {
    // 初回チェック
    checkAndNotifyReminders()

    // 1分ごとにチェック
    const interval = setInterval(() => {
      checkAndNotifyReminders()
    }, 60000) // 60秒

    return () => clearInterval(interval)
  }, [])

  // 期限が近いタスクを取得
  const getDueTasks = useCallback((thresholdMinutes: number = 60) => {
    return checkDueTasks(thresholdMinutes)
  }, [])

  // 実行日が来た繰り返しタスクを取得
  const getRepeatTasks = useCallback(() => {
    return checkRepeatTasks()
  }, [])

  return {
    getDueTasks,
    getRepeatTasks,
  }
}

