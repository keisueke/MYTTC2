import { useState, useMemo, useCallback } from 'react'
import { SubTask, RoutineExecution } from '../types'
import { useTasks } from '../hooks/useTasks'
import RoutineChecker from '../components/routines/RoutineChecker'
import SubTaskForm from '../components/routines/SubTaskForm'
import * as taskService from '../services/taskService'

type RoutineCheckerTab = 'checker' | 'settings' | 'history'

export default function RoutineCheckerPage() {
  const {
    tasks,
    loading,
    getSubTasks,
    addSubTask,
    updateSubTask,
    deleteSubTask,
    toggleSubTaskComplete,
    updateTask,
    deleteTask,
    routineExecutions,
  } = useTasks()
  
  const [editingSubTask, setEditingSubTask] = useState<SubTask | undefined>(undefined)
  const [editingParentTaskId, setEditingParentTaskId] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<RoutineCheckerTab>('checker')
  const [refreshKey, setRefreshKey] = useState(0) // 再レンダリング用

  // 繰り返しパターンが設定されているタスク（親タスク）をフィルタリング
  const allParentTasks = useMemo(() => {
    return tasks.filter(task => task.repeatPattern !== 'none' && !task.deletedAt)
  }, [tasks])

  // 表示するタスク（showInRoutineCheckerがfalseでないもの、かつ昨日スキップされていないもの）
  const visibleParentTasks = useMemo(() => {
    return allParentTasks.filter(task => {
      // showInRoutineCheckerがfalseの場合は非表示
      if (task.showInRoutineChecker === false) {
        return false
      }

      // 昨日の実行記録を取得
      const yesterdayExecution = taskService.getYesterdayRoutineExecution(task.id)
      
      // 昨日の実行記録がスキップされている場合、非表示
      if (yesterdayExecution?.skippedAt) {
        return false
      }

      return true
    })
  }, [allParentTasks, refreshKey])

  // スキップされたタスクと実行記録を取得（過去30日以内）
  const skippedExecutions = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = taskService.toLocalDateStr(thirtyDaysAgo)

    const result: { task: typeof allParentTasks[0], executions: RoutineExecution[] }[] = []

    for (const task of allParentTasks) {
      const taskExecutions = routineExecutions.filter(e => 
        e.routineTaskId === task.id && 
        e.skippedAt && 
        !e.deletedAt &&
        e.date >= thirtyDaysAgoStr
      )

      if (taskExecutions.length > 0) {
        result.push({ task, executions: taskExecutions })
      }
    }

    return result
  }, [allParentTasks, routineExecutions, refreshKey])

  // 表示/非表示を切り替える
  const handleToggleVisibility = (taskId: string, currentVisibility: boolean) => {
    updateTask(taskId, { showInRoutineChecker: !currentVisibility })
  }

  const handleToggleComplete = (subTaskId: string, completed: boolean) => {
    toggleSubTaskComplete(subTaskId, completed)
  }

  const handleAddSubTask = (subTask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    addSubTask(subTask)
    setEditingSubTask(undefined)
    setEditingParentTaskId(undefined)
  }

  const handleEditSubTask = (subTask: SubTask) => {
    setEditingSubTask(subTask)
    setEditingParentTaskId(subTask.taskId)
  }

  const handleUpdateSubTask = (subTask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSubTask) {
      updateSubTask(editingSubTask.id, subTask)
      setEditingSubTask(undefined)
      setEditingParentTaskId(undefined)
    }
  }

  const handleDeleteSubTask = (subTaskId: string) => {
    deleteSubTask(subTaskId)
  }

  const handleDeleteParentTask = (taskId: string) => {
    deleteTask(taskId)
  }

  const handleCancel = () => {
    setEditingSubTask(undefined)
    setEditingParentTaskId(undefined)
  }

  const handleNewSubTask = (parentTaskId: string) => {
    setEditingSubTask(undefined)
    setEditingParentTaskId(parentTaskId)
  }

  // スキップされたタスクを完了に変更
  const handleMarkAsCompleted = useCallback((taskId: string, date: string) => {
    if (confirm(`${date}のタスクを完了に変更しますか？`)) {
      const completedAt = `${date}T12:00:00`
      taskService.updateRoutineExecutionForDate(taskId, date, {
        completedAt,
        skippedAt: null
      })
      setRefreshKey(prev => prev + 1)
    }
  }, [])

  // スキップされたタスクをスキップ解除（再表示）
  const handleUndoSkip = useCallback((taskId: string, date: string) => {
    if (confirm(`${date}のスキップを取り消しますか？`)) {
      taskService.updateRoutineExecutionForDate(taskId, date, {
        skippedAt: null
      })
      setRefreshKey(prev => prev + 1)
    }
  }, [])

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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-[var(--color-border)] pb-6">
        <div>
          <p className="font-display text-[10px] tracking-[0.3em] uppercase text-[var(--color-accent)] mb-2">
            Routine Checker
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            ルーティンチェッカー
          </h1>
        </div>
      </div>

      {editingSubTask || editingParentTaskId ? (
        <SubTaskForm
          subTask={editingSubTask}
          parentTaskId={editingSubTask?.taskId || editingParentTaskId || ''}
          onSubmit={editingSubTask ? handleUpdateSubTask : handleAddSubTask}
          onCancel={handleCancel}
        />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-[var(--color-border)]">
            <button
              onClick={() => setActiveTab('checker')}
              className={`flex items-center gap-2 px-4 py-3 font-display text-sm transition-all duration-200 border-b-2 -mb-[2px] ${
                activeTab === 'checker'
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <span>✓</span>
              <span>チェッカー</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-3 font-display text-sm transition-all duration-200 border-b-2 -mb-[2px] ${
                activeTab === 'history'
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <span>📋</span>
              <span>履歴</span>
              {skippedExecutions.length > 0 && (
                <span className="bg-[var(--color-accent)] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {skippedExecutions.reduce((sum, item) => sum + item.executions.length, 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-3 font-display text-sm transition-all duration-200 border-b-2 -mb-[2px] ${
                activeTab === 'settings'
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <span>⚙</span>
              <span>表示設定</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'checker' && (
            <>
              {allParentTasks.length === 0 ? (
                <div className="card-industrial p-8 text-center mt-6">
                  <p className="font-display text-sm text-[var(--color-text-tertiary)]">
                    ルーティンが設定されているタスクはありません
                  </p>
                </div>
              ) : (
                <>
                  {visibleParentTasks.length === 0 ? (
                    <div className="card-industrial p-8 text-center mt-6">
                      <p className="font-display text-sm text-[var(--color-text-tertiary)]">
                        表示するタスクがありません。表示設定タブからタスクを表示にしてください。
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 mt-6">
                      {visibleParentTasks.map((parentTask) => {
                        const subTasks = getSubTasks(parentTask.id)
                        return (
                          <div key={parentTask.id} className="animate-fade-in-up">
                            <RoutineChecker
                              parentTask={parentTask}
                              subTasks={subTasks}
                              onToggleComplete={handleToggleComplete}
                              onAddSubTask={handleNewSubTask}
                              onEditSubTask={handleEditSubTask}
                              onDeleteSubTask={handleDeleteSubTask}
                              onDeleteParentTask={handleDeleteParentTask}
                              onRefresh={() => setRefreshKey(prev => prev + 1)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <div className="mt-6">
              {skippedExecutions.length === 0 ? (
                <div className="card-industrial p-8 text-center">
                  <p className="font-display text-sm text-[var(--color-text-tertiary)]">
                    スキップされたタスクはありません
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="card-industrial p-4">
                    <h2 className="font-display text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      スキップされたタスク
                    </h2>
                    <p className="font-display text-xs text-[var(--color-text-tertiary)]">
                      過去30日以内にスキップされたタスクを表示します。完了していた場合は修正できます。
                    </p>
                  </div>
                  {skippedExecutions.map(({ task, executions }) => (
                    <div key={task.id} className="card-industrial p-4">
                      <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)] mb-3">
                        {task.title}
                      </h3>
                      <div className="space-y-2">
                        {executions.sort((a, b) => b.date.localeCompare(a.date)).map(execution => (
                          <div 
                            key={execution.id} 
                            className="flex items-center justify-between p-3 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] rounded"
                          >
                            <div>
                              <span className="font-display text-sm text-[var(--color-text-primary)]">
                                {execution.date}
                              </span>
                              <span className="ml-2 font-display text-xs text-[var(--color-text-tertiary)]">
                                スキップ
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUndoSkip(task.id, execution.date)}
                                className="px-3 py-1.5 font-display text-[10px] tracking-wider uppercase bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] transition-colors rounded"
                              >
                                スキップ解除
                              </button>
                              <button
                                onClick={() => handleMarkAsCompleted(task.id, execution.date)}
                                className="px-3 py-1.5 font-display text-[10px] tracking-wider uppercase bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors rounded"
                              >
                                完了に変更
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="mt-6">
              {allParentTasks.length === 0 ? (
                <div className="card-industrial p-8 text-center">
                  <p className="font-display text-sm text-[var(--color-text-tertiary)]">
                    ルーティンが設定されているタスクはありません
                  </p>
                </div>
              ) : (
                <div className="card-industrial p-6">
                  <h2 className="font-display text-sm font-medium text-[var(--color-text-primary)] mb-4">
                    表示設定
                  </h2>
                  <p className="font-display text-xs text-[var(--color-text-tertiary)] mb-4">
                    ルーティンチェッカーで表示するタスクを選択してください
                  </p>
                  <div className="space-y-2">
                    {allParentTasks.map((task) => {
                      const isVisible = task.showInRoutineChecker !== false
                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                        >
                          <span className="font-display text-sm text-[var(--color-text-primary)]">
                            {task.title}
                          </span>
                          <button
                            onClick={() => handleToggleVisibility(task.id, isVisible)}
                            className={`px-4 py-1.5 font-display text-[10px] tracking-wider uppercase transition-all duration-200 ${
                              isVisible
                                ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:bg-[var(--color-accent-hover)]'
                                : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                            }`}
                          >
                            {isVisible ? '表示中' : '非表示'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

