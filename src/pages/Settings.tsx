import { useState } from 'react'
import { Category, GitHubConfig } from '../types'
import { useTasks } from '../hooks/useTasks'
import { useGitHub } from '../hooks/useGitHub'
import { loadData } from '../services/taskService'
import { exportTasks } from '../utils/export'
import CategoryList from '../components/categories/CategoryList'
import CategoryForm from '../components/categories/CategoryForm'

export default function Settings() {
  const {
    tasks,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    refresh,
  } = useTasks()
  
  const {
    config: githubConfig,
    syncing,
    error: githubError,
    saveConfig: saveGitHubConfig,
    removeConfig: removeGitHubConfig,
    syncFromGitHub,
    syncToGitHub,
    validateConfig,
  } = useGitHub()
  
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)
  const [showGitHubForm, setShowGitHubForm] = useState(!githubConfig)
  const [githubToken, setGitHubToken] = useState(githubConfig?.token || '')
  const [githubOwner, setGitHubOwner] = useState(githubConfig?.owner || '')
  const [githubRepo, setGitHubRepo] = useState(githubConfig?.repo || '')
  const [githubDataPath, setGitHubDataPath] = useState(githubConfig?.dataPath || 'data/tasks.json')
  const [validating, setValidating] = useState(false)

  const handleCreateCategory = (categoryData: Omit<Category, 'id' | 'createdAt'>) => {
    addCategory(categoryData)
    setShowForm(false)
  }

  const handleUpdateCategory = (categoryData: Omit<Category, 'id' | 'createdAt'>) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData)
      setEditingCategory(undefined)
      setShowForm(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('このカテゴリを削除しますか？関連するタスクのカテゴリは解除されます。')) {
      deleteCategory(id)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCategory(undefined)
  }

  const handleSaveGitHubConfig = async () => {
    if (!githubToken || !githubOwner || !githubRepo) {
      alert('すべての項目を入力してください')
      return
    }

    setValidating(true)
    try {
      const testConfig: GitHubConfig = {
        token: githubToken,
        owner: githubOwner,
        repo: githubRepo,
        dataPath: githubDataPath,
      }

      const isValid = await validateConfig(testConfig)
      if (!isValid) {
        alert('GitHub設定の検証に失敗しました。トークンとリポジトリ情報を確認してください。')
        return
      }

      saveGitHubConfig(testConfig)
      setShowGitHubForm(false)
      alert('GitHub設定を保存しました')
    } catch (error) {
      alert(`設定の保存に失敗しました: ${error}`)
    } finally {
      setValidating(false)
    }
  }

  const handleRemoveGitHubConfig = () => {
    if (confirm('GitHub設定を削除しますか？')) {
      removeGitHubConfig()
      setGitHubToken('')
      setGitHubOwner('')
      setGitHubRepo('')
      setGitHubDataPath('data/tasks.json')
      setShowGitHubForm(true)
    }
  }

  const handleSyncFromGitHub = async () => {
    if (!confirm('GitHubからデータを同期しますか？現在のローカルデータは上書きされます。')) {
      return
    }

    try {
      await syncFromGitHub()
      refresh()
      alert('GitHubからデータを同期しました')
    } catch (error) {
      alert(`同期に失敗しました: ${error}`)
    }
  }

  const handleSyncToGitHub = async () => {
    try {
      await syncToGitHub()
      alert('GitHubにデータを同期しました')
    } catch (error) {
      alert(`同期に失敗しました: ${error}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">設定</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          📥 タスクをエクスポート
        </button>
      </div>
      
      <div className="space-y-6">
        {/* カテゴリ管理 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">カテゴリ管理</h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 新しいカテゴリ
              </button>
            )}
          </div>

          {showForm ? (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                {editingCategory ? 'カテゴリを編集' : '新しいカテゴリを作成'}
              </h3>
              <CategoryForm
                category={editingCategory}
                onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
                onCancel={handleCancel}
              />
            </div>
          ) : (
            <CategoryList
              categories={categories}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>

        {/* GitHub設定 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">GitHub設定</h2>
            {githubConfig && !showGitHubForm && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowGitHubForm(true)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={handleRemoveGitHubConfig}
                  className="px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                >
                  削除
                </button>
              </div>
            )}
          </div>

          {githubConfig && !showGitHubForm ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                  ✅ GitHub設定が有効です
                </p>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p>リポジトリ: {githubConfig.owner}/{githubConfig.repo}</p>
                  <p>データパス: {githubConfig.dataPath}</p>
                  {loadData().lastSynced && (
                    <p>最終同期: {new Date(loadData().lastSynced!).toLocaleString('ja-JP')}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSyncFromGitHub}
                  disabled={syncing}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {syncing ? '同期中...' : 'GitHubから同期'}
                </button>
                <button
                  onClick={handleSyncToGitHub}
                  disabled={syncing}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {syncing ? '同期中...' : 'GitHubに同期'}
                </button>
              </div>

              {githubError && (
                <div className="p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    エラー: {githubError}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  GitHub Token <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGitHubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Personal Access Tokenが必要です。スコープ: repo
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    リポジトリ所有者 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={githubOwner}
                    onChange={(e) => setGitHubOwner(e.target.value)}
                    placeholder="username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    リポジトリ名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={(e) => setGitHubRepo(e.target.value)}
                    placeholder="repository-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  データパス
                </label>
                <input
                  type="text"
                  value={githubDataPath}
                  onChange={(e) => setGitHubDataPath(e.target.value)}
                  placeholder="data/tasks.json"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                {githubConfig && (
                  <button
                    onClick={() => {
                      setShowGitHubForm(false)
                      setGitHubToken(githubConfig.token)
                      setGitHubOwner(githubConfig.owner)
                      setGitHubRepo(githubConfig.repo)
                      setGitHubDataPath(githubConfig.dataPath)
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    キャンセル
                  </button>
                )}
                <button
                  onClick={handleSaveGitHubConfig}
                  disabled={validating}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {validating ? '検証中...' : '保存'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

