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
        <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          🔁 ルーティン
        </h1>
        {!showForm && (
          <button
            onClick={() => {
              setEditingTask(undefined)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 新規タスク
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
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
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-500 dark:text-gray-400">
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
            />
          )}
        </>
      )}
    </div>
  )
}

