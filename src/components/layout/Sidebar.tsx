import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { loadGitHubConfig } from '../../hooks/useGitHub'
import { getSidebarWidth, saveSidebarWidth, getSidebarVisibility, saveSidebarVisibility } from '../../services/taskService'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  alwaysVisible?: boolean
}

export default function Sidebar({ isOpen, onClose, alwaysVisible = false }: SidebarProps) {
  const location = useLocation()
  const [isResizing, setIsResizing] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(getSidebarWidth())
  const [sidebarAlwaysVisible, setSidebarAlwaysVisible] = useState(getSidebarVisibility())

  useEffect(() => {
    setSidebarWidth(getSidebarWidth())
    setSidebarAlwaysVisible(getSidebarVisibility())
    
    // データ変更イベントをリッスン
    const handleDataChange = () => {
      setSidebarWidth(getSidebarWidth())
      setSidebarAlwaysVisible(getSidebarVisibility())
    }
    
    window.addEventListener('mytcc2:dataChanged', handleDataChange)
    return () => window.removeEventListener('mytcc2:dataChanged', handleDataChange)
  }, [])

  const handleNavClick = () => {
    if (!alwaysVisible) {
      onClose()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = Math.min(Math.max(200, e.clientX), 600)
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      if (isResizing) {
        saveSidebarWidth(sidebarWidth)
        window.dispatchEvent(new Event('mytcc2:dataChanged'))
      }
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    } else {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing, sidebarWidth])

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
      style={{ width: `${sidebarWidth}px` }}
      className={`fixed left-0 top-0 h-full bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] flex flex-col z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? 'translate-x-0' : alwaysVisible ? 'translate-x-0' : '-translate-x-full'
      } ${isResizing ? 'transition-none' : ''}`}
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
          {!alwaysVisible && (
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)] transition-all duration-200"
              aria-label="メニューを閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto">
        <div className="px-4 flex items-center justify-between mb-4">
          <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-muted)] px-2">
            Navigation
          </span>
          <button
            onClick={() => {
              const newValue = !sidebarAlwaysVisible
              setSidebarAlwaysVisible(newValue)
              saveSidebarVisibility(newValue)
              window.dispatchEvent(new Event('mytcc2:dataChanged'))
            }}
            className={`p-2 transition-all duration-200 ${
              sidebarAlwaysVisible
                ? 'text-[var(--color-accent)] hover:text-[var(--color-accent)]/80'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
            aria-label={sidebarAlwaysVisible ? 'ピンどめを解除' : 'ピンどめ'}
            title={sidebarAlwaysVisible ? 'ピンどめを解除' : 'ピンどめ'}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={sidebarAlwaysVisible ? 2 : 1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>
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
        {(() => {
          const githubConfig = loadGitHubConfig()
          return githubConfig ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[var(--color-accent)]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--color-accent)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-xs text-[var(--color-text-primary)] truncate">
                  {githubConfig.owner}/{githubConfig.repo}
                </p>
                <p className="font-display text-[10px] text-[var(--color-text-tertiary)]">GitHub Sync</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[var(--color-accent)]/20 flex items-center justify-center">
                <span className="font-display text-xs text-[var(--color-accent)]">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-xs text-[var(--color-text-primary)] truncate">User</p>
                <p className="font-display text-[10px] text-[var(--color-text-tertiary)]">Local Storage</p>
              </div>
            </div>
          )
        })()}
      </div>

      {/* リサイズハンドル */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:w-2 hover:bg-[var(--color-accent)]/30 transition-all duration-200 ${
          isResizing ? 'w-2 bg-[var(--color-accent)]/50' : ''
        }`}
        style={{ zIndex: 60 }}
      />
    </aside>
  )
}
