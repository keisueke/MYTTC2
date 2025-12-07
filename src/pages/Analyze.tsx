import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import CategoryTimeChart from '../components/dashboard/CategoryTimeChart'
import TimeAxisChart from '../components/dashboard/TimeAxisChart'
import DailyReflection from '../components/dashboard/DailyReflection'

type TimePeriod = 'week' | 'month' | '3months'
type AnalysisTab = 'overview' | 'category' | 'timeline' | 'trends' | 'reflection'

export default function Analyze() {
  const { tasks, projects, modes, tags, dailyRecords, loading } = useTasks()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week')
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const stats = useMemo(() => {
    const now = new Date()
    const periodDays = timePeriod === 'week' ? 7 : timePeriod === 'month' ? 30 : 90
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - periodDays)

    const periodTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt)
      return taskDate >= startDate && taskDate <= now
    })

    const completedTasks = periodTasks.filter(task => task.completedAt)
    const totalEstimatedTime = periodTasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0)
    const totalElapsedTime = periodTasks.reduce((sum, task) => sum + (task.elapsedTime || 0), 0)
    const completionRate = periodTasks.length > 0 
      ? Math.round((completedTasks.length / periodTasks.length) * 100)
      : 0

    // 日別のタスク数を計算
    const dailyTaskCounts: { date: string; count: number; completed: number }[] = []
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0]
        return taskDate === dateStr
      })
      
      dailyTaskCounts.push({
        date: dateStr,
        count: dayTasks.length,
        completed: dayTasks.filter(t => t.completedAt).length,
      })
    }

    // モード別タスク数
    const modeStats = modes.map(mode => ({
      mode,
      count: periodTasks.filter(t => t.modeId === mode.id).length,
      time: periodTasks
        .filter(t => t.modeId === mode.id)
        .reduce((sum, t) => sum + (t.elapsedTime || 0), 0),
    })).filter(m => m.count > 0)

    // プロジェクト別タスク数
    const projectStats = projects.map(project => ({
      project,
      count: periodTasks.filter(t => t.projectId === project.id).length,
      time: periodTasks
        .filter(t => t.projectId === project.id)
        .reduce((sum, t) => sum + (t.elapsedTime || 0), 0),
    })).filter(p => p.count > 0)

    return {
      totalTasks: periodTasks.length,
      completedTasks: completedTasks.length,
      completionRate,
      totalEstimatedTime,
      totalElapsedTime: Math.floor(totalElapsedTime / 60),
      dailyTaskCounts,
      modeStats,
      projectStats,
      averageTasksPerDay: Math.round((periodTasks.length / periodDays) * 10) / 10,
    }
  }, [tasks, projects, modes, timePeriod])

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

  const tabs: { id: AnalysisTab; label: string; icon: string }[] = [
    { id: 'overview', label: '概要', icon: '◈' },
    { id: 'category', label: 'カテゴリー', icon: '◇' },
    { id: 'timeline', label: 'タイムライン', icon: '◎' },
    { id: 'trends', label: 'トレンド', icon: '▣' },
    { id: 'reflection', label: '振り返り', icon: '💭' },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-[var(--color-border)] pb-6">
        <div>
          <p className="font-display text-[10px] tracking-[0.3em] uppercase text-[var(--color-accent)] mb-2">
            Analytics
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            分析
          </h1>
        </div>
        <div className="flex gap-1">
          {(['week', 'month', '3months'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${
                timePeriod === period
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {period === 'week' ? '1週間' : period === 'month' ? '1ヶ月' : '3ヶ月'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-display text-sm transition-all duration-200 border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-industrial p-6">
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                総タスク数
              </p>
              <p className="font-display text-3xl font-semibold text-[var(--color-text-primary)]">
                {stats.totalTasks}
              </p>
              <p className="font-display text-xs text-[var(--color-text-tertiary)] mt-1">
                平均 {stats.averageTasksPerDay} タスク/日
              </p>
            </div>
            <div className="card-industrial p-6">
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                完了タスク
              </p>
              <p className="font-display text-3xl font-semibold text-[var(--color-secondary)]">
                {stats.completedTasks}
              </p>
              <p className="font-display text-xs text-[var(--color-text-tertiary)] mt-1">
                完了率 {stats.completionRate}%
              </p>
            </div>
            <div className="card-industrial p-6">
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                見積もり時間
              </p>
              <p className="font-display text-3xl font-semibold text-[var(--color-text-primary)]">
                {stats.totalEstimatedTime}
                <span className="text-lg text-[var(--color-text-tertiary)]">分</span>
              </p>
            </div>
            <div className="card-industrial p-6">
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                実際の作業時間
              </p>
              <p className="font-display text-3xl font-semibold text-[var(--color-accent)]">
                {stats.totalElapsedTime}
                <span className="text-lg text-[var(--color-text-tertiary)]">分</span>
              </p>
            </div>
          </div>

          {/* Completion Rate Bar */}
          <div className="card-industrial p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm tracking-[0.1em] uppercase text-[var(--color-text-primary)]">
                完了率
              </h3>
              <span className="font-display text-2xl font-semibold text-[var(--color-secondary)]">
                {stats.completionRate}%
              </span>
            </div>
            <div className="progress-industrial">
              <div 
                className="progress-industrial-bar"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>

          {/* Mode & Project Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mode Stats */}
            <div className="card-industrial p-6">
              <h3 className="font-display text-sm tracking-[0.1em] uppercase text-[var(--color-text-primary)] mb-4 pb-4 border-b border-[var(--color-border)]">
                モード別タスク
              </h3>
              {stats.modeStats.length > 0 ? (
                <div className="space-y-3">
                  {stats.modeStats.map(({ mode, count, time }) => (
                    <div key={mode.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: mode.color }}
                        />
                        <span className="text-sm text-[var(--color-text-primary)]">{mode.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-[var(--color-text-secondary)]">{count} タスク</span>
                        <span className="text-sm text-[var(--color-text-tertiary)]">{Math.floor(time / 60)}分</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-tertiary)]">データがありません</p>
              )}
            </div>

            {/* Project Stats */}
            <div className="card-industrial p-6">
              <h3 className="font-display text-sm tracking-[0.1em] uppercase text-[var(--color-text-primary)] mb-4 pb-4 border-b border-[var(--color-border)]">
                プロジェクト別タスク
              </h3>
              {stats.projectStats.length > 0 ? (
                <div className="space-y-3">
                  {stats.projectStats.map(({ project, count, time }) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="text-sm text-[var(--color-text-primary)]">{project.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-[var(--color-text-secondary)]">{count} タスク</span>
                        <span className="text-sm text-[var(--color-text-tertiary)]">{Math.floor(time / 60)}分</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-tertiary)]">データがありません</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'category' && (
        <div className="card-industrial p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
            <div>
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
                Category Analysis
              </p>
              <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                カテゴリー別分析
              </h2>
            </div>
          </div>
          <CategoryTimeChart 
            tasks={tasks} 
            projects={projects} 
            modes={modes} 
            tags={tags} 
            period={timePeriod === '3months' ? 'month' : timePeriod} 
          />
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="card-industrial p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
              <div>
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
                  Daily Timeline
                </p>
                <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                  時間軸分析
                </h2>
              </div>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="input-industrial px-4 py-2"
              />
            </div>
            <TimeAxisChart
              tasks={tasks}
              projects={projects}
              modes={modes}
              tags={tags}
              date={selectedDate}
            />
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Daily Task Trend */}
          <div className="card-industrial p-6">
            <h3 className="font-display text-sm tracking-[0.1em] uppercase text-[var(--color-text-primary)] mb-6 pb-4 border-b border-[var(--color-border)]">
              日別タスク推移
            </h3>
            <div className="h-64 flex items-end gap-1">
              {stats.dailyTaskCounts.map((day) => {
                const maxCount = Math.max(...stats.dailyTaskCounts.map(d => d.count), 1)
                const height = (day.count / maxCount) * 100
                const completedHeight = (day.completed / maxCount) * 100
                const date = new Date(day.date)
                const isToday = day.date === new Date().toISOString().split('T')[0]
                
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="w-full flex flex-col items-center justify-end h-48 relative">
                      <div 
                        className="w-full bg-[var(--color-bg-tertiary)] absolute bottom-0 transition-all duration-300"
                        style={{ height: `${height}%` }}
                      />
                      <div 
                        className="w-full bg-[var(--color-secondary)] absolute bottom-0 transition-all duration-300"
                        style={{ height: `${completedHeight}%` }}
                      />
                    </div>
                    <span className={`text-[10px] ${isToday ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[var(--color-bg-tertiary)]" />
                <span className="text-xs text-[var(--color-text-tertiary)]">総タスク</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[var(--color-secondary)]" />
                <span className="text-xs text-[var(--color-text-tertiary)]">完了</span>
              </div>
            </div>
          </div>

          {/* Productivity Insights */}
          <div className="card-industrial p-6">
            <h3 className="font-display text-sm tracking-[0.1em] uppercase text-[var(--color-text-primary)] mb-4 pb-4 border-b border-[var(--color-border)]">
              生産性インサイト
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                  1日の平均タスク
                </p>
                <p className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
                  {stats.averageTasksPerDay}
                </p>
              </div>
              <div className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                  時間効率
                </p>
                <p className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
                  {stats.totalEstimatedTime > 0 
                    ? Math.round((stats.totalElapsedTime / stats.totalEstimatedTime) * 100)
                    : 0}%
                </p>
              </div>
              <div className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                  最も活発な日
                </p>
                <p className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
                  {stats.dailyTaskCounts.length > 0
                    ? (() => {
                        const maxDay = stats.dailyTaskCounts.reduce((max, day) => 
                          day.count > max.count ? day : max
                        , stats.dailyTaskCounts[0])
                        return new Date(maxDay.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
                      })()
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reflection' && (
        <div>
          <DailyReflection 
            tasks={tasks} 
            dailyRecords={dailyRecords} 
            projects={projects} 
            modes={modes} 
            tags={tags} 
          />
        </div>
      )}
    </div>
  )
}
