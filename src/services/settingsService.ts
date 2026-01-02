/**
 * 設定管理サービス
 * ダッシュボードレイアウト、時間セクション、UIモード、テーマなどの設定を管理
 */
import { 
  DashboardLayoutConfig, 
  SummaryConfig, 
  WeatherConfig, 
  TimeSectionSettings, 
  TimeSectionDayConfig, 
  TimeSection, 
  Weekday,
  Task
} from '../types'
import { loadData, saveData } from './dataStorage'
import { getStoredTheme, saveTheme as saveThemeToStorage } from '../utils/theme'
import { getWeatherConfig as getWeatherConfigFromStorage, saveWeatherConfig as saveWeatherConfigToStorage } from '../utils/weatherConfig'

// =====================================
// サマリー設定
// =====================================

/**
 * 設定を取得（デフォルト値: すべてtrue）
 */
export function getSummaryConfig(): SummaryConfig {
  const data = loadData()

  if (data.summaryConfig) {
    return data.summaryConfig
  }

  // デフォルト値（すべてtrue）
  return {
    includeWeight: true,
    includeBedtime: true,
    includeWakeTime: true,
    includeSleepDuration: true,
    includeBreakfast: true,
    includeLunch: true,
    includeDinner: true,
    includeSnack: true,
  }
}

/**
 * 設定を保存
 */
export function saveSummaryConfig(config: SummaryConfig): void {
  const data = loadData()
  data.summaryConfig = config
  saveData(data)
}

// =====================================
// テーマ設定
// =====================================

/**
 * テーマ設定を取得
 */
export function getTheme(): 'light' | 'dark' {
  const data = loadData()
  if (data.theme) {
    return data.theme
  }
  // AppDataにない場合はLocalStorageから取得
  return getStoredTheme()
}

/**
 * テーマ設定を保存
 */
export function saveTheme(theme: 'light' | 'dark'): void {
  const data = loadData()
  data.theme = theme
  saveData(data)
  // LocalStorageにも保存（後方互換性のため）
  saveThemeToStorage(theme)
}

// =====================================
// 天気設定
// =====================================

/**
 * 天気設定を取得
 */
export function getWeatherConfig(): WeatherConfig {
  const data = loadData()
  if (data.weatherConfig) {
    return data.weatherConfig
  }
  // AppDataにない場合はLocalStorageから取得
  return getWeatherConfigFromStorage()
}

/**
 * 天気設定を保存
 */
export function saveWeatherConfig(config: WeatherConfig): void {
  const data = loadData()
  data.weatherConfig = config
  saveData(data)
  // LocalStorageにも保存（後方互換性のため）
  saveWeatherConfigToStorage(config)
}

// =====================================
// サイドバー設定
// =====================================

/**
 * サイドバー表示設定を取得
 */
export function getSidebarVisibility(): boolean {
  const data = loadData()
  return data.sidebarAlwaysVisible ?? false // デフォルトはfalse（非表示）
}

/**
 * サイドバー表示設定を保存
 */
export function saveSidebarVisibility(alwaysVisible: boolean): void {
  const data = loadData()
  data.sidebarAlwaysVisible = alwaysVisible
  saveData(data)
}

/**
 * サイドバー幅を取得
 */
export function getSidebarWidth(): number {
  const data = loadData()
  return data.sidebarWidth ?? 320 // デフォルト: 320px
}

/**
 * サイドバー幅を保存
 */
export function saveSidebarWidth(width: number): void {
  const data = loadData()
  data.sidebarWidth = width
  saveData(data)
}

// =====================================
// ダッシュボードレイアウト
// =====================================

/**
 * デフォルトのダッシュボードレイアウトを取得
 */
function getDefaultDashboardLayout(): DashboardLayoutConfig {
  return {
    widgets: [
      { id: 'tasks-summary', order: 0, visible: true },
      { id: 'routine-summary', order: 1, visible: true },
      { id: 'analyze-summary', order: 2, visible: true },
      { id: 'weather-card', order: 3, visible: true },
      { id: 'daily-timeline', order: 4, visible: true },
      { id: 'habit-tracker', order: 5, visible: true },
      { id: 'daily-record-input', order: 6, visible: true },
    ]
  }
}

/**
 * ダッシュボードレイアウトを取得
 */
