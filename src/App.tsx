import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import RepeatTasks from './pages/RepeatTasks'
import WishListPage from './pages/WishList'
import Goals from './pages/Goals'
import Memo from './pages/Memo'
import Settings from './pages/Settings'

// GitHub Pages用のbaseパス（本番環境では/MYTTC2/、開発環境では/）
// 開発環境ではwindow.location.pathnameで判定
const getBasename = () => {
  if (typeof window !== 'undefined') {
    // 開発環境（localhost）の場合は/、本番環境（GitHub Pages）の場合は/MYTTC2
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? '/'
      : '/MYTTC2'
  }
  return '/'
}

function App() {
  return (
    <BrowserRouter basename={getBasename()}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/repeat-tasks" element={<RepeatTasks />} />
          <Route path="/wish-list" element={<WishListPage />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/memo" element={<Memo />} />
          <Route path="/settings" element={<Settings />} />
          {/* 未定義のパスはHomeにリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App

