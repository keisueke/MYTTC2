import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { NotificationProvider } from './context/NotificationContext'
import { useReminders } from './hooks/useReminders'
import Layout from './components/layout/Layout'
import InstallPrompt from './components/common/InstallPrompt'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import RepeatTasks from './pages/RepeatTasks'
import WishListPage from './pages/WishList'
import Goals from './pages/Goals'
import GoalDetail from './pages/GoalDetail'
import Analyze from './pages/Analyze'
import Memo from './pages/Memo'
import Settings from './pages/Settings'
import RoutineCheckerPage from './pages/RoutineChecker'
import DailyRecordView from './pages/DailyRecordView'

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

function AppContent() {
  // リマインダーを有効化
  useReminders()

  return (
    <BrowserRouter basename={getBasename()}>
      <Layout>
        <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/repeat-tasks" element={<RepeatTasks />} />
        <Route path="/routine-checker" element={<RoutineCheckerPage />} />
        <Route path="/wish-list" element={<WishListPage />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/goals/:category" element={<GoalDetail />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/memo" element={<Memo />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/daily-records" element={<DailyRecordView />} />
        {/* 未定義のパスはHomeにリダイレクト */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
      <InstallPrompt />
    </NotificationProvider>
  )
}

export default App

