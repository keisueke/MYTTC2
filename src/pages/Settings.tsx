import { useState, useEffect } from 'react'
import { Project, Mode, Tag, GitHubConfig, ConflictResolution, AIProvider, AIConfig, AIConfigs, UIMode } from '../types'
import { useTasks } from '../hooks/useTasks'
import { useGitHub } from '../hooks/useGitHub'
import { useCloudflare } from '../hooks/useCloudflare'
import { useNotification } from '../context/NotificationContext'
import { loadData, clearAllData } from '../services/taskService'
import { exportTasks, generateTodaySummary } from '../utils/export'
import { generateTestData } from '../utils/testData'
import { applyTheme, Theme } from '../utils/theme'
import { getTheme, saveTheme, getWeatherConfig, saveWeatherConfig, getSidebarVisibility, saveSidebarVisibility, getSidebarWidth, getWeekStartDay, saveWeekStartDay, getUIMode, saveUIMode } from '../services/taskService'
import { getCoordinatesFromCity } from '../services/weatherService'
import { getSummaryConfig, saveSummaryConfig } from '../services/taskService'
import { SummaryConfig } from '../types'
import * as aiConfigService from '../services/aiConfig'
import { geminiApiProvider } from '../services/aiApi/geminiApi'
import { openaiApiProvider } from '../services/aiApi/openaiApi'
import { claudeApiProvider } from '../services/aiApi/claudeApi'
import { loadCloudflareConfig, saveCloudflareConfig, CloudflareConfig, checkCloudflareHealth } from '../services/cloudflareApi'
import ProjectList from '../components/projects/ProjectList'
import ProjectForm from '../components/projects/ProjectForm'
import ModeList from '../components/modes/ModeList'
import ModeForm from '../components/modes/ModeForm'
import TagList from '../components/tags/TagList'
import TagForm from '../components/tags/TagForm'
import ConflictResolutionDialog from '../components/common/ConflictResolutionDialog'
import SummaryModal from '../components/common/SummaryModal'
import TimeSectionSettingsComponent from '../components/settings/TimeSectionSettings'

type TabType = 'project' | 'mode' | 'tag'

