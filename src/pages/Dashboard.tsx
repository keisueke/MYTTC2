import { useState, useMemo, useEffect } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTasks } from '../hooks/useTasks'
import { useGitHub } from '../hooks/useGitHub'
import { useNotification } from '../context/NotificationContext'
import { useSelectedDate } from '../context/SelectedDateContext'
import { generateTodaySummary, copyToClipboard } from '../utils/export'
import { getDashboardLayout, saveDashboardLayout } from '../services/taskService'
import { DashboardLayoutConfig, DashboardWidgetId, ConflictResolution, Task } from '../types'
import WeatherCard from '../components/dashboard/WeatherCard'
import DailyRecordInput from '../components/dashboard/DailyRecordInput'
import HabitTracker from '../components/dashboard/HabitTracker'
import TimeAxisChart from '../components/dashboard/TimeAxisChart'
import DashboardWidget from '../components/dashboard/DashboardWidget'
import SummaryCard from '../components/dashboard/SummaryCard'
import { isTaskForToday } from '../utils/repeatUtils'
import ConflictResolutionDialog from '../components/common/ConflictResolutionDialog'
import DatePickerModal from '../components/common/DatePickerModal'
import IncompleteRoutineDialog from '../components/common/IncompleteRoutineDialog'
import TaskForm from '../components/tasks/TaskForm'
import { getIncompleteRoutinesFromYesterday } from '../services/taskService'

