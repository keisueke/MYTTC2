import { Link, useLocation } from 'react-router-dom'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  // ナビゲーションクリック時にメニューを閉じる
  const handleNavClick = () => {
    onClose()
  }

  const navItems = [
    { path: '/', label: 'ホーム', icon: '🏠' },
    { path: '/tasks', label: 'タスク', icon: '📋' },
    { path: '/repeat-tasks', label: 'ルーティン', icon: '🔁' },
    { path: '/wish-list', label: 'Wishリスト', icon: '⭐' },
    { path: '/settings', label: '設定', icon: '⚙️' },
  ]

  return (
    <>
      {/* ハンバーガーメニュー */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            MYTTC2
          </h1>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="メニューを閉じる"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <nav className="mt-4 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                location.pathname === item.path
                  ? 'bg-blue-50 dark:bg-blue-900 border-r-2 border-blue-500'
                  : ''
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}