export default function Settings() {
  const {
    tasks,
    projects,
    modes,
    tags,
    memos,
    memoTemplates,
    goals,
    wishes,
    addProject,
    updateProject,
    deleteProject,
    addMode,
    updateMode,
    deleteMode,
    addTag,
    updateTag,
    deleteTag,
    addMemo,
    addMemoTemplate,
    updateMemoTemplate,
    deleteMemoTemplate,
    addGoal,
    addWish,
    addTask,
    refresh,
  } = useTasks()

  const {
    config: githubConfig,
    syncing: githubSyncing,
    error: githubError,
    saveConfig: saveGitHubConfig,
    removeConfig: removeGitHubConfig,
    syncBidirectional: githubSyncBidirectional,
    resolveConflict,
    conflictInfo,
    validateConfig,
  } = useGitHub()

  const {
    syncing: cloudflareSyncing,
    error: cloudflareError,
    syncBidirectional: cloudflareSyncBidirectional,
  } = useCloudflare()

  const { showNotification } = useNotification()

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
  const [cloudflareConfig, setCloudflareConfig] = useState<CloudflareConfig | null>(() => loadCloudflareConfig())
  const [showCloudflareForm, setShowCloudflareForm] = useState(!cloudflareConfig)
  const [cloudflareApiUrl, setCloudflareApiUrl] = useState(cloudflareConfig?.apiUrl || '')
  const [cloudflareApiKey, setCloudflareApiKey] = useState(cloudflareConfig?.apiKey || '')
  const [theme, setTheme] = useState<Theme>(getTheme())
  const [weatherCityName, setWeatherCityName] = useState(getWeatherConfig().cityName)
  const [savingWeather, setSavingWeather] = useState(false)
  const [summaryConfig, setSummaryConfig] = useState<SummaryConfig>(getSummaryConfig())
  const [sidebarAlwaysVisible, setSidebarAlwaysVisible] = useState(getSidebarVisibility())
  const [weekStartDay, setWeekStartDay] = useState<'sunday' | 'monday'>(getWeekStartDay())
  const [uiMode, setUIMode] = useState<UIMode>(getUIMode())
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<{ id?: string; title: string; content: string } | undefined>(undefined)
  const [templateTitle, setTemplateTitle] = useState('')
  const [templateContent, setTemplateContent] = useState('')
  const [aiConfigs, setAiConfigs] = useState<AIConfigs>(() => aiConfigService.loadAIConfigs())
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null)
  const [editingApiKey, setEditingApiKey] = useState('')
  const [editingEnabled, setEditingEnabled] = useState(false)
  const [editingModel, setEditingModel] = useState('')
  const [validatingProvider, setValidatingProvider] = useState<AIProvider | null>(null)
  const [testingCloudflare, setTestingCloudflare] = useState(false)
  const [primaryProvider, setPrimaryProvider] = useState<AIProvider | null>(aiConfigs.primaryProvider)
  const [exportDate, setExportDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [summaryModalOpen, setSummaryModalOpen] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const [summaryTitle, setSummaryTitle] = useState('')

  // テーマ変更時に適用
  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    saveTheme(newTheme)
  }

  const handleSaveWeatherConfig = async () => {
    if (!weatherCityName.trim()) {
      alert('都市名を入力してください')
      return
    }

    setSavingWeather(true)
    try {
      const coordinates = await getCoordinatesFromCity(weatherCityName.trim())
      if (!coordinates) {
        alert('都市が見つかりませんでした。別の都市名を試してください。')
        return
      }

      saveWeatherConfig({
        cityName: weatherCityName.trim(),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      })
      alert('天気設定を保存しました')
    } catch (error) {
      console.error('Failed to save weather config:', error)
      alert('天気設定の保存に失敗しました')
    } finally {
      setSavingWeather(false)
    }
  }

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
      showNotification('すべての項目を入力してください', 'error')
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
        showNotification('GitHub設定の検証に失敗しました。トークンとリポジトリ情報を確認してください。', 'error')
        return
      }

      saveGitHubConfig(testConfig)
      setShowGitHubForm(false)
      showNotification('GitHub設定を保存しました', 'success')
    } catch (error) {
      showNotification(`設定の保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, 'error')
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

  const handleSaveCloudflareConfig = () => {
    if (!cloudflareApiUrl.trim()) {
      showNotification('API URLを入力してください', 'error')
      return
    }

    const config: CloudflareConfig = {
      apiUrl: cloudflareApiUrl.trim(),
      apiKey: cloudflareApiKey.trim() || undefined,
    }

    saveCloudflareConfig(config)
    setCloudflareConfig(config)
    setShowCloudflareForm(false)
    showNotification('Cloudflare設定を保存しました', 'success')
  }

  const handleRemoveCloudflareConfig = () => {
    if (confirm('Cloudflare設定を削除しますか？')) {
      localStorage.removeItem('mytcc2_cloudflare_config')
      setCloudflareConfig(null)
      setCloudflareApiUrl('')
      setCloudflareApiKey('')
      setShowCloudflareForm(true)
    }
  }

  const handleGitHubSync = async () => {
    try {
      const result = await githubSyncBidirectional()
      refresh()

      switch (result) {
        case 'pulled':
          showNotification('GitHubからデータを取得しました', 'success')
          break
        case 'pushed':
          showNotification('GitHubにデータを保存しました', 'success')
          break
        case 'up-to-date':
          showNotification('既に最新の状態です', 'info')
          break
        case 'conflict':
          // 競合ダイアログは自動的に表示される（conflictInfoが設定されるため）
          break
      }
    } catch (error) {
      showNotification(`GitHub同期に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, 'error')
    }
  }

  const handleCloudflareSync = async () => {
    // #region agent log
    console.log('[DEBUG][E] handleCloudflareSync called', { hasCloudflareConfig: !!cloudflareConfig, cloudflareConfig });
    // #endregion
    try {
      // #region agent log
      console.log('[DEBUG][A] calling cloudflareSyncBidirectional');
      // #endregion
      const result = await cloudflareSyncBidirectional()
      // #region agent log
      console.log('[DEBUG][A] cloudflareSyncBidirectional returned', { result });
      // #endregion
      refresh()

      switch (result) {
        case 'pulled':
          showNotification('Cloudflareからデータを取得しました', 'success')
          break
        case 'pushed':
          showNotification('Cloudflareにデータを保存しました', 'success')
          break
        case 'up-to-date':
          showNotification('既に最新の状態です', 'info')
          break
        case 'conflict':
          showNotification('データの競合が発生しました。手動で解決してください。', 'error')
          break
      }
    } catch (error) {
      // #region agent log
      console.error('[DEBUG][B,C] sync error caught', { errorMessage: error instanceof Error ? error.message : String(error), error });
      // #endregion
      showNotification(`Cloudflare同期に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, 'error')
    }
  }

  const handleResolveConflict = async (resolution: ConflictResolution) => {
    try {
      if (resolution === 'cancel') {
        return
      }

      const result = await resolveConflict(resolution)
      refresh()

      if (result === 'pushed') {
        showNotification('ローカルのデータで上書きしました', 'success')
      } else {
        showNotification('リモートのデータで上書きしました', 'success')
      }
    } catch (error) {
      showNotification(`競合の解決に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, 'error')
    }
  }

  const handleExport = () => {
    const date = exportDate ? new Date(exportDate) : undefined
    exportTasks(tasks, projects, modes, tags, date)
  }

  const handleCopyTodaySummary = async (selectedDate?: Date) => {
    try {
      const summary = await generateTodaySummary(tasks, projects, modes, tags, selectedDate)
      const dateStr = selectedDate
        ? new Date(selectedDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
        : '今日'
      setSummaryText(summary)
      setSummaryTitle(`${dateStr}のまとめ`)
      setSummaryModalOpen(true)
    } catch (error) {
      showNotification(`まとめの生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, 'error')
    }
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

      // メモを追加
      const createdMemos: string[] = []
      testData.memos?.forEach(memo => {
        if (!memos.find(m => m.title === memo.title)) {
          addMemo(memo)
          createdMemos.push(memo.title)
        }
      })

      // テンプレートを追加
      const createdTemplates: string[] = []
      testData.memoTemplates?.forEach(template => {
        if (!memoTemplates.find(t => t.title === template.title)) {
          addMemoTemplate(template)
          createdTemplates.push(template.title)
        }
      })

      // 年間目標を追加
      const createdGoals: number = testData.goals?.filter(goal => {
        // 同じ年の同じカテゴリで同じタイトルの目標が既に存在するかチェック
        return !goals.find(g =>
          g.year === goal.year &&
          g.category === goal.category &&
          g.title === goal.title
        )
      }).length || 0
      testData.goals?.forEach(goal => {
        if (!goals.find(g =>
          g.year === goal.year &&
          g.category === goal.category &&
          g.title === goal.title
        )) {
          addGoal(goal)
        }
      })

      // Wishリストを追加
      const createdWishes: string[] = []
      testData.wishes?.forEach(wish => {
        if (!wishes.find(w => w.title === wish.title)) {
          addWish(wish)
          createdWishes.push(wish.title)
        }
      })

      refresh()
      const message = `テストデータを追加しました:\n- プロジェクト: ${createdProjects.length}個\n- モード: ${createdModes.length}個\n- タグ: ${createdTags.length}個\n- タスク: ${testData.tasks.length}個`
      const memoMessage = createdMemos.length > 0 ? `\n- メモ: ${createdMemos.length}個` : ''
      const templateMessage = createdTemplates.length > 0 ? `\n- テンプレート: ${createdTemplates.length}個` : ''
      const goalMessage = createdGoals > 0 ? `\n- 年間目標: ${createdGoals}個` : ''
      const wishMessage = createdWishes.length > 0 ? `\n- Wishリスト: ${createdWishes.length}個` : ''
      alert(message + memoMessage + templateMessage + goalMessage + wishMessage)
    } catch (error) {
      alert(`テストデータの追加に失敗しました: ${error}`)
    }
  }

  const handleClearAllData = () => {
    if (!confirm('⚠️ 警告: すべてのデータを削除しますか？この操作は取り消せません。')) {
      return
    }

    if (!confirm('本当にすべてのデータを削除しますか？')) {
      return
    }

    try {
      clearAllData()
      refresh()
      alert('すべてのデータを削除しました')
    } catch (error) {
      alert(`データの削除に失敗しました: ${error}`)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-[var(--color-border)] pb-6">
        <div>
          <p className="font-display text-[10px] tracking-[0.3em] uppercase text-[var(--color-accent)] mb-2">
            Settings
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            設定
          </h1>
        </div>
      </div>

      {/* 表示・UI設定 */}
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          表示・UI設定
        </h2>
        <p className="font-display text-xs text-[var(--color-text-tertiary)]">
          アプリの見た目や表示に関する設定
        </p>
      </div>

      {/* テーマ設定 */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Appearance
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              テーマ設定
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm text-[var(--color-text-primary)] mb-1">
                テーマ
              </p>
              <p className="font-display text-xs text-[var(--color-text-tertiary)]">
                ダークモードとライトモードを切り替え
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleThemeChange('light')}
                className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${theme === 'light'
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
              >
                ライト
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${theme === 'dark'
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
              >
                ダーク
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 週の開始日設定 */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Week Start
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              週の開始日
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm text-[var(--color-text-primary)] mb-1">
                週の開始日
              </p>
              <p className="font-display text-xs text-[var(--color-text-tertiary)]">
                ハビットトラッカーなどで使用する週の開始日を設定
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setWeekStartDay('sunday')
                  saveWeekStartDay('sunday')
                  showNotification('週の開始日を日曜日に設定しました', 'success')
                }}
                className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${weekStartDay === 'sunday'
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
              >
                日曜日
              </button>
              <button
                onClick={() => {
                  setWeekStartDay('monday')
                  saveWeekStartDay('monday')
                  showNotification('週の開始日を月曜日に設定しました', 'success')
                }}
                className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${weekStartDay === 'monday'
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
              >
                月曜日
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* UIモード設定 */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              UI Mode
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              UIモード
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm text-[var(--color-text-primary)] mb-1">
                UIモード
              </p>
              <p className="font-display text-xs text-[var(--color-text-tertiary)]">
                デスクトップUIまたはモバイルUI（ボトムナビゲーション）を選択
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setUIMode('desktop')
                  saveUIMode('desktop')
                  showNotification('UIモードをデスクトップに変更しました。ページをリロードしてください。', 'info')
                }}
                className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${uiMode === 'desktop'
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
              >
                デスクトップ
              </button>
              <button
                onClick={() => {
                  setUIMode('mobile')
                  saveUIMode('mobile')
                  showNotification('UIモードをモバイルに変更しました。ページをリロードしてください。', 'info')
                }}
                className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${uiMode === 'mobile'
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
              >
                モバイル
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* サイドバー表示設定 */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Sidebar
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              サイドバー表示設定
            </h2>
          </div>
        </div>

        <div className="space-y-6">
          {/* ピンどめボタン */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm text-[var(--color-text-primary)] mb-1">
                サイドバーを常に表示
              </p>
              <p className="font-display text-xs text-[var(--color-text-tertiary)]">
                ピンどめでサイドバーを固定します
              </p>
            </div>
            <button
              onClick={() => {
                const newValue = !sidebarAlwaysVisible
                setSidebarAlwaysVisible(newValue)
                saveSidebarVisibility(newValue)
                window.dispatchEvent(new Event('mytcc2:dataChanged'))
              }}
              className={`p-3 transition-all duration-200 ${sidebarAlwaysVisible
                ? 'text-[var(--color-accent)] hover:text-[var(--color-accent)]/80'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              aria-label={sidebarAlwaysVisible ? 'ピンどめを解除' : 'ピンどめ'}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={sidebarAlwaysVisible ? 2 : 1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          </div>

          {/* サイドバー幅設定 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-display text-sm text-[var(--color-text-primary)]">
                サイドバー幅
              </p>
              <span className="font-display text-xs text-[var(--color-text-tertiary)]">
                {getSidebarWidth()}px
              </span>
            </div>
            <p className="font-display text-xs text-[var(--color-text-tertiary)] mb-3">
              サイドバーの右端をドラッグしてサイズを変更できます（200px～600px）
            </p>
          </div>
        </div>
      </div>

      {/* 天気設定 */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Weather
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              天気設定
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="weather-city" className="block font-display text-sm text-[var(--color-text-primary)] mb-2">
              都市名
            </label>
            <div className="flex gap-2">
              <input
                id="weather-city"
                type="text"
                value={weatherCityName}
                onChange={(e) => setWeatherCityName(e.target.value)}
                placeholder="例: 東京、大阪、名古屋"
                className="input-industrial flex-1"
              />
              <button
                onClick={handleSaveWeatherConfig}
                disabled={savingWeather}
                className="btn-industrial disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingWeather ? '保存中...' : '保存'}
              </button>
            </div>
            <p className="font-display text-xs text-[var(--color-text-tertiary)] mt-2">
              現在の設定: {getWeatherConfig().cityName}
            </p>
          </div>
        </div>
      </div>

      {/* 機能設定 */}
      <div className="mb-6 mt-12">
        <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          機能設定
        </h2>
        <p className="font-display text-xs text-[var(--color-text-tertiary)]">
          アプリの機能に関する設定
        </p>
      </div>

      {/* 時間セクション設定 */}
      <div className="mb-6">
        <TimeSectionSettingsComponent />
      </div>

      {/* 今日のまとめ設定 */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Summary
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              今日のまとめ設定
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <p className="font-display text-xs text-[var(--color-text-tertiary)] mb-4">
            今日のまとめに含める項目を選択してください
          </p>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={summaryConfig.includeWeight}
                onChange={(e) => setSummaryConfig({ ...summaryConfig, includeWeight: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
              />
              <span className="font-display text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                体重
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={summaryConfig.includeBedtime}
                onChange={(e) => setSummaryConfig({ ...summaryConfig, includeBedtime: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
              />
              <span className="font-display text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                就寝時間
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={summaryConfig.includeWakeTime}
                onChange={(e) => setSummaryConfig({ ...summaryConfig, includeWakeTime: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
              />
              <span className="font-display text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                起床時間
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={summaryConfig.includeSleepDuration}
                onChange={(e) => setSummaryConfig({ ...summaryConfig, includeSleepDuration: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
              />
              <span className="font-display text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                睡眠時間
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={summaryConfig.includeBreakfast}
                onChange={(e) => setSummaryConfig({ ...summaryConfig, includeBreakfast: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
              />
              <span className="font-display text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                朝食
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={summaryConfig.includeLunch}
                onChange={(e) => setSummaryConfig({ ...summaryConfig, includeLunch: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
              />
              <span className="font-display text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                昼食
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={summaryConfig.includeDinner}
                onChange={(e) => setSummaryConfig({ ...summaryConfig, includeDinner: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
              />
              <span className="font-display text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                夕食
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={summaryConfig.includeSnack}
                onChange={(e) => setSummaryConfig({ ...summaryConfig, includeSnack: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
              />
              <span className="font-display text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                間食
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={() => {
                saveSummaryConfig(summaryConfig)
                alert('設定を保存しました')
              }}
              className="btn-industrial"
            >
              設定を保存
            </button>
          </div>
        </div>
      </div>

      {/* メモテンプレート管理 */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Memo Templates
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              メモテンプレート管理
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <p className="font-display text-xs text-[var(--color-text-tertiary)] mb-4">
            メモ作成時に使用できるテンプレートを管理します
          </p>

          {showTemplateForm ? (
            <div className="card-industrial p-6 border border-[var(--color-border)]">
              <div className="space-y-4">
                <div>
                  <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                    テンプレート名 <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={templateTitle}
                    onChange={(e) => setTemplateTitle(e.target.value)}
                    className="input-industrial w-full"
                    placeholder="テンプレート名を入力"
                  />
                </div>

                <div>
                  <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                    テンプレート内容
                  </label>
                  <textarea
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    rows={8}
                    className="input-industrial w-full resize-none font-body"
                    placeholder="テンプレート内容を入力"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => {
                      setShowTemplateForm(false)
                      setEditingTemplate(undefined)
                      setTemplateTitle('')
                      setTemplateContent('')
                    }}
                    className="btn-industrial"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => {
                      if (!templateTitle.trim()) {
                        alert('テンプレート名を入力してください')
                        return
                      }
                      try {
                        if (editingTemplate?.id) {
                          updateMemoTemplate(editingTemplate.id, {
                            title: templateTitle.trim(),
                            content: templateContent.trim(),
                          })
                        } else {
                          addMemoTemplate({
                            title: templateTitle.trim(),
                            content: templateContent.trim(),
                          })
                        }
                        setShowTemplateForm(false)
                        setEditingTemplate(undefined)
                        setTemplateTitle('')
                        setTemplateContent('')
                        refresh()
                      } catch (error) {
                        console.error('Failed to save template:', error)
                        alert('テンプレートの保存に失敗しました')
                      }
                    }}
                    className="btn-industrial"
                  >
                    {editingTemplate?.id ? '更新' : '作成'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {memoTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="font-display text-sm text-[var(--color-text-tertiary)]">
                    テンプレートがありません
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memoTemplates.map(template => (
                    <div
                      key={template.id}
                      className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex items-start justify-between gap-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)] mb-1">
                          {template.title}
                        </h3>
                        <p className="font-body text-xs text-[var(--color-text-secondary)] line-clamp-2 whitespace-pre-wrap">
                          {template.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTemplate({ id: template.id, title: template.title, content: template.content })
                            setTemplateTitle(template.title)
                            setTemplateContent(template.content)
                            setShowTemplateForm(true)
                          }}
                          className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-elevated)] transition-all"
                          title="編集"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('このテンプレートを削除しますか？')) {
                              try {
                                deleteMemoTemplate(template.id)
                                refresh()
                              } catch (error) {
                                console.error('Failed to delete template:', error)
                                alert('テンプレートの削除に失敗しました')
                              }
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all"
                          title="削除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-[var(--color-border)]">
                <button
                  onClick={() => {
                    setEditingTemplate(undefined)
                    setTemplateTitle('')
                    setTemplateContent('')
                    setShowTemplateForm(true)
                  }}
                  className="btn-industrial"
                >
                  ＋新規テンプレート
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* データ管理 */}
      <div className="mb-6 mt-12">
        <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          データ管理
        </h2>
        <p className="font-display text-xs text-[var(--color-text-tertiary)]">
          プロジェクト、モード、タグの管理とデータのエクスポート
        </p>
      </div>

      {/* プロジェクト・モード・タグ管理 */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Management
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              プロジェクト・モード・タグ管理
            </h2>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-industrial"
            >
              + 新規作成
            </button>
          )}
        </div>

        {/* タブ */}
        <div className="flex gap-2 mb-4 border-b border-[var(--color-border)]">
          <button
            onClick={() => {
              setActiveTab('project')
              setShowForm(false)
              setEditingProject(undefined)
            }}
            className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${activeTab === 'project'
              ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] border-b-2 border-[var(--color-accent)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-b-2 border-transparent'
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
            className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${activeTab === 'mode'
              ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] border-b-2 border-[var(--color-accent)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-b-2 border-transparent'
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
            className={`px-4 py-2 font-display text-xs tracking-[0.1em] uppercase transition-all duration-200 ${activeTab === 'tag'
              ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] border-b-2 border-[var(--color-accent)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-b-2 border-transparent'
              }`}
          >
            タグ
          </button>
        </div>

        {showForm ? (
          <div className="mb-4">
            <div className="mb-4 pb-4 border-b border-[var(--color-border)]">
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)] mb-1">
                {activeTab === 'project' ? 'Project' : activeTab === 'mode' ? 'Mode' : 'Tag'}
              </p>
              <h3 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
                {activeTab === 'project' && (editingProject ? 'プロジェクトを編集' : '新しいプロジェクトを作成')}
                {activeTab === 'mode' && (editingMode ? 'モードを編集' : '新しいモードを作成')}
                {activeTab === 'tag' && (editingTag ? 'タグを編集' : '新しいタグを作成')}
              </h3>
            </div>
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

      {/* データエクスポート */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Data Export
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              データエクスポート
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              日付
            </label>
            <input
              type="date"
              value={exportDate}
              onChange={(e) => setExportDate(e.target.value)}
              className="input-industrial w-full"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="btn-industrial flex-1"
            >
              📥 タスクをエクスポート
            </button>
            <button
              onClick={async () => {
                const date = exportDate ? new Date(exportDate) : undefined
                await handleCopyTodaySummary(date)
              }}
              className="btn-industrial flex-1 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>まとめをコピー</span>
            </button>
          </div>
        </div>
      </div>

      {/* テスト用 */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Testing
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              テスト用
            </h2>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerateTestData}
            className="btn-industrial"
          >
            🧪 テストデータを追加
          </button>
          <button
            onClick={handleClearAllData}
            className="btn-industrial"
          >
            🗑️ すべてのデータを削除
          </button>
        </div>
      </div>

      {/* 外部連携 */}
      <div className="mb-6 mt-12">
        <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          外部連携・データ同期
        </h2>
        <p className="font-display text-xs text-[var(--color-text-tertiary)]">
          データの保存先を設定できます。設定しない場合はブラウザ内（LocalStorage）に保存されます。
        </p>
      </div>

      {/* データ保存方法の説明 */}
      <div className="card-industrial p-6 mb-6">
        <div className="mb-4 pb-4 border-b border-[var(--color-border)]">
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
            Data Storage
          </p>
          <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
            データの保存方法
          </h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-[var(--color-accent)]/10 rounded">
                <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  LocalStorage（デフォルト）
                </h3>
                <p className="font-display text-xs text-[var(--color-text-tertiary)]">
                  設定不要ですぐに使えます。データはこのブラウザ内に保存されます。
                </p>
              </div>
              <span className="px-2 py-1 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] font-display text-[10px] tracking-wider uppercase">
                有効
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-[var(--color-bg-elevated)] rounded">
                  <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    GitHub同期
                  </h3>
                  <p className="font-display text-xs text-[var(--color-text-tertiary)]">
                    GitHubリポジトリにデータを保存。複数デバイスで同期可能。
                  </p>
                </div>
                {githubConfig && (
                  <span className="px-2 py-1 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] font-display text-[10px] tracking-wider uppercase">
                    設定済
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-[var(--color-bg-elevated)] rounded">
                  <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    Cloudflare同期
                  </h3>
                  <p className="font-display text-xs text-[var(--color-text-tertiary)]">
                    Cloudflare D1にデータを保存。高速で複数デバイス対応。
                  </p>
                </div>
                {cloudflareConfig && (
                  <span className="px-2 py-1 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] font-display text-[10px] tracking-wider uppercase">
                    設定済
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="font-display text-xs text-[var(--color-text-tertiary)]">
              GitHub/Cloudflare同期を設定すると、データがクラウドにバックアップされ、複数デバイスで同期できます。
            </p>
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded p-3">
              <p className="font-display text-xs font-medium text-[var(--color-text-primary)] mb-1">
                自動同期について
              </p>
              <ul className="font-display text-xs text-[var(--color-text-secondary)] space-y-1 list-disc list-inside">
                <li>データが変更されると、数秒後に自動的にクラウドに同期されます</li>
                <li>ページを閉じる際も、可能な範囲で最終同期を試みます</li>
                <li>ネットワークエラー時は、次回の操作時に再試行されます</li>
              </ul>
            </div>
            <p className="font-display text-xs text-[var(--color-text-tertiary)]">
              詳しい設定方法は
              <a
                href="https://github.com/keisueke/MYTTC2/blob/main/docs/self-hosting-guide.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline ml-1"
              >
                セルフホストガイド
              </a>
              をご覧ください。
            </p>
          </div>
        </div>
      </div>

      {/* GitHub設定 */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              GitHub Sync
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              GitHub設定
            </h2>
          </div>
          {githubConfig && !showGitHubForm && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowGitHubForm(true)}
                className="btn-industrial"
              >
                編集
              </button>
              <button
                onClick={handleRemoveGitHubConfig}
                className="btn-industrial"
                style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
              >
                削除
              </button>
            </div>
          )}
        </div>

        {githubConfig && !showGitHubForm ? (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30">
              <p className="font-display text-sm text-[var(--color-secondary)] mb-2">
                ✅ GitHub設定が有効です
              </p>
              <div className="font-display text-xs text-[var(--color-text-secondary)] space-y-1">
                <p>リポジトリ: {githubConfig.owner}/{githubConfig.repo}</p>
                <p>データパス: {githubConfig.dataPath}</p>
                {loadData().lastSynced && (
                  <p>最終同期: {new Date(loadData().lastSynced!).toLocaleString('ja-JP')}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleGitHubSync}
              disabled={githubSyncing}
              className="btn-industrial disabled:opacity-50 disabled:cursor-not-allowed w-full flex items-center justify-center gap-2"
            >
              {githubSyncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
                  <span>同期中...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>同期</span>
                </>
              )}
            </button>

            {githubError && (
              <div className="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30">
                <p className="font-display text-xs text-[var(--color-error)]">
                  エラー: {githubError}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                GitHub Token <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGitHubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="input-industrial w-full"
              />
              <p className="mt-1 font-display text-xs text-[var(--color-text-tertiary)]">
                Personal Access Tokenが必要です。スコープ: repo
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                  リポジトリ所有者 <span className="text-[var(--color-error)]">*</span>
                </label>
                <input
                  type="text"
                  value={githubOwner}
                  onChange={(e) => setGitHubOwner(e.target.value)}
                  placeholder="username"
                  className="input-industrial w-full"
                />
              </div>

              <div>
                <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                  リポジトリ名 <span className="text-[var(--color-error)]">*</span>
                </label>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGitHubRepo(e.target.value)}
                  placeholder="repository-name"
                  className="input-industrial w-full"
                />
              </div>
            </div>

            <div>
              <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                データパス
              </label>
              <input
                type="text"
                value={githubDataPath}
                onChange={(e) => setGitHubDataPath(e.target.value)}
                placeholder="data/tasks.json"
                className="input-industrial w-full"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              {githubConfig && (
                <button
                  onClick={() => {
                    setShowGitHubForm(false)
                    setGitHubToken(githubConfig.token)
                    setGitHubOwner(githubConfig.owner)
                    setGitHubRepo(githubConfig.repo)
                    setGitHubDataPath(githubConfig.dataPath)
                  }}
                  className="btn-industrial"
                >
                  キャンセル
                </button>
              )}
              <button
                onClick={handleSaveGitHubConfig}
                disabled={validating}
                className="btn-industrial disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validating ? '検証中...' : '保存'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cloudflare設定 */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              Cloudflare Sync
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              Cloudflare設定
            </h2>
          </div>
          {cloudflareConfig && !showCloudflareForm && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowCloudflareForm(true)}
                className="btn-industrial"
              >
                編集
              </button>
              <button
                onClick={handleRemoveCloudflareConfig}
                className="btn-industrial"
                style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
              >
                削除
              </button>
            </div>
          )}
        </div>

        {cloudflareConfig && !showCloudflareForm ? (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30">
              <p className="font-display text-sm text-[var(--color-secondary)] mb-2">
                ✅ Cloudflare設定が有効です
              </p>
              <div className="font-display text-xs text-[var(--color-text-secondary)] space-y-1">
                <p>API URL: {cloudflareConfig.apiUrl}</p>
                {cloudflareConfig.apiKey ? (
                  <p>API Key: {cloudflareConfig.apiKey.substring(0, 8)}...</p>
                ) : (
                  <p>API Key: 未設定（Cloudflare Access使用時は不要）</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCloudflareSync}
                disabled={cloudflareSyncing}
                className="btn-industrial disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center gap-2"
              >
                {cloudflareSyncing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
                    <span>同期中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>同期</span>
                  </>
                )}
              </button>

              <button
                onClick={async () => {
                  setTestingCloudflare(true)
                  try {
                    const isHealthy = await checkCloudflareHealth(cloudflareConfig)
                    if (isHealthy) {
                      showNotification('Cloudflare APIに接続できました', 'success')
                    } else {
                      showNotification('Cloudflare APIに接続できませんでした', 'error')
                    }
                  } catch (error) {
                    showNotification(`接続テストに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, 'error')
                  } finally {
                    setTestingCloudflare(false)
                  }
                }}
                disabled={testingCloudflare}
                className="btn-industrial disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center gap-2"
              >
                {testingCloudflare ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
                    <span>テスト中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>接続テスト</span>
                  </>
                )}
              </button>
            </div>

            {cloudflareError && (
              <div className="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30">
                <p className="font-display text-xs text-[var(--color-error)]">
                  エラー: {cloudflareError}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                API URL <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                type="text"
                value={cloudflareApiUrl}
                onChange={(e) => setCloudflareApiUrl(e.target.value)}
                placeholder="https://mytcc2-api.xxxxx.workers.dev"
                className="input-industrial w-full"
              />
              <p className="mt-1 font-display text-xs text-[var(--color-text-tertiary)]">
                Cloudflare Workers APIのURLを入力してください（例: https://mytcc2-api.xxxxx.workers.dev）
              </p>
            </div>

            <div>
              <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                API Key（オプション）
              </label>
              <input
                type="password"
                value={cloudflareApiKey}
                onChange={(e) => setCloudflareApiKey(e.target.value)}
                placeholder="API認証キー（Cloudflare Access使用時は不要）"
                className="input-industrial w-full"
              />
              <p className="mt-1 font-display text-xs text-[var(--color-text-tertiary)]">
                Cloudflare Accessで保護している場合は空欄のままでOKです
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              {cloudflareConfig && (
                <button
                  onClick={() => {
                    setShowCloudflareForm(false)
                    setCloudflareApiUrl(cloudflareConfig.apiUrl)
                    setCloudflareApiKey(cloudflareConfig.apiKey || '')
                  }}
                  className="btn-industrial"
                >
                  キャンセル
                </button>
              )}
              <button
                onClick={handleSaveCloudflareConfig}
                className="btn-industrial"
              >
                保存
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI API設定 */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
              AI Integration
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              AI API設定
            </h2>
          </div>
        </div>

        {/* プライマリAPI選択 */}
        <div className="mb-6 space-y-3">
          <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            プライマリAPI
          </label>
          <div className="flex flex-wrap gap-3">
            {(['gemini', 'openai', 'claude'] as AIProvider[]).map((provider) => {
              const config = aiConfigs.providers.find(p => p.provider === provider)
              const isEnabled = config?.enabled || false
              return (
                <label
                  key={provider}
                  className={`flex items-center gap-2 px-4 py-2 border rounded cursor-pointer transition-all ${primaryProvider === provider
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/50'
                    } ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="primaryProvider"
                    value={provider}
                    checked={primaryProvider === provider}
                    onChange={() => {
                      if (isEnabled) {
                        aiConfigService.setPrimaryProvider(provider)
                        setPrimaryProvider(provider)
                        const updated = aiConfigService.loadAIConfigs()
                        setAiConfigs(updated)
                        showNotification('プライマリAPIを変更しました', 'success')
                      }
                    }}
                    disabled={!isEnabled}
                    className="accent-[var(--color-accent)]"
                  />
                  <span className="font-display text-sm text-[var(--color-text-primary)]">
                    {provider === 'gemini' ? 'Gemini' : provider === 'openai' ? 'OpenAI' : 'Claude'}
                    {!isEnabled && ' (未設定)'}
                  </span>
                </label>
              )
            })}
            <label className="flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] rounded cursor-pointer hover:border-[var(--color-accent)]/50 transition-all">
              <input
                type="radio"
                name="primaryProvider"
                value=""
                checked={primaryProvider === null}
                onChange={() => {
                  aiConfigService.setPrimaryProvider(null)
                  setPrimaryProvider(null)
                  const updated = aiConfigService.loadAIConfigs()
                  setAiConfigs(updated)
                  showNotification('プライマリAPIを解除しました', 'info')
                }}
                className="accent-[var(--color-accent)]"
              />
              <span className="font-display text-sm text-[var(--color-text-primary)]">なし</span>
            </label>
          </div>
        </div>

        {/* 各プロバイダー設定 */}
        <div className="space-y-6">
          {(['gemini', 'openai', 'claude'] as AIProvider[]).map((provider) => {
            const config = aiConfigs.providers.find(p => p.provider === provider)
            const isEditing = editingProvider === provider
            const providerNames = { gemini: 'Gemini', openai: 'OpenAI', claude: 'Claude' }
            const providerLinks = {
              gemini: 'https://makersuite.google.com/app/apikey',
              openai: 'https://platform.openai.com/api-keys',
              claude: 'https://console.anthropic.com/',
            }
            const defaultModels = {
              gemini: 'gemini-2.0-flash',
              openai: 'gpt-4',
              claude: 'claude-3-opus-20240229',
            }

            return (
              <div key={provider} className="border border-[var(--color-border)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)]">
                    {providerNames[provider]}
                  </h3>
                  <div className="flex gap-2">
                    {config && !isEditing && (
                      <>
                        <button
                          onClick={() => {
                            setEditingProvider(provider)
                            setEditingApiKey(config.apiKey)
                            setEditingEnabled(config.enabled)
                            setEditingModel(config.model || defaultModels[provider])
                          }}
                          className="btn-industrial text-xs"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`${providerNames[provider]} API設定を削除しますか？`)) {
                              aiConfigService.deleteAIConfig(provider)
                              const updated = aiConfigService.loadAIConfigs()
                              setAiConfigs(updated)
                              if (primaryProvider === provider) {
                                setPrimaryProvider(null)
                              }
                              showNotification(`${providerNames[provider]} API設定を削除しました`, 'success')
                            }
                          }}
                          className="btn-industrial text-xs"
                          style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                        >
                          削除
                        </button>
                      </>
                    )}
                    {!config && (
                      <button
                        onClick={() => {
                          setEditingProvider(provider)
                          setEditingApiKey('')
                          setEditingEnabled(false)
                          setEditingModel(defaultModels[provider])
                        }}
                        className="btn-industrial text-xs"
                      >
                        追加
                      </button>
                    )}
                  </div>
                </div>

                {config && !isEditing ? (
                  <div className="p-3 bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 rounded">
                    <p className="font-display text-xs text-[var(--color-text-secondary)] space-y-1">
                      <span className={config.enabled ? 'text-[var(--color-secondary)]' : 'text-[var(--color-text-tertiary)]'}>
                        {config.enabled ? '✅ 有効' : '⚠️ 無効'}
                      </span>
                      {' | '}
                      <span>APIキー: {config.apiKey.substring(0, 10)}...</span>
                      {config.model && ` | モデル: ${config.model}`}
                    </p>
                  </div>
                ) : isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                        API Key <span className="text-[var(--color-error)]">*</span>
                      </label>
                      <input
                        type="password"
                        value={editingApiKey}
                        onChange={(e) => setEditingApiKey(e.target.value)}
                        placeholder={provider === 'gemini' ? 'AIzaSy...' : provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                        className="input-industrial w-full"
                      />
                      <p className="mt-1 font-display text-xs text-[var(--color-text-tertiary)]">
                        <a href={providerLinks[provider]} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">
                          {providerLinks[provider]}
                        </a> でAPIキーを取得してください
                      </p>
                    </div>

                    <div>
                      <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                        モデル（オプション）
                      </label>
                      <input
                        type="text"
                        value={editingModel}
                        onChange={(e) => setEditingModel(e.target.value)}
                        placeholder={defaultModels[provider]}
                        className="input-industrial w-full"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`${provider}Enabled`}
                        checked={editingEnabled}
                        onChange={(e) => setEditingEnabled(e.target.checked)}
                        className="w-4 h-4 accent-[var(--color-accent)]"
                      />
                      <label htmlFor={`${provider}Enabled`} className="font-display text-sm text-[var(--color-text-primary)] cursor-pointer">
                        有効化
                      </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
                      <button
                        onClick={() => {
                          setEditingProvider(null)
                          setEditingApiKey('')
                          setEditingEnabled(false)
                          setEditingModel('')
                        }}
                        className="btn-industrial text-xs"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={async () => {
                          if (!editingApiKey.trim()) {
                            showNotification('APIキーを入力してください', 'error')
                            return
                          }

                          setValidatingProvider(provider)
                          try {
                            let isValid = false
                            let errorMessage = ''

                            try {
                              if (provider === 'gemini') {
                                isValid = await geminiApiProvider.validateApiKey(editingApiKey, editingModel)
                              } else if (provider === 'openai') {
                                isValid = await openaiApiProvider.validateApiKey(editingApiKey, editingModel)
                              } else if (provider === 'claude') {
                                isValid = await claudeApiProvider.validateApiKey(editingApiKey, editingModel)
                              }
                            } catch (apiError) {
                              if (apiError instanceof Error) {
                                errorMessage = apiError.message
                              } else {
                                errorMessage = 'APIキーの検証中にエラーが発生しました'
                              }
                              isValid = false
                            }

                            if (!isValid) {
                              const message = errorMessage || 'APIキーの検証に失敗しました。APIキーが正しいか、モデル名が正しいか確認してください。'
                              showNotification(message, 'error')
                              return
                            }

                            const newConfig: AIConfig = {
                              provider,
                              apiKey: editingApiKey,
                              enabled: editingEnabled,
                              model: editingModel || undefined,
                            }
                            aiConfigService.saveAIConfig(newConfig)
                            const updated = aiConfigService.loadAIConfigs()
                            setAiConfigs(updated)
                            setEditingProvider(null)
                            setEditingApiKey('')
                            setEditingEnabled(false)
                            setEditingModel('')
                            showNotification(`${providerNames[provider]} API設定を保存しました`, 'success')
                          } catch (error) {
                            showNotification(`設定の保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, 'error')
                          } finally {
                            setValidatingProvider(null)
                          }
                        }}
                        disabled={validatingProvider === provider}
                        className="btn-industrial text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {validatingProvider === provider ? '検証中...' : '保存'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {conflictInfo && (
        <ConflictResolutionDialog
          conflictInfo={conflictInfo}
          onResolve={handleResolveConflict}
          onCancel={() => handleResolveConflict('cancel')}
        />
      )}

      <SummaryModal
        isOpen={summaryModalOpen}
        summary={summaryText}
        title={summaryTitle}
        onClose={() => setSummaryModalOpen(false)}
        onCopySuccess={() => showNotification('クリップボードにコピーしました', 'success')}
        onCopyError={() => showNotification('コピーに失敗しました。ダウンロードをお試しください', 'error')}
      />

    </div>
  )
}

