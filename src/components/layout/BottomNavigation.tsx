import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path: '/', icon: '◈', label: 'ダッシュボード' },
    { path: '/tasks', icon: '▣', label: 'タスク' },
    { path: '/repeat-tasks', icon: '◎', label: 'ルーティン' },
    { path: '/analyze', icon: '◆', label: '分析' },
    { path: '/settings', icon: '⚙', label: '設定' },
  ]

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-primary)]/95 backdrop-blur-md border-t border-[var(--color-border)] safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px] transition-all duration-200 ${
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
      </div>
    </nav>
  )
}

