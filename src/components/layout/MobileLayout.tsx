import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useSelectedDate } from '../../context/SelectedDateContext'
import { useNotification } from '../../context/NotificationContext'
import BottomNavigation from './BottomNavigation'
import Toast from '../common/Toast'

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const location = useLocation()
  const { selectedDate, goToPrevDay, goToNextDay, goToToday, isToday } = useSelectedDate()
  const { notifications, removeNotification } = useNotification()

  // 現在のページ名を取得
  const currentPage = (() => {
    const pathMap: Record<string, string> = {
      '/': 'ダッシュボード',
      '/tasks': 'タスク',
      '/repeat-tasks': 'ルーティン',
      '/analyze': '分析',
      '/settings': '設定',
    }
    return pathMap[location.pathname] || 'MYTTC2'
  })()

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* 簡略化されたヘッダー */}
      <header className="sticky top-0 z-30 bg-[var(--color-bg-primary)]/95 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          {/* ページ名 */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-semibold tracking-tight text-[var(--color-text-primary)] truncate">
              {currentPage}
            </h1>
          </div>

          {/* 日付ナビゲーション */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={goToPrevDay}
              className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors"
              aria-label="前日"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className={`font-display text-xs tracking-wider px-2 py-1 transition-colors min-w-[80px] ${
                isToday 
                  ? 'text-[var(--color-text-secondary)]' 
                  : 'text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10'
              }`}
              title={isToday ? '今日' : '今日に戻る'}
            >
              {format(selectedDate, 'MM/dd(E)', { locale: ja })}
            </button>
            <button
              onClick={goToNextDay}
              className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors"
              aria-label="翌日"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 通知エリア */}
        {notifications.length > 0 && (
          <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
            {notifications.map(notification => (
              <Toast
                key={notification.id}
                message={notification.message}
                type={notification.type}
                onClose={() => removeNotification(notification.id)}
                duration={3000}
              />
            ))}
          </div>
        )}
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 p-4">
        <div className="max-w-full mx-auto animate-fade-in-up">
          {children}
        </div>
      </main>

      {/* ボトムナビゲーション */}
      <BottomNavigation />
    </div>
  )
}

