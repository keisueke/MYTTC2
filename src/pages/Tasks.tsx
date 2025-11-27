import { useState } from 'react'
import { Task } from '../types'
import { useTasks } from '../hooks/useTasks'
import TaskList from '../components/tasks/TaskList'
import TaskForm from '../components/tasks/TaskForm'
import { generateNextRepeatTask } from '../utils/repeatUtils'

export default function Tasks() {
  const {
    tasks,
    categories,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
  } = useTasks()
  
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    addTask(taskData)
    setShowForm(false)
  }

  const handleToggle = (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    toggleTaskCompletion(id)

    // タスクが完了した場合、繰り返しタスクを生成
    if (!task.completed && task.repeatPattern !== 'none' && task.dueDate) {
      const nextTask = generateNextRepeatTask(task)
      if (nextTask) {
        // 少し遅延させてから次のタスクを追加（UIの更新を待つため）
        setTimeout(() => {
          addTask({
            title: nextTask.title,
            description: nextTask.description,
            completed: false,
            priority: nextTask.priority,
            dueDate: nextTask.dueDate,
            categoryId: nextTask.categoryId,
            repeatPattern: nextTask.repeatPattern,
            repeatConfig: nextTask.repeatConfig,
          })
        }, 100)
      }
    }
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
        <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">タスク一覧</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 新しいタスク
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingTask ? 'タスクを編集' : '新しいタスクを作成'}
          </h2>
          <TaskForm
            task={editingTask}
            categories={categories}
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          categories={categories}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

