import { useState, useMemo, useEffect } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTasks } from '../hooks/useTasks'
import { useGitHub } from '../hooks/useGitHub'
import { useNotification } from '../context/NotificationContext'
import { generateTodaySummary, copyToClipboard } from '../utils/export'
import { getDashboardLayout, saveDashboardLayout } from '../services/taskService'
import { DashboardLayoutConfig, DashboardWidgetId, ConflictResolution } from '../types'
import StatsCard from '../components/dashboard/StatsCard'
import CategoryTimeChart from '../components/dashboard/CategoryTimeChart'
import TimeAxisChart from '../components/dashboard/TimeAxisChart'
import WeatherCard from '../components/dashboard/WeatherCard'
import DailyRecordInput from '../components/dashboard/DailyRecordInput'
import HabitTracker from '../components/dashboard/HabitTracker'
import DailyReflection from '../components/dashboard/DailyReflection'
import DashboardWidget from '../components/dashboard/DashboardWidget'
import ConflictResolutionDialog from '../components/common/ConflictResolutionDialog'
import DatePickerModal from '../components/common/DatePickerModal'

export default function Dashboard() {
  const { tasks, projects, modes, tags, loading, refresh, dailyRecords } = useTasks()
  const { config: githubConfig, syncing, syncBidirectional, conflictInfo, resolveConflict } = useGitHub()
  const { showNotification } = useNotification()
  const [timePeriod, setTimePeriod] = useState<'week' | 'month'>('week')
  const [isEditMode, setIsEditMode] = useState(false)
  const [layout, setLayout] = useState<DashboardLayoutConfig>(() => getDashboardLayout())
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  const handleSync = async () => {
    try {
      const result = await syncBidirectional()
      refresh()
      
      switch (result) {
        case 'pulled':
          showNotification('リモートから最新データを取得しました', 'success')
          break
        case 'pushed':
          showNotification('リモートにデータを保存しました', 'success')
          break
        case 'up-to-date':
          showNotification('既に最新の状態です', 'info')
          break
        case 'conflict':
          // 競合ダイアログは自動的に表示される（conflictInfoが設定されるため）
          break
      }
    } catch (error) {
      showNotification(`同期に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, 'error')
    }
  }

  const handleResolveConflict = async (resolution: ConflictResolution) => {
    try {
      if (resolution === 'cancel') {
        return
      }
      
      const result = await resolveConflict(resolution)
      refresh()
      
      if (result === 'pushed') {
        showNotification('ローカルのデータで上書きしました', 'success')
      } else {
        showNotification('リモートのデータで上書きしました', 'success')
      }
    } catch (error) {
      showNotification(`競合の解決に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, 'error')
    }
  }

  const handleCopyTodaySummary = async (selectedDate?: Date) => {
    try {
      const summary = await generateTodaySummary(tasks, projects, modes, tags, selectedDate)
      const success = await copyToClipboard(summary)
      if (success) {
        const dateStr = selectedDate 
          ? new Date(selectedDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
          : '今日'
        showNotification(`${dateStr}のまとめをクリップボードにコピーしました`, 'success')
      } else {
        showNotification('クリップボードへのコピーに失敗しました', 'error')
      }
    } catch (error) {
      showNotification(`まとめの生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, 'error')
    }
  }

  const handleDatePickerConfirm = (date: Date) => {
    handleCopyTodaySummary(date)
  }

  // レイアウト設定を読み込む
  useEffect(() => {
    const loadedLayout = getDashboardLayout()
    setLayout(loadedLayout)
  }, [])

  // 編集モード終了時にレイアウトを保存
  useEffect(() => {
    if (!isEditMode && layout.widgets.length > 0) {
      saveDashboardLayout(layout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = active.id as DashboardWidgetId
    const overId = over.id as DashboardWidgetId

    const newWidgets = [...layout.widgets]
    const activeIndex = newWidgets.findIndex(w => w.id === activeId)
    const overIndex = newWidgets.findIndex(w => w.id === overId)

    if (activeIndex === -1 || overIndex === -1) return

    // ウィジェットを移動
    const [movedWidget] = newWidgets.splice(activeIndex, 1)
    newWidgets.splice(overIndex, 0, movedWidget)

    // orderを更新
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      order: index,
    }))

    const newLayout = { widgets: updatedWidgets }
    setLayout(newLayout)
    // 編集モード中でも即座に保存（リアルタイムで保存）
    if (isEditMode) {
      saveDashboardLayout(newLayout)
    }
  }

  const handleToggleVisible = (widgetId: DashboardWidgetId) => {
    const newLayout = {
      widgets: layout.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
      ),
    }
    setLayout(newLayout)
    // 編集モード中でも即座に保存（リアルタイムで保存）
    if (isEditMode) {
      saveDashboardLayout(newLayout)
    }
  }

  const getWidget = (id: DashboardWidgetId) => {
    return layout.widgets.find(w => w.id === id)
  }

  const sortedWidgets = layout.widgets
    .filter(w => w.visible || isEditMode)
    .sort((a, b) => a.order - b.order)

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

  const widgetIds = sortedWidgets.map(w => w.id)

  return (
    <>
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={widgetIds} strategy={verticalListSortingStrategy}>
        <div className={`space-y-8 ${isEditMode ? 'pl-8' : ''}`}>
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`btn-industrial flex items-center gap-2 ${isEditMode ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' : ''}`}
            title={isEditMode ? '編集モードを終了' : 'レイアウトを編集'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{isEditMode ? '編集終了' : 'レイアウト編集'}</span>
          </button>
          <button
            onClick={() => {
              console.log('Date picker button clicked')
              setShowDatePicker(true)
            }}
            className="btn-industrial flex items-center gap-2"
            title="まとめをクリップボードにコピー（日付選択可）"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>まとめをコピー</span>
          </button>
          {githubConfig && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-industrial flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
                  <span>同期中...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>github同期</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

          {sortedWidgets.map((widget) => {
            const widgetData = getWidget(widget.id)
            if (!widgetData) return null

            switch (widget.id) {
              case 'stats-grid':
                return (
                  <DashboardWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    visible={widgetData.visible}
                    onToggleVisible={() => handleToggleVisible(widget.id)}
                  >
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
                  </DashboardWidget>
                )

              case 'weather-card':
                return (
                  <DashboardWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    visible={widgetData.visible}
                    onToggleVisible={() => handleToggleVisible(widget.id)}
                  >
                    <WeatherCard />
                  </DashboardWidget>
                )

              case 'habit-tracker':
                return (
                  <DashboardWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    visible={widgetData.visible}
                    onToggleVisible={() => handleToggleVisible(widget.id)}
                  >
                    <HabitTracker tasks={tasks} />
                  </DashboardWidget>
                )

              case 'daily-record-input':
                return (
                  <DashboardWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    visible={widgetData.visible}
                    onToggleVisible={() => handleToggleVisible(widget.id)}
                  >
                    <DailyRecordInput />
                  </DashboardWidget>
                )

              case 'daily-reflection':
                return (
                  <DashboardWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    visible={widgetData.visible}
                    onToggleVisible={() => handleToggleVisible(widget.id)}
                  >
                    <DailyReflection tasks={tasks} dailyRecords={dailyRecords} />
                  </DashboardWidget>
                )

              case 'time-summary':
                if (stats.totalEstimatedTime === 0) return null
                return (
                  <DashboardWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    visible={widgetData.visible}
                    onToggleVisible={() => handleToggleVisible(widget.id)}
                  >
                    <div className="card-industrial p-6">
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
                  </DashboardWidget>
                )

              case 'time-axis-chart':
                return (
                  <DashboardWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    visible={widgetData.visible}
                    onToggleVisible={() => handleToggleVisible(widget.id)}
                  >
                    <div className="card-industrial p-6">
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
                  </DashboardWidget>
                )

              case 'category-time-chart':
                return (
                  <DashboardWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    visible={widgetData.visible}
                    onToggleVisible={() => handleToggleVisible(widget.id)}
                  >
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
                  </DashboardWidget>
                )

              default:
                return null
            }
          })}
        </div>
      </SortableContext>
      
      {conflictInfo && (
        <ConflictResolutionDialog
          conflictInfo={conflictInfo}
          onResolve={handleResolveConflict}
          onCancel={() => handleResolveConflict('cancel')}
        />
      )}
    </DndContext>

    <DatePickerModal
      isOpen={showDatePicker}
      onClose={() => setShowDatePicker(false)}
      onConfirm={handleDatePickerConfirm}
      title="まとめの日付を選択"
    />
    </>
  )
}
