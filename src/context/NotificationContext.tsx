import { createContext, useContext, useState, ReactNode } from 'react'

interface Notification {
  message: string
  type: 'success' | 'error' | 'info'
  id: string
}

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void
  notifications: Notification[]
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = crypto.randomUUID()
    const notification: Notification = { message, type, id }
    
    setNotifications(prev => [...prev, notification])
    
    // 3秒後に自動削除
    setTimeout(() => {
      removeNotification(id)
    }, 3000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <NotificationContext.Provider value={{ showNotification, notifications, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

