import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import StatsCard from '../components/dashboard/StatsCard'
import RecentTasks from '../components/dashboard/RecentTasks'
import CategoryTimeChart from '../components/dashboard/CategoryTimeChart'
import TimeAxisChart from '../components/dashboard/TimeAxisChart'
import WeatherCard from '../components/dashboard/WeatherCard'

export default function Dashboard() {
  const { tasks, projects, modes, tags, loading } = useTasks()
  const [timePeriod, setTimePeriod] = useState<'week' | 'month'>('week')

  const stats = useMemo(() => {
    const totalTasks = tasks.length
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)
    
    const todayTasks = tasks.filter(task => {
      const createdAt = new Date(task.createdAt)
      return createdAt >= today && createdAt <= todayEnd
    })
    
    const totalEstimatedTime = todayTasks.reduce((sum, task) => {
      return sum + (task.estimatedTime || 0)
    }, 0)
    
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-display text-xs tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  const progressPercent = stats.totalEstimatedTime > 0 
    ? Math.round((stats.totalElapsedTimeMinutes / stats.totalEstimatedTime) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-[var(--color-border)] pb-6">
        <div>
          <p className="font-display text-[10px] tracking-[0.3em] uppercase text-[var(--color-accent)] mb-2">
            Overview
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            ダッシュボード
          </h1>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-light text-[var(--color-text-primary)]">
            {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
          </p>
          <p className="font-display text-xs text-[var(--color-text-tertiary)]">
            {new Date().toLocaleDateString('ja-JP', { weekday: 'long' })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in-up stagger-1">
          <StatsCard
            title="Total Tasks"
            value={stats.total}
            icon="▣"
            color="blue"
          />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <StatsCard
            title="Today's Tasks"
            value={stats.todayTasks}
            icon="◈"
            color="green"
          />
        </div>
        <div className="animate-fade-in-up stagger-3">
          <StatsCard
            title="Estimated"
            value={`${stats.totalEstimatedTime}m`}
            icon="◇"
            color="purple"
          />
        </div>
        <div className="animate-fade-in-up stagger-4">
          <StatsCard
            title="Actual"
            value={`${stats.totalElapsedTimeMinutes}m`}
            icon="◎"
            color="orange"
          />
        </div>
      </div>

      {/* Weather Card */}
      <div className="animate-fade-in-up stagger-5">
        <WeatherCard />
      </div>

      {/* Time Summary */}
      {stats.totalEstimatedTime > 0 && (
        <div className="card-industrial p-6 animate-fade-in-up stagger-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-sm tracking-[0.1em] uppercase text-[var(--color-text-primary)]">
              Today's Progress
            </h2>
            <span className={`font-display text-2xl font-semibold ${
              progressPercent > 100 ? 'text-[var(--color-error)]' : 
              progressPercent > 80 ? 'text-[var(--color-warning)]' : 
              'text-[var(--color-secondary)]'
            }`}>
              {progressPercent}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="progress-industrial mb-6">
            <div 
              className="progress-industrial-bar"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          
          {/* Time Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                Estimated
              </p>
              <p className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                {stats.totalEstimatedTime}
                <span className="text-sm text-[var(--color-text-tertiary)] ml-1">min</span>
              </p>
            </div>
            <div className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                Actual
              </p>
              <p className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                {stats.totalElapsedTimeMinutes}
                <span className="text-sm text-[var(--color-text-tertiary)] ml-1">min</span>
              </p>
            </div>
            <div className={`p-4 border ${
              stats.totalElapsedTimeMinutes > stats.totalEstimatedTime
                ? 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30'
                : 'bg-[var(--color-secondary)]/10 border-[var(--color-secondary)]/30'
            }`}>
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                {stats.totalElapsedTimeMinutes > stats.totalEstimatedTime ? 'Over' : 'Remaining'}
              </p>
              <p className={`font-display text-xl font-semibold ${
                stats.totalElapsedTimeMinutes > stats.totalEstimatedTime
                  ? 'text-[var(--color-error)]'
                  : 'text-[var(--color-secondary)]'
              }`}>
                {Math.abs(stats.totalEstimatedTime - stats.totalElapsedTimeMinutes)}
                <span className="text-sm opacity-70 ml-1">min</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Time Axis Chart - 今日の時間軸 */}
      <div className="card-industrial p-6 animate-fade-in-up stagger-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Timeline
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              時間軸分析
            </h2>
          </div>
        </div>
        <TimeAxisChart
          tasks={tasks}
          projects={projects}
          modes={modes}
          tags={tags}
          date={new Date()}
        />
      </div>

      {/* Charts Section */}
      <div className="card-industrial p-6 animate-fade-in-up stagger-7">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Category Analysis
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              カテゴリー別分析
            </h2>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setTimePeriod('week')}
              className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${
                timePeriod === 'week'
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimePeriod('month')}
              className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${
                timePeriod === 'month'
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Month
            </button>
          </div>
        </div>
        <CategoryTimeChart tasks={tasks} projects={projects} modes={modes} tags={tags} period={timePeriod} />
      </div>

      {/* Recent Tasks */}
      <div className="card-industrial p-6 animate-fade-in-up stagger-8">
        <h2 className="font-display text-sm tracking-[0.1em] uppercase text-[var(--color-text-primary)] mb-6">
          Recent Tasks
        </h2>
        <RecentTasks tasks={tasks} />
      </div>
    </div>
  )
}
