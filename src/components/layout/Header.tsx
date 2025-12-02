import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate()

  const handleLogoClick = () => {
    navigate('/')
  }

  // baseパスを考慮した画像パス（一度だけ計算）
  const logoPath = useMemo(() => {
    // Viteのpublicフォルダ内のファイルは常にルートパスでアクセス可能
    // ただし、baseパスが設定されている場合はそれも考慮
    const pathname = window.location.pathname
    // /MYTTC2/で始まる場合はbaseパスを考慮
    if (pathname.startsWith('/MYTTC2/')) {
      return '/MYTTC2/logo.png'
    }
    return '/logo.png'
  }, [])

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="メニューを開く"
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <button
          onClick={handleLogoClick}
          className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
          aria-label="ホームに戻る"
        >
          <img
            src={logoPath}
            alt="MyTCC"
            className="h-8 w-auto"
          />
        </button>
      </div>
    </header>
  )
}

