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
            Wish List
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Wishリスト
          </h1>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingWish(undefined)
              setShowForm(true)
            }}
            className="btn-industrial-primary"
          >
            ＋新規リスト
          </button>
        )}
      </div>

      {showForm ? (
        <div className="card-industrial p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
            <div>
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
                {editingWish ? 'Edit Wish' : 'New Wish'}
              </p>
              <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                {editingWish ? 'Wishを編集' : '新しいWishを作成'}
              </h2>
            </div>
          </div>
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
