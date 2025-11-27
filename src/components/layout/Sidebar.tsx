import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Category } from '../../types'
import { getCategories } from '../../services/taskService'

export default function Sidebar() {
  const location = useLocation()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    // カテゴリ一覧を読み込む
    setCategories(getCategories())
    
    // LocalStorageの変更を監視（簡易的な実装）
    const handleStorageChange = () => {
      setCategories(getCategories())
    }
    
    // カスタムイベントで更新を通知（taskServiceから発火）
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('mytcc2:dataChanged', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('mytcc2:dataChanged', handleStorageChange)
    }
  }, [])

  const navItems = [
    { path: '/', label: 'ホーム', icon: '🏠' },
    { path: '/tasks', label: 'タスク', icon: '📋' },
    { path: '/settings', label: '設定', icon: '⚙️' },
  ]

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          MYTTC2
        </h1>
      </div>
      <nav className="mt-4 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
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
      
      {/* カテゴリ一覧 */}
      {categories.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            カテゴリ
          </h2>
          <div className="space-y-1">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 px-2 py-1 text-sm text-gray-600 dark:text-gray-400"
              >
                {category.color && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                )}
                <span className="truncate">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

