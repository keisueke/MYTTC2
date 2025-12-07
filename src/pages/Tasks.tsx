import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Task } from '../types'
import { useTasks } from '../hooks/useTasks'
import { useSelectedDate } from '../context/SelectedDateContext'
import TaskList from '../components/tasks/TaskList'
import TaskForm from '../components/tasks/TaskForm'

export default function Tasks() {
  const {
    tasks,
    projects,
    modes,
    tags,
    goals,
    loading,
    addTask,
    updateTask,
    deleteTask,
    copyTask,
    moveTaskToPosition,
    startTaskTimer,
    stopTaskTimer,
    routineExecutions,
  } = useTasks()
  
  const { selectedDate, isToday } = useSelectedDate()
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    // 選択日付をベースにタスクを作成（今日以外の日付が選択されている場合）
    addTask(taskData, isToday ? undefined : selectedDate)
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
            Tasks
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {format(selectedDate, 'M/d(E)', { locale: ja })} のタスク
            {isToday && (
              <span className="ml-3 text-sm font-normal text-[var(--color-accent)]">
                今日
              </span>
            )}
          </h1>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-industrial"
          >
            ＋新規タスク
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
            goals={goals}
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          projects={projects}
          modes={modes}
          tags={tags}
          routineExecutions={routineExecutions}
          referenceDate={selectedDate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStartTimer={startTaskTimer}
          onStopTimer={stopTaskTimer}
          onCopy={copyTask}
          onMoveTask={moveTaskToPosition}
        />
      )}
    </div>
  )
}

