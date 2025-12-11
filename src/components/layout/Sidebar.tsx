import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { loadGitHubConfig } from '../../hooks/useGitHub'
import { loadCloudflareConfig } from '../../services/cloudflareApi'
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
    { path: '/routine-checker', label: 'ルーティンチェッカー', code: '04', icon: '✓' },
    { path: '/wish-list', label: 'Wishリスト', code: '05', icon: '☆' },
    { path: '/goals', label: '年間目標', code: '06', icon: '◇' },
    { path: '/analyze', label: '分析', code: '07', icon: '◆' },
    { path: '/memo', label: 'メモ帳', code: '08', icon: '◉' },
    { path: '/settings', label: '設定', code: '09', icon: '⚙' },
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
          const cloudflareConfig = loadCloudflareConfig()
          
          // GitHub同期が設定されている場合
          if (githubConfig) {
            return (
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
            )
          }
          
          // Cloudflare同期が設定されている場合
          if (cloudflareConfig) {
            // APIのURLからホスト名を抽出
            let displayName = 'Cloudflare'
            try {
              const url = new URL(cloudflareConfig.apiUrl)
              displayName = url.hostname
            } catch {
              displayName = cloudflareConfig.apiUrl
            }
            
            return (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#F6821F]/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#F6821F]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.2678-.2246-.2812-.5762-.4346-.9873-.4599l-8.7008-.1123a.1629.1629 0 0 1-.1382-.0908.1509.1509 0 0 1 .0156-.1692c.0537-.0752.1396-.1211.2326-.1234l8.7921-.1124c.9639-.0409 2.0065-.8637 2.3989-1.89l.4973-1.3003c.0322-.0842.0483-.1721.0469-.2605-.0007-.0053-.0007-.0106-.0007-.0159-.0007-.4815-.0456-.9559-.1345-1.4204-.6445-3.3716-3.6191-5.9266-7.0904-5.9266-3.9109 0-7.0904 3.1796-7.0904 7.0904 0 .2177.0103.4328.0298.6455-.0054.0088-.0102.0181-.0144.0277l-1.6055 4.1942c-.0483.1259-.0014.2664.1127.3374.0499.0312.1068.0469.1637.0469h10.6982c.1025 0 .1934-.0664.2246-.164z"/>
                    <path d="M19.5054 10.5152c-.0469 0-.0938.0029-.1406.0044-.0323.0007-.0618.0212-.0727.0513l-.3495 1.1192c-.1475.5068-.0908.9707.1553 1.2678.2246.2812.5762.4346.9873.4599l1.5127.0976c.0908.0059.1709.0513.2168.1235.0459.0727.0513.163.0156.2402-.0356.0772-.1074.1299-.1934.1416l-1.5889.1021c-.9668.0411-2.0094.8638-2.4018 1.8901l-.1309.3423c-.0269.0703.0205.1475.0952.1558.0381.0044.0762.0059.1143.0059h5.8232c.0879 0 .1665-.0557.1958-.1387.2988-.8506.4634-1.7627.4634-2.7158 0-1.5889-.4634-3.0685-1.2619-4.3131-.0381-.0596-.1045-.0952-.1758-.0952z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs text-[var(--color-text-primary)] truncate">
                    {displayName}
                  </p>
                  <p className="font-display text-[10px] text-[var(--color-text-tertiary)]">Cloudflare Sync</p>
                </div>
              </div>
            )
          }
          
          // どちらも設定されていない場合（ローカルストレージ）
          return (
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
