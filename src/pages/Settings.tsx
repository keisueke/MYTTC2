import { useState } from 'react'
import { Project, Mode, Tag, GitHubConfig } from '../types'
import { useTasks } from '../hooks/useTasks'
import { useGitHub } from '../hooks/useGitHub'
import { loadData } from '../services/taskService'
import { exportTasks } from '../utils/export'
import { generateTestData } from '../utils/testData'
import ProjectList from '../components/projects/ProjectList'
import ProjectForm from '../components/projects/ProjectForm'
import ModeList from '../components/modes/ModeList'
import ModeForm from '../components/modes/ModeForm'
import TagList from '../components/tags/TagList'
import TagForm from '../components/tags/TagForm'

type TabType = 'project' | 'mode' | 'tag'

export default function Settings() {
  const {
    tasks,
    projects,
    modes,
    tags,
    addProject,
    updateProject,
    deleteProject,
    addMode,
    updateMode,
    deleteMode,
    addTag,
    updateTag,
    deleteTag,
    addTask,
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
  
  const [activeTab, setActiveTab] = useState<TabType>('project')
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined)
  const [editingMode, setEditingMode] = useState<Mode | undefined>(undefined)
  const [editingTag, setEditingTag] = useState<Tag | undefined>(undefined)
  const [showGitHubForm, setShowGitHubForm] = useState(!githubConfig)
  const [githubToken, setGitHubToken] = useState(githubConfig?.token || '')
  const [githubOwner, setGitHubOwner] = useState(githubConfig?.owner || '')
  const [githubRepo, setGitHubRepo] = useState(githubConfig?.repo || '')
  const [githubDataPath, setGitHubDataPath] = useState(githubConfig?.dataPath || 'data/tasks.json')
  const [validating, setValidating] = useState(false)

  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    addProject(projectData)
    setShowForm(false)
    setEditingProject(undefined)
  }

  const handleUpdateProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    if (editingProject) {
      updateProject(editingProject.id, projectData)
      setEditingProject(undefined)
      setShowForm(false)
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowForm(true)
  }

  const handleDeleteProject = (id: string) => {
    if (confirm('このプロジェクトを削除しますか？関連するタスクのプロジェクトは解除されます。')) {
      deleteProject(id)
    }
  }

  const handleCreateMode = (modeData: Omit<Mode, 'id' | 'createdAt'>) => {
    addMode(modeData)
    setShowForm(false)
    setEditingMode(undefined)
  }

  const handleUpdateMode = (modeData: Omit<Mode, 'id' | 'createdAt'>) => {
    if (editingMode) {
      updateMode(editingMode.id, modeData)
      setEditingMode(undefined)
      setShowForm(false)
    }
  }

  const handleEditMode = (mode: Mode) => {
    setEditingMode(mode)
    setShowForm(true)
  }

  const handleDeleteMode = (id: string) => {
    if (confirm('このモードを削除しますか？関連するタスクのモードは解除されます。')) {
      deleteMode(id)
    }
  }

  const handleCreateTag = (tagData: Omit<Tag, 'id' | 'createdAt'>) => {
    addTag(tagData)
    setShowForm(false)
    setEditingTag(undefined)
  }

  const handleUpdateTag = (tagData: Omit<Tag, 'id' | 'createdAt'>) => {
    if (editingTag) {
      updateTag(editingTag.id, tagData)
      setEditingTag(undefined)
      setShowForm(false)
    }
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag)
    setShowForm(true)
  }

  const handleDeleteTag = (id: string) => {
    if (confirm('このタグを削除しますか？関連するタスクのタグは解除されます。')) {
      deleteTag(id)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProject(undefined)
    setEditingMode(undefined)
    setEditingTag(undefined)
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

  const handleExport = () => {
    exportTasks(tasks, projects, modes, tags)
  }

  const handleGenerateTestData = () => {
    if (!confirm('テストデータを追加しますか？既存のデータは保持されます。')) {
      return
    }

    try {
      const testData = generateTestData()

      // プロジェクトを追加
      const createdProjects: Project[] = []
      testData.projects.forEach(project => {
        // 既に同じ名前のプロジェクトが存在するかチェック
        if (!projects.find(p => p.name === project.name)) {
          createdProjects.push(addProject(project))
        }
      })

      // モードを追加
      const createdModes: Mode[] = []
      testData.modes.forEach(mode => {
        if (!modes.find(m => m.name === mode.name)) {
          createdModes.push(addMode(mode))
        }
      })

      // タグを追加
      const createdTags: Tag[] = []
      testData.tags.forEach(tag => {
        if (!tags.find(t => t.name === tag.name)) {
          createdTags.push(addTag(tag))
        }
      })

      // タスクを追加（プロジェクト、モード、タグをランダムに割り当て）
      testData.tasks.forEach((task, index) => {
        const taskWithRelations = {
          ...task,
          projectId: createdProjects.length > 0 
            ? createdProjects[index % createdProjects.length]?.id 
            : undefined,
          modeId: createdModes.length > 0 
            ? createdModes[index % createdModes.length]?.id 
            : undefined,
          tagIds: createdTags.length > 0 
            ? [createdTags[index % createdTags.length]?.id].filter(Boolean) as string[]
            : undefined,
        }
        addTask(taskWithRelations)
      })

      refresh()
      alert(`テストデータを追加しました:\n- プロジェクト: ${createdProjects.length}個\n- モード: ${createdModes.length}個\n- タグ: ${createdTags.length}個\n- タスク: ${testData.tasks.length}個`)
    } catch (error) {
      alert(`テストデータの追加に失敗しました: ${error}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">設定</h1>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateTestData}
            className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            🧪 テストデータを追加
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            📥 タスクをエクスポート
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* プロジェクト・モード・タグ管理 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">プロジェクト・モード・タグ管理</h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 新規作成
              </button>
            )}
          </div>

          {/* タブ */}
          <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setActiveTab('project')
                setShowForm(false)
                setEditingProject(undefined)
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'project'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              プロジェクト
            </button>
            <button
              onClick={() => {
                setActiveTab('mode')
                setShowForm(false)
                setEditingMode(undefined)
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'mode'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              モード
            </button>
            <button
              onClick={() => {
                setActiveTab('tag')
                setShowForm(false)
                setEditingTag(undefined)
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'tag'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              タグ
            </button>
          </div>

          {showForm ? (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                {activeTab === 'project' && (editingProject ? 'プロジェクトを編集' : '新しいプロジェクトを作成')}
                {activeTab === 'mode' && (editingMode ? 'モードを編集' : '新しいモードを作成')}
                {activeTab === 'tag' && (editingTag ? 'タグを編集' : '新しいタグを作成')}
              </h3>
              {activeTab === 'project' && (
                <ProjectForm
                  project={editingProject}
                  onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
                  onCancel={handleCancel}
                />
              )}
              {activeTab === 'mode' && (
                <ModeForm
                  mode={editingMode}
                  onSubmit={editingMode ? handleUpdateMode : handleCreateMode}
                  onCancel={handleCancel}
                />
              )}
              {activeTab === 'tag' && (
                <TagForm
                  tag={editingTag}
                  onSubmit={editingTag ? handleUpdateTag : handleCreateTag}
                  onCancel={handleCancel}
                />
              )}
            </div>
          ) : (
            <>
              {activeTab === 'project' && (
                <ProjectList
                  projects={projects}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                />
              )}
              {activeTab === 'mode' && (
                <ModeList
                  modes={modes}
                  onEdit={handleEditMode}
                  onDelete={handleDeleteMode}
                />
              )}
              {activeTab === 'tag' && (
                <TagList
                  tags={tags}
                  onEdit={handleEditTag}
                  onDelete={handleDeleteTag}
                />
              )}
            </>
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

