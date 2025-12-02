import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import StatsCard from '../components/dashboard/StatsCard'
import RecentTasks from '../components/dashboard/RecentTasks'
import CategoryTimeChart from '../components/dashboard/CategoryTimeChart'

export default function Dashboard() {
  const { tasks, projects, modes, tags, loading } = useTasks()
  const [timePeriod, setTimePeriod] = useState<'week' | 'month'>('week')

  const stats = useMemo(() => {
    const totalTasks = tasks.length
    
    // 今日の日付を取得（時刻を0時0分0秒にリセット）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)
    
    // 今日作成されたタスクをフィルタリング
    const todayTasks = tasks.filter(task => {
      const createdAt = new Date(task.createdAt)
      return createdAt >= today && createdAt <= todayEnd
    })
    
    // 今日の合計予定時間（分）
    const totalEstimatedTime = todayTasks.reduce((sum, task) => {
      return sum + (task.estimatedTime || 0)
    }, 0)
    
    // 今日の合計実績時間（秒→分に変換）
    const totalElapsedTime = todayTasks.reduce((sum, task) => {
      return sum + (task.elapsedTime || 0)
    }, 0)
    const totalElapsedTimeMinutes = Math.floor(totalElapsedTime / 60)

    return {
      total: totalTasks,
      todayTasks: todayTasks.length,
      totalEstimatedTime,
      totalElapsedTimeMinutes,
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
          title="今日のタスク"
          value={stats.todayTasks}
          icon="📅"
          color="green"
        />
        <StatsCard
          title="今日の予定時間"
          value={`${stats.totalEstimatedTime}分`}
          icon="⏰"
          color="purple"
        />
        <StatsCard
          title="今日の実績時間"
          value={`${stats.totalElapsedTimeMinutes}分`}
          icon="⏱️"
          color="orange"
        />
      </div>

      {/* 時間比較サマリー */}
      {stats.totalEstimatedTime > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            今日の時間サマリー
          </h2>
          <div className="space-y-4">
            {/* プログレスバー */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  進捗率
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stats.totalEstimatedTime > 0 
                    ? Math.round((stats.totalElapsedTimeMinutes / stats.totalEstimatedTime) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    stats.totalElapsedTimeMinutes > stats.totalEstimatedTime
                      ? 'bg-red-500'
                      : stats.totalElapsedTimeMinutes > stats.totalEstimatedTime * 0.8
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      stats.totalEstimatedTime > 0
                        ? (stats.totalElapsedTimeMinutes / stats.totalEstimatedTime) * 100
                        : 0,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
            
            {/* 詳細情報 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">予定時間</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalEstimatedTime}分
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">実績時間</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalElapsedTimeMinutes}分
                </p>
              </div>
            </div>
            
            {/* 残り時間/超過時間 */}
            {stats.totalElapsedTimeMinutes < stats.totalEstimatedTime ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-1">
                  残り時間
                </p>
                <p className="text-xl font-bold text-blue-900 dark:text-blue-200">
                  {stats.totalEstimatedTime - stats.totalElapsedTimeMinutes}分
                </p>
              </div>
            ) : stats.totalElapsedTimeMinutes > stats.totalEstimatedTime ? (
              <div className="p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300 mb-1">
                  超過時間
                </p>
                <p className="text-xl font-bold text-red-900 dark:text-red-200">
                  {stats.totalElapsedTimeMinutes - stats.totalEstimatedTime}分
                </p>
              </div>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300 mb-1">
                  予定通り完了
                </p>
                <p className="text-xl font-bold text-green-900 dark:text-green-200">
                  予定時間と実績時間が一致しています
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
        <CategoryTimeChart tasks={tasks} projects={projects} modes={modes} tags={tags} period={timePeriod} />
      </div>

      {/* 最近のタスク */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          最近のタスク
        </h2>
        <RecentTasks tasks={tasks} />
      </div>
    </div>
  )
}

