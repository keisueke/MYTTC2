import { useState, useEffect } from 'react'
import { requestNotificationPermission, showNotification } from '../../services/notificationService'

export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    try {
      const newPermission = await requestNotificationPermission()
      setPermission(newPermission)
      
      if (newPermission === 'granted') {
        showNotification('通知が有効になりました', {
          body: 'タスクのリマインダーが通知されます',
          tag: 'notification-enabled',
        })
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleTestNotification = () => {
    if (permission === 'granted') {
      showNotification('テスト通知', {
        body: '通知が正常に動作しています',
        tag: 'test-notification',
      })
    }
  }

  if (!('Notification' in window)) {
    return (
      <div className="card-industrial p-4">
        <p className="font-display text-sm text-[var(--color-text-tertiary)]">
          このブラウザは通知をサポートしていません
        </p>
      </div>
    )
  }

  return (
    <div className="card-industrial p-6 space-y-4">
      <div>
        <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)] mb-2">
          通知設定
        </h3>
        <p className="font-display text-xs text-[var(--color-text-tertiary)] mb-4">
          タスクの期限やリマインダーを通知で受け取ることができます
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-sm text-[var(--color-text-primary)]">
              通知の許可状態
            </p>
            <p className="font-display text-xs text-[var(--color-text-tertiary)] mt-1">
              {permission === 'granted' && '✅ 通知が有効です'}
              {permission === 'denied' && '❌ 通知が拒否されています'}
              {permission === 'default' && '⚠️ 通知の許可が必要です'}
            </p>
          </div>
        </div>

        {permission !== 'granted' && (
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="btn-industrial w-full"
          >
            {isRequesting ? 'リクエスト中...' : '通知を有効にする'}
          </button>
        )}

        {permission === 'granted' && (
          <button
            onClick={handleTestNotification}
            className="btn-industrial w-full"
          >
            テスト通知を送信
          </button>
        )}

        {permission === 'denied' && (
          <div className="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded">
            <p className="font-display text-xs text-[var(--color-error)]">
              通知が拒否されています。ブラウザの設定から通知を許可してください。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

