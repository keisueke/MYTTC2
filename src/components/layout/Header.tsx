import { useNavigate, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useNotification } from '../../context/NotificationContext'
import { useSelectedDate } from '../../context/SelectedDateContext'
import Toast from '../common/Toast'

interface HeaderProps {
  onMenuClick: () => void
  sidebarAlwaysVisible?: boolean
}

export default function Header({ onMenuClick, sidebarAlwaysVisible = false }: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { notifications, removeNotification } = useNotification()
  const { selectedDate, goToPrevDay, goToNextDay, goToToday, isToday } = useSelectedDate()

  const handleLogoClick = () => {
    navigate('/')
  }

  // baseパスを考慮した画像パス
  const logoPath = useMemo(() => {
    const pathname = window.location.pathname
    if (pathname.startsWith('/MYTTC2/')) {
      return '/MYTTC2/logo.png'
    }
    return '/logo.png'
  }, [])

  // 現在のページ名を取得
  const currentPage = useMemo(() => {
    const pathMap: Record<string, string> = {
      '/': 'DASHBOARD',
      '/tasks': 'TASKS',
      '/repeat-tasks': 'ROUTINE',
      '/wish-list': 'WISH LIST',
      '/goals': 'GOALS',
      '/settings': 'SETTINGS',
    }
    return pathMap[location.pathname] || 'MYTTC2'
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-bg-primary)]/95 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {!sidebarAlwaysVisible && (
            <button
              onClick={onMenuClick}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors duration-200 group"
              aria-label="メニューを開く"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className="w-full h-0.5 bg-current transition-all group-hover:w-4"></span>
                <span className="w-4 h-0.5 bg-current transition-all group-hover:w-full"></span>
                <span className="w-full h-0.5 bg-current transition-all group-hover:w-3"></span>
              </div>
            </button>
          )}
          
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer group"
            aria-label="ホームに戻る"
          >
            <img
              src={logoPath}
              alt="MyTCC"
              className="h-8 w-auto"
            />
            <div className="hidden sm:block">
              <span className="font-display text-xs tracking-[0.3em] text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)] transition-colors">
                {currentPage}
              </span>
            </div>
          </button>
        </div>

        {/* Center Section - Notifications */}
        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          {notifications.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap justify-center">
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
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Date Navigation */}
          <div className="hidden md:flex items-center gap-1">
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
              className={`font-display text-sm tracking-wider px-2 py-1 transition-colors ${
                isToday 
                  ? 'text-[var(--color-text-secondary)]' 
                  : 'text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10'
              }`}
              title={isToday ? '今日' : '今日に戻る'}
            >
              {format(selectedDate, 'yyyy/MM/dd(E)', { locale: ja })}
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
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] animate-pulse"></span>
            <span className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)]">
              Active
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