export default function Dashboard() {
  const { tasks, projects, modes, tags, goals, loading, refresh, dailyRecords, addTask, routineExecutions, addRoutineExecution: addRoutineExecutionHook, updateRoutineExecution: updateRoutineExecutionHook, deleteTask: deleteTaskHook } = useTasks()
  const { config: githubConfig, syncing, syncBidirectional, conflictInfo, resolveConflict } = useGitHub()
  const { showNotification } = useNotification()
  const { selectedDate, isToday } = useSelectedDate()
  const [isEditMode, setIsEditMode] = useState(false)
  const [layout, setLayout] = useState<DashboardLayoutConfig>(() => getDashboardLayout())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [incompleteRoutines, setIncompleteRoutines] = useState<Task[]>([])
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false)
  
  // 未完了ルーティンの検出
  useEffect(() => {
    const routines = getIncompleteRoutinesFromYesterday()
    if (routines.length > 0) {
      setIncompleteRoutines(routines)
      setShowIncompleteDialog(true)
    }
  }, [tasks, routineExecutions])
  
  // ローカル日付文字列を取得
  const toLocalDateStr = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // ローカルISO文字列を取得
  const toLocalISOStr = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const ms = String(date.getMilliseconds()).padStart(3, '0')
    const tzOffset = -date.getTimezoneOffset()
    const tzSign = tzOffset >= 0 ? '+' : '-'
    const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0')
    const tzMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${tzSign}${tzHours}:${tzMinutes}`
  }
  
  const handleContinueRoutine = (taskId: string) => {
    // 今日のルーティン実行記録を作成
    const today = toLocalDateStr(new Date())
    addRoutineExecutionHook({
      routineTaskId: taskId,
      date: today,
    })
    // リストから削除
    setIncompleteRoutines(prev => prev.filter(t => t.id !== taskId))
    if (incompleteRoutines.length === 1) {
      setShowIncompleteDialog(false)
    }
    showNotification('今日も実行するように設定しました', 'success')
  }
  
  const handleSkipRoutine = (taskId: string) => {
    // 昨日の実行記録にskippedAtを設定
    const yesterday = new Date()
    if (yesterday.getHours() < 5) {
      yesterday.setDate(yesterday.getDate() - 1)
    }
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayStr = toLocalDateStr(yesterday)
    
    const execution = routineExecutions.find(e => 
      e.routineTaskId === taskId && e.date.startsWith(yesterdayStr)
    )
    if (execution) {
      updateRoutineExecutionHook(execution.id, { skippedAt: toLocalISOStr(new Date()) })
    }
    // リストから削除
    setIncompleteRoutines(prev => prev.filter(t => t.id !== taskId))
    if (incompleteRoutines.length === 1) {
      setShowIncompleteDialog(false)
    }
    showNotification('今日はスキップしました', 'info')
  }
  
  const handleEditRoutine = (_taskId: string) => {
    // タスク編集ページに遷移（またはモーダルを表示）
    setShowIncompleteDialog(false)
    // ここでは一旦ダイアログを閉じるだけ。実際の編集は別途実装
    showNotification('ルーティンを編集してください', 'info')
  }
  
  const handleDeleteRoutine = (taskId: string) => {
    if (confirm('このルーティンを削除しますか？')) {
      deleteTaskHook(taskId)
      setIncompleteRoutines(prev => prev.filter(t => t.id !== taskId))
      if (incompleteRoutines.length === 1) {
        setShowIncompleteDialog(false)
      }
      showNotification('ルーティンを削除しました', 'success')
    }
  }
  
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

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    // 選択日付をベースにタスクを作成（今日以外の日付が選択されている場合）
    addTask(taskData, isToday ? undefined : selectedDate)
    setShowTaskForm(false)
    showNotification('タスクを追加しました', 'success')
  }

  const handleCancelTaskForm = () => {
    setShowTaskForm(false)
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
    
    const todayTasks = tasks.filter(task => isTaskForToday(task))
    const completedTodayTasks = todayTasks.filter(task => task.completedAt)
    const completionRate = todayTasks.length > 0 
      ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
      : 0
    
    const totalEstimatedTime = todayTasks.reduce((sum, task) => {
      return sum + (task.estimatedTime || 0)
    }, 0)
    
    const totalElapsedTime = todayTasks.reduce((sum, task) => {
      return sum + (task.elapsedTime || 0)
    }, 0)
    const totalElapsedTimeMinutes = Math.floor(totalElapsedTime / 60)

    // ルーティンタスクの統計
    const routineTasks = tasks.filter(task => task.repeatPattern !== 'none')
    const todayStr = toLocalDateStr(new Date())
    const todayRoutineExecutions = routineExecutions.filter(e => {
      return e.date.startsWith(todayStr)
    })
    const completedRoutines = todayRoutineExecutions.filter(e => e.completedAt)
    const routineCompletionRate = todayRoutineExecutions.length > 0
      ? Math.round((completedRoutines.length / todayRoutineExecutions.length) * 100)
      : 0

    // 今日の記録の有無
    const todayRecord = dailyRecords.find(r => r.date === todayStr)
    const hasTodayRecord = !!todayRecord

    return {
      total: totalTasks,
      todayTasks: todayTasks.length,
      completedTodayTasks: completedTodayTasks.length,
      completionRate,
      totalEstimatedTime,
      totalElapsedTimeMinutes,
      routineTasks: routineTasks.length,
      routineCompletionRate,
      hasTodayRecord,
    }
  }, [tasks, routineExecutions, dailyRecords])

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
          {!showTaskForm && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="btn-industrial"
            >
              ＋新規タスク
            </button>
          )}
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

      {showTaskForm && (
        <div className="card-industrial p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
            <div>
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
                New Task
              </p>
              <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                新しいタスクを作成
              </h2>
            </div>
          </div>
          <TaskForm
            tasks={tasks}
            projects={projects}
            modes={modes}
            tags={tags}
            goals={goals}
            onSubmit={handleCreateTask}
            onCancel={handleCancelTaskForm}
          />
        </div>
      )}

          {sortedWidgets.map((widget) => {
            const widgetData = getWidget(widget.id)
            if (!widgetData) return null

            switch (widget.id) {
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
                    <HabitTracker tasks={tasks} routineExecutions={routineExecutions} />
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

              case 'tasks-summary':
                return (
                  <DashboardWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    visible={widgetData.visible}
                    onToggleVisible={() => handleToggleVisible(widget.id)}
                  >
                    <SummaryCard
                      title="タスク"
                      icon="▣"
                      value={stats.todayTasks}
                      subtitle={`完了率: ${stats.completionRate}%`}
                      linkTo="/tasks"
                      linkLabel="タスク一覧を見る"
                      color="green"
                    />
                  </DashboardWidget>
                )

              case 'routine-summary':
                return (
                  <DashboardWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    visible={widgetData.visible}
                    onToggleVisible={() => handleToggleVisible(widget.id)}
                  >
                    <SummaryCard
                      title="ルーティン"
                      icon="◎"
                      value={stats.routineCompletionRate}
                      subtitle={`${stats.routineTasks}件のルーティン`}
                      linkTo="/routine-checker"
                      linkLabel="ルーティンチェッカーを見る"
                      color="purple"
                    />
                  </DashboardWidget>
                )

              case 'analyze-summary':
                return (
                  <DashboardWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    visible={widgetData.visible}
                    onToggleVisible={() => handleToggleVisible(widget.id)}
                  >
                    <SummaryCard
                      title="分析"
                      icon="◆"
                      value="分析"
                      subtitle="タスク分析・振り返り"
                      linkTo="/analyze"
                      linkLabel="詳細分析"
                      color="blue"
                      additionalLinks={[
                        { to: '/analyze?tab=reflection', label: '振り返り' }
                      ]}
                    />
                  </DashboardWidget>
                )

              case 'daily-timeline':
                return (
                  <DashboardWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    visible={widgetData.visible}
                    onToggleVisible={() => handleToggleVisible(widget.id)}
                  >
                    <TimeAxisChart
                      tasks={tasks}
                      projects={projects}
                      modes={modes}
                      tags={tags}
                      date={selectedDate}
                    />
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
    
    {showIncompleteDialog && (
      <IncompleteRoutineDialog
        incompleteRoutines={incompleteRoutines}
        onContinue={handleContinueRoutine}
        onSkip={handleSkipRoutine}
        onDelete={handleDeleteRoutine}
        onEdit={handleEditRoutine}
        onClose={() => setShowIncompleteDialog(false)}
      />
    )}
    </>
  )
}