export function getDashboardLayout(): DashboardLayoutConfig {
  const data = loadData()
  let currentLayout = data.dashboardLayout || getDefaultDashboardLayout()

  // 削除対象のウィジェット（完全に削除）
  const removedWidgets = ['stats-grid', 'time-summary', 'time-axis-chart', 'daily-review', 'daily-reflection', 'recent-tasks', 'daily-records-summary']

  // 新しいデフォルトウィジェット
  const defaultWidgets = getDefaultDashboardLayout().widgets
  const validWidgetIds = new Set(defaultWidgets.map(w => w.id))

  let needsUpdate = false

  // 削除対象のウィジェットを除去
  const filteredWidgets = currentLayout.widgets.filter(w => !removedWidgets.includes(w.id))
  if (filteredWidgets.length !== currentLayout.widgets.length) {
    currentLayout.widgets = filteredWidgets
    needsUpdate = true
  }

  // 新しいウィジェットを既存のレイアウトに追加
  const existingWidgetIds = new Set(currentLayout.widgets.map(w => w.id))
  for (const defaultWidget of defaultWidgets) {
    if (!existingWidgetIds.has(defaultWidget.id)) {
      currentLayout.widgets.push(defaultWidget)
      needsUpdate = true
    }
  }

  // 無効なウィジェットを削除
  const finalFilteredWidgets = currentLayout.widgets.filter(w => validWidgetIds.has(w.id))
  if (finalFilteredWidgets.length !== currentLayout.widgets.length) {
    currentLayout.widgets = finalFilteredWidgets
    needsUpdate = true
  }

  // orderを再割り当て
  currentLayout.widgets = currentLayout.widgets.map((widget, index) => ({
    ...widget,
    order: index,
  }))

  if (needsUpdate) {
    saveDashboardLayout(currentLayout)
  }

  return currentLayout
}

/**
 * ダッシュボードレイアウトを保存
 */
export function saveDashboardLayout(layout: DashboardLayoutConfig): void {
  const data = loadData()
  data.dashboardLayout = layout
  saveData(data)
}

// =====================================
// 時間セクション設定
// =====================================

/**
 * デフォルトの時間セクション設定を生成
 */
function getDefaultTimeSectionSettings(): TimeSectionSettings {
  // デフォルトのセクション（全曜日共通）
  const defaultSections: TimeSection[] = [
    { id: 'morning', name: '朝', start: '06:00', end: '09:00', color: '#FFB74D', order: 0 },
    { id: 'work', name: '仕事', start: '09:00', end: '18:00', color: '#64B5F6', order: 1 },
    { id: 'evening', name: '夕方', start: '18:00', end: '21:00', color: '#81C784', order: 2 },
    { id: 'night', name: '夜', start: '21:00', end: '24:00', color: '#9575CD', order: 3 },
  ]

  // 全曜日に同じデフォルト設定を適用
  const dayConfigs: TimeSectionDayConfig[] = []
  for (let i = 0; i < 7; i++) {
    dayConfigs.push({
      weekday: i as Weekday,
      sections: defaultSections.map(s => ({ ...s, id: `${s.id}-${i}` })),
    })
  }

  return {
    enabled: false, // デフォルトは無効
    dayConfigs,
  }
}

/**
 * 時間セクション設定を取得
 */
export function getTimeSectionSettings(): TimeSectionSettings {
  const data = loadData()
  if (!data.timeSectionSettings) {
    return getDefaultTimeSectionSettings()
  }
  return data.timeSectionSettings
}

/**
 * 時間セクション設定を保存
 */
export function saveTimeSectionSettings(settings: TimeSectionSettings): void {
  const data = loadData()

  // バリデーション
  validateTimeSectionSettings(settings)

  data.timeSectionSettings = settings
  saveData(data)
}

/**
 * HH:mm形式の時刻を分に変換
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * 時間セクション設定のバリデーション
 */
function validateTimeSectionSettings(settings: TimeSectionSettings): void {
  for (const dayConfig of settings.dayConfigs) {
    const sections = dayConfig.sections

    // セクション数は2〜5
    if (sections.length < 2 || sections.length > 5) {
      throw new Error(`曜日 ${dayConfig.weekday} のセクション数は2〜5である必要があります（現在: ${sections.length}）`)
    }

    // 各セクションのバリデーション
    for (const section of sections) {
      // 名前が空でないこと
      if (!section.name.trim()) {
        throw new Error('セクション名は空にできません')
      }

      // 開始時刻 < 終了時刻（24:00は特別扱い）
      const startMinutes = timeToMinutes(section.start)
      const endMinutes = section.end === '24:00' ? 24 * 60 : timeToMinutes(section.end)

      if (startMinutes >= endMinutes) {
        throw new Error(`セクション「${section.name}」の開始時刻は終了時刻より前である必要があります`)
      }
    }

    // セクション間の重なりチェック（orderでソートして隣接チェック）
    const sortedSections = [...sections].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
    for (let i = 0; i < sortedSections.length - 1; i++) {
      const current = sortedSections[i]
      const next = sortedSections[i + 1]

      const currentEnd = current.end === '24:00' ? 24 * 60 : timeToMinutes(current.end)
      const nextStart = timeToMinutes(next.start)

      if (currentEnd > nextStart) {
        throw new Error(`セクション「${current.name}」と「${next.name}」の時間帯が重なっています`)
      }
    }
  }
}

