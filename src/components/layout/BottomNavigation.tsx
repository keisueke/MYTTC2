import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // メインナビゲーション項目（4つ + その他）
  const mainNavItems = [
    { path: '/', icon: '◈', label: 'ホーム' },
    { path: '/tasks', icon: '▣', label: 'タスク' },
    { path: '/routine-checker', icon: '✓', label: 'チェッカー' },
    { path: '/analyze', icon: '◆', label: '分析' },
  ]

  // 「その他」メニュー内の項目
  const moreMenuItems = [
    { path: '/goals', icon: '🎯', label: '目標設定' },
    { path: '/memo', icon: '📝', label: 'メモ帳' },
    { path: '/wish-list', icon: '✨', label: 'Wishリスト' },
    { path: '/repeat-tasks', icon: '◎', label: 'ルーティン' },
    { path: '/daily-records', icon: '📊', label: '日次記録' },
    { path: '/settings', icon: '⚙', label: '設定' },
  ]

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const isMoreMenuActive = (): boolean => {
    return moreMenuItems.some(item => isActive(item.path))
  }

  const handleMoreMenuItemClick = (path: string) => {
    navigate(path)
    setShowMoreMenu(false)
  }

  return (
    <>
      {/* オーバーレイ（メニュー外クリックで閉じる） */}
      {showMoreMenu && (
        <div 
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setShowMoreMenu(false)}
        />
      )}

      {/* その他メニュー（ポップアップ） */}
      {showMoreMenu && (
        <div className="fixed bottom-20 right-2 z-50 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden min-w-[160px]">
          {moreMenuItems.map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => handleMoreMenuItemClick(item.path)}
                className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                  active
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-display text-sm">{item.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-primary)]/95 backdrop-blur-md border-t border-[var(--color-border)] safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setShowMoreMenu(false)
                }}
                className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px] transition-all duration-200 ${
                  active
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
                aria-label={item.label}
              >
                <span className={`text-xl transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span className={`font-display text-[10px] tracking-[0.05em] uppercase transition-all duration-200 ${
                  active ? 'font-semibold' : 'font-normal'
                }`}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[var(--color-accent)] rounded-full"></span>
                )}
              </button>
            )
          })}

          {/* その他ボタン */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px] transition-all duration-200 ${
              showMoreMenu || isMoreMenuActive()
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
            }`}
            aria-label="その他"
          >
            <span className={`text-xl transition-transform duration-200 ${showMoreMenu ? 'scale-110' : ''}`}>
              ≡
            </span>
            <span className={`font-display text-[10px] tracking-[0.05em] uppercase transition-all duration-200 ${
              showMoreMenu || isMoreMenuActive() ? 'font-semibold' : 'font-normal'
            }`}>
              その他
            </span>
            {isMoreMenuActive() && !showMoreMenu && (
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[var(--color-accent)] rounded-full"></span>
            )}
          </button>
        </div>
      </nav>
    </>
  )
}

