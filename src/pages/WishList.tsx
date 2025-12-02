import { useState } from 'react'
import { Wish, Task } from '../types'
import { useTasks } from '../hooks/useTasks'
import WishList from '../components/wishes/WishList'
import WishForm from '../components/wishes/WishForm'
import { useNavigate } from 'react-router-dom'

export default function WishListPage() {
  const {
    wishes,
    projects,
    modes,
    tags,
    loading,
    addWish,
    updateWish,
    deleteWish,
    addTask,
  } = useTasks()
  
  const [showForm, setShowForm] = useState(false)
  const [editingWish, setEditingWish] = useState<Wish | undefined>(undefined)
  const navigate = useNavigate()

  const handleCreateWish = (wishData: Omit<Wish, 'id' | 'createdAt' | 'updatedAt'>) => {
    addWish(wishData)
    setShowForm(false)
  }

  const handleUpdateWish = (wishData: Omit<Wish, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingWish) {
      updateWish(editingWish.id, wishData)
      setEditingWish(undefined)
      setShowForm(false)
    }
  }

  const handleEdit = (wish: Wish) => {
    setEditingWish(wish)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('このwishを削除しますか？')) {
      deleteWish(id)
    }
  }

  const handleConvertToTask = (wish: Wish) => {
    if (confirm('このwishをタスクに変換しますか？')) {
      const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        title: wish.title,
        description: wish.description,
        projectId: wish.projectId,
        modeId: wish.modeId,
        tagIds: wish.tagIds,
        repeatPattern: 'none',
      }
      addTask(taskData)
      deleteWish(wish.id)
      navigate('/tasks')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingWish(undefined)
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
          ⭐ Wishリスト
        </h1>
        {!showForm && (
          <button
            onClick={() => {
              setEditingWish(undefined)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 新規Wish
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingWish ? 'Wishを編集' : '新しいWishを作成'}
          </h2>
          <WishForm
            wish={editingWish}
            projects={projects}
            modes={modes}
            tags={tags}
            onSubmit={editingWish ? handleUpdateWish : handleCreateWish}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <WishList
          wishes={wishes}
          projects={projects}
          modes={modes}
          tags={tags}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onConvertToTask={handleConvertToTask}
        />
      )}
    </div>
  )
}