/**
 * 指定された曜日の時間セクション設定を取得
 */
export function getTimeSectionsForWeekday(weekday: Weekday): TimeSection[] {
  const settings = getTimeSectionSettings()
  if (!settings.enabled) {
    return []
  }

  const dayConfig = settings.dayConfigs.find(dc => dc.weekday === weekday)
  return dayConfig?.sections || []
}

/**
 * 指定された日時が属する時間セクションを取得
 */
export function findTimeSectionForDateTime(date: Date): TimeSection | undefined {
  const settings = getTimeSectionSettings()
  if (!settings.enabled) {
    return undefined
  }

  const weekday = date.getDay() as Weekday
  const sections = getTimeSectionsForWeekday(weekday)

  if (sections.length === 0) {
    return undefined
  }

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const currentMinutes = hours * 60 + minutes

  for (const section of sections) {
    const startMinutes = timeToMinutes(section.start)
    const endMinutes = section.end === '24:00' ? 24 * 60 : timeToMinutes(section.end)

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return section
    }
  }

  return undefined
}

/**
 * タスクの時間セクションを自動判定
 * startTime, dueDate, createdAtの順で判定
 */
export function findTimeSectionForTask(task: Task, baseDate?: Date): TimeSection | undefined {
  // 既にtimeSectionIdが設定されている場合はそれを使用
  if (task.timeSectionId) {
    const settings = getTimeSectionSettings()
    if (!settings.enabled) {
      return undefined
    }

    // 全曜日から該当するセクションを探す
    for (const dayConfig of settings.dayConfigs) {
      const section = dayConfig.sections.find(s => s.id === task.timeSectionId)
      if (section) {
        return section
      }
    }
    return undefined
  }

  // startTimeがあればその時刻で判定
  if (task.startTime) {
    return findTimeSectionForDateTime(new Date(task.startTime))
  }

  // dueDateがあればその時刻で判定
  if (task.dueDate) {
    return findTimeSectionForDateTime(new Date(task.dueDate))
  }

  // baseDateが指定されていればその日の最初のセクションを返す
  if (baseDate) {
    const weekday = baseDate.getDay() as Weekday
    const sections = getTimeSectionsForWeekday(weekday)
    return sections[0]
  }

  return undefined
}

// =====================================
// 週の開始日設定
// =====================================

/**
 * 週の開始日を取得
 */
export function getWeekStartDay(): 'sunday' | 'monday' {
  const data = loadData()
  return data.weekStartDay || 'monday'
}

/**
 * 週の開始日を保存
 */
export function saveWeekStartDay(weekStartDay: 'sunday' | 'monday'): void {
  const data = loadData()
  data.weekStartDay = weekStartDay
  saveData(data)
}

// =====================================
// 時間軸チャート設定
// =====================================

/**
 * 時間軸チャートの表示範囲設定
 */
export interface TimeAxisSettings {
  startHour: number // 表示開始時間（0-23）
  endHour: number // 表示終了時間（1-24）
}

/**
 * 時間軸チャートの表示範囲設定を取得
 */
export function getTimeAxisSettings(): TimeAxisSettings {
  const data = loadData()
  return data.timeAxisSettings || { startHour: 0, endHour: 24 }
}

/**
 * 時間軸チャートの表示範囲設定を保存
 */
export function saveTimeAxisSettings(settings: TimeAxisSettings): void {
  const data = loadData()
  data.timeAxisSettings = settings
  saveData(data)
}

// =====================================
// UIモード設定
// =====================================

/**
 * UIモードを取得
 */
export function getUIMode(): 'desktop' | 'mobile' {
  const data = loadData()
  return data.uiMode || 'desktop'
}

/**
 * UIモードを保存
 */
export function saveUIMode(mode: 'desktop' | 'mobile'): void {
  const data = loadData()
  data.uiMode = mode
  saveData(data)
  window.dispatchEvent(new Event('mytcc2:dataChanged'))
}

