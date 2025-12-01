import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import StatsCard from '../components/dashboard/StatsCard'
import RecentTasks from '../components/dashboard/RecentTasks'
import CategoryTimeChart from '../components/dashboard/CategoryTimeChart'

export default function Dashboard() {
  const { tasks, categories, loading } = useTasks()
  const [timePeriod, setTimePeriod] = useState<'week' | 'month'>('week')

  const stats = useMemo(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.completed).length
    const activeTasks = totalTasks - completedTasks
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdueTasks = tasks.filter(task => {
      if (task.completed || !task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today
    }).length

    return {
      total: totalTasks,
      completed: completedTasks,
      active: activeTasks,
      overdue: overdueTasks,
    }
  }, [tasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">ダッシュボード</h1>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="全タスク"
          value={stats.total}
          icon="📋"
          color="blue"
        />
        <StatsCard
          title="未完了"
          value={stats.active}
          icon="⏳"
          color="yellow"
        />
        <StatsCard
          title="完了"
          value={stats.completed}
          icon="✅"
          color="green"
        />
        <StatsCard
          title="期限切れ"
          value={stats.overdue}
          icon="⚠️"
          color="red"
        />
      </div>

      {/* 作業時間チャート */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            作業時間分析
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTimePeriod('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timePeriod === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              週間
            </button>
            <button
              onClick={() => setTimePeriod('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timePeriod === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              月間
            </button>
          </div>
        </div>
        <CategoryTimeChart tasks={tasks} categories={categories} period={timePeriod} />
      </div>

      {/* 最近のタスク */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          最近のタスク
        </h2>
        <RecentTasks tasks={tasks} categories={categories} />
      </div>
    </div>
  )
}

