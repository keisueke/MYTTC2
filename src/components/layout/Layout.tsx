import { ReactNode, useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { getSidebarVisibility, getSidebarWidth } from '../../services/taskService'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [sidebarAlwaysVisible, setSidebarAlwaysVisible] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(getSidebarWidth())

  useEffect(() => {
    const alwaysVisible = getSidebarVisibility()
    setSidebarAlwaysVisible(alwaysVisible)
    setSidebarWidth(getSidebarWidth())
    // 常時表示の設定に基づいてサイドバーの開閉状態を設定
    setIsMenuOpen(alwaysVisible)
    
    // データ変更イベントをリッスン
    const handleDataChange = () => {
      const alwaysVisible = getSidebarVisibility()
      setSidebarAlwaysVisible(alwaysVisible)
      setIsMenuOpen(alwaysVisible)
      setSidebarWidth(getSidebarWidth())
    }
    
    window.addEventListener('mytcc2:dataChanged', handleDataChange)
    return () => window.removeEventListener('mytcc2:dataChanged', handleDataChange)
  }, [])

  const toggleMenu = () => {
    if (!sidebarAlwaysVisible) {
      setIsMenuOpen(!isMenuOpen)
    }
  }

  const closeMenu = () => {
    if (!sidebarAlwaysVisible) {
      setIsMenuOpen(false)
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* オーバーレイ */}
      {isMenuOpen && !sidebarAlwaysVisible && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in"
          onClick={closeMenu}
        />
      )}
      
      {/* サイドバー */}
      <Sidebar isOpen={isMenuOpen} onClose={closeMenu} alwaysVisible={sidebarAlwaysVisible} />
      
      <div
        style={{ marginLeft: sidebarAlwaysVisible ? `${sidebarWidth}px` : '0' }}
        className="flex flex-col min-h-screen transition-all duration-500"
      >
        <Header onMenuClick={toggleMenu} sidebarAlwaysVisible={sidebarAlwaysVisible} />
        <main className="flex-1 p-6 lg:p-8 pt-4">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
          {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="border-t border-[var(--color-border)] py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              MYTTC2 — Task Management System
            </span>
            <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              v1.0.0
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
