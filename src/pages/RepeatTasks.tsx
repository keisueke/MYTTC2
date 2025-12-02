import { useState, useMemo } from 'react'
import { Task } from '../types'
import { useTasks } from '../hooks/useTasks'
import TaskList from '../components/tasks/TaskList'
import TaskForm from '../components/tasks/TaskForm'

export default function RepeatTasks() {
  const {
    tasks,
    projects,
    modes,
    tags,
    loading,
    addTask,
    updateTask,
    deleteTask,
    copyTask,
    moveTaskToPosition,
    startTaskTimer,
    stopTaskTimer,
  } = useTasks()
  
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)

  // 繰り返しが設定されているタスクのみをフィルタリング
  const repeatTasks = useMemo(() => {
    return tasks.filter(task => task.repeatPattern !== 'none')
  }, [tasks])

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    addTask(taskData)
    setShowForm(false)
  }

  const handleUpdateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData)
      setEditingTask(undefined)
      setShowForm(false)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('このタスクを削除しますか？')) {
      deleteTask(id)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTask(undefined)
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
            Routine
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            🔁 ルーティン
          </h1>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingTask(undefined)
              setShowForm(true)
            }}
            className="btn-industrial-primary"
          >
            + 新規タスク
          </button>
        )}
      </div>

      {showForm ? (
        <div className="card-industrial p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
            <div>
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
                {editingTask ? 'Edit Task' : 'New Task'}
              </p>
              <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                {editingTask ? 'タスクを編集' : '新しいタスクを作成'}
              </h2>
            </div>
          </div>
          <TaskForm
            task={editingTask}
            tasks={tasks}
            projects={projects}
            modes={modes}
            tags={tags}
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <>
          {repeatTasks.length === 0 ? (
            <div className="card-industrial p-8 text-center">
              <p className="font-display text-sm text-[var(--color-text-tertiary)]">
                ルーティンが設定されているタスクはありません
              </p>
            </div>
          ) : (
            <TaskList
              tasks={repeatTasks}
              projects={projects}
              modes={modes}
              tags={tags}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStartTimer={startTaskTimer}
              onStopTimer={stopTaskTimer}
              onCopy={copyTask}
              onMoveTask={moveTaskToPosition}
            />
          )}
        </>
      )}
    </div>
  )
}

