import { Link, useLocation } from 'react-router-dom'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  const handleNavClick = () => {
    onClose()
  }

  const navItems = [
    { path: '/', label: 'ダッシュボード', code: '01', icon: '◈' },
    { path: '/tasks', label: 'タスク', code: '02', icon: '▣' },
    { path: '/repeat-tasks', label: 'ルーティン', code: '03', icon: '◎' },
    { path: '/wish-list', label: 'Wishリスト', code: '04', icon: '☆' },
    { path: '/goals', label: '年間目標', code: '05', icon: '◇' },
    { path: '/memo', label: 'メモ帳', code: '06', icon: '◉' },
    { path: '/settings', label: '設定', code: '07', icon: '⚙' },
  ]

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-80 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] flex flex-col z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl tracking-tight text-[var(--color-accent)]">
              MyTTC
            </h1>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)] mt-1">
              Task Management
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)] transition-all duration-200"
            aria-label="メニューを閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto">
        <div className="px-4">
          <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-muted)] px-2">
            Navigation
          </span>
        </div>
        <div className="mt-4 space-y-1 px-4">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`group flex items-center gap-4 px-4 py-3 transition-all duration-300 animate-slide-in-left ${
                  isActive
                    ? 'bg-[var(--color-accent)]/10 border-l-2 border-[var(--color-accent)]'
                    : 'hover:bg-[var(--color-bg-tertiary)] border-l-2 border-transparent hover:border-[var(--color-border-light)]'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className={`font-display text-[10px] tracking-wider ${
                  isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                }`}>
                  {item.code}
                </span>
                <span className={`text-lg ${
                  isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]'
                }`}>
                  {item.icon}
                </span>
                <span className={`font-medium text-sm ${
                  isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--color-accent)]/20 flex items-center justify-center">
            <span className="font-display text-xs text-[var(--color-accent)]">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-xs text-[var(--color-text-primary)] truncate">User</p>
            <p className="font-display text-[10px] text-[var(--color-text-tertiary)]">Local Storage</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
