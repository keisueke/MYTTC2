import { ReactNode, useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen relative">
      {/* オーバーレイ */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in"
          onClick={closeMenu}
        />
      )}
      
      {/* ハンバーガーメニュー */}
      <Sidebar isOpen={isMenuOpen} onClose={closeMenu} />
      
      <div className="flex flex-col min-h-screen">
        <Header onMenuClick={toggleMenu} />
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
