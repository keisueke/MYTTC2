import { useState, useMemo } from 'react'
import { SubTask } from '../types'
import { useTasks } from '../hooks/useTasks'
import RoutineChecker from '../components/routines/RoutineChecker'
import SubTaskForm from '../components/routines/SubTaskForm'

export default function RoutineCheckerPage() {
  const {
    tasks,
    loading,
    getSubTasks,
    addSubTask,
    updateSubTask,
    deleteSubTask,
    toggleSubTaskComplete,
  } = useTasks()
  
  const [editingSubTask, setEditingSubTask] = useState<SubTask | undefined>(undefined)
  const [editingParentTaskId, setEditingParentTaskId] = useState<string | undefined>(undefined)

  // 繰り返しパターンが設定されているタスク（親タスク）をフィルタリング
  const parentTasks = useMemo(() => {
    return tasks.filter(task => task.repeatPattern !== 'none')
  }, [tasks])

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

  const handleCancel = () => {
    setEditingSubTask(undefined)
    setEditingParentTaskId(undefined)
  }

  const handleNewSubTask = (parentTaskId: string) => {
    setEditingSubTask(undefined)
    setEditingParentTaskId(parentTaskId)
  }

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
          {parentTasks.length === 0 ? (
            <div className="card-industrial p-8 text-center">
              <p className="font-display text-sm text-[var(--color-text-tertiary)]">
                ルーティンが設定されているタスクはありません
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {parentTasks.map((parentTask) => {
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
                    />
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

