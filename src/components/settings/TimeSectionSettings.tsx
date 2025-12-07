import { useState, useEffect } from 'react'
import { TimeSectionSettings as TimeSectionSettingsType, TimeSection, Weekday } from '../../types'
import { getTimeSectionSettings, saveTimeSectionSettings } from '../../services/taskService'
import { useNotification } from '../../context/NotificationContext'

const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']
const DEFAULT_COLORS = ['#FFB74D', '#64B5F6', '#81C784', '#9575CD', '#F06292']

export default function TimeSectionSettingsComponent() {
  const { showNotification } = useNotification()
  const [settings, setSettings] = useState<TimeSectionSettingsType>(() => getTimeSectionSettings())
  const [activeWeekday, setActiveWeekday] = useState<Weekday>(1) // 月曜日から開始
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 設定をリロード
  useEffect(() => {
    setSettings(getTimeSectionSettings())
  }, [])

  // 現在選択中の曜日の設定を取得
  const currentDayConfig = settings.dayConfigs.find(dc => dc.weekday === activeWeekday)
  const sections = currentDayConfig?.sections || []

  // 有効/無効を切り替え
  const handleToggleEnabled = () => {
    setSettings(prev => ({
      ...prev,
      enabled: !prev.enabled,
    }))
    setHasChanges(true)
  }

  // セクションを追加
  const handleAddSection = () => {
    if (sections.length >= 5) {
      setError('セクションは最大5つまでです')
      return
    }

    const lastSection = sections[sections.length - 1]
    const newStart = lastSection ? lastSection.end : '06:00'
    const newEnd = lastSection ? (lastSection.end === '24:00' ? '24:00' : incrementTime(lastSection.end, 3)) : '09:00'

    const newSection: TimeSection = {
      id: `section-${activeWeekday}-${Date.now()}`,
      name: '新しいセクション',
      start: newStart,
      end: newEnd,
      color: DEFAULT_COLORS[sections.length % DEFAULT_COLORS.length],
      order: sections.length,
    }

    updateSections([...sections, newSection])
  }

  // セクションを削除
  const handleRemoveSection = (sectionId: string) => {
    if (sections.length <= 2) {
      setError('セクションは最低2つ必要です')
      return
    }

    const newSections = sections
      .filter(s => s.id !== sectionId)
      .map((s, index) => ({ ...s, order: index }))
    
    updateSections(newSections)
  }

  // セクションを更新
  const handleUpdateSection = (sectionId: string, updates: Partial<TimeSection>) => {
    const newSections = sections.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    )
    updateSections(newSections)
  }

  // セクション配列を更新
  const updateSections = (newSections: TimeSection[]) => {
    setSettings(prev => ({
      ...prev,
      dayConfigs: prev.dayConfigs.map(dc =>
        dc.weekday === activeWeekday
          ? { ...dc, sections: newSections }
          : dc
      ),
    }))
    setHasChanges(true)
    setError(null)
  }

  // 他の曜日に設定をコピー
  const handleCopyToOtherDays = () => {
    if (!currentDayConfig) return

    setSettings(prev => ({
      ...prev,
      dayConfigs: prev.dayConfigs.map(dc => ({
        ...dc,
        sections: currentDayConfig.sections.map(s => ({
          ...s,
          id: `${s.id.split('-').slice(0, -1).join('-')}-${dc.weekday}`,
        })),
      })),
    }))
    setHasChanges(true)
    showNotification('すべての曜日に設定をコピーしました', 'success')
  }

  // 保存
  const handleSave = () => {
    try {
      saveTimeSectionSettings(settings)
      setHasChanges(false)
      setError(null)
      showNotification('時間セクション設定を保存しました', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました'
      setError(message)
      showNotification(message, 'error')
    }
  }

  // 時間を増加
  const incrementTime = (time: string, hours: number): string => {
    const [h, m] = time.split(':').map(Number)
    const newH = Math.min(24, h + hours)
    return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  return (
    <div className="card-industrial p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
        <div>
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
            Time Sections
          </p>
          <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
            時間セクション設定
          </h2>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="font-display text-sm text-[var(--color-text-secondary)]">
            {settings.enabled ? '有効' : '無効'}
          </span>
          <div
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.enabled ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-bg-tertiary)]'
            }`}
            onClick={handleToggleEnabled}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </div>
        </label>
      </div>

      {settings.enabled && (
        <>
          {/* 曜日タブ */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
            {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map(weekday => (
              <button
                key={weekday}
                onClick={() => setActiveWeekday(weekday)}
                className={`px-4 py-2 font-display text-sm transition-colors ${
                  activeWeekday === weekday
                    ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                {WEEKDAY_NAMES[weekday]}
              </button>
            ))}
          </div>

          {/* セクション一覧 */}
          <div className="space-y-4 mb-6">
            {sections.map((section) => (
              <div
                key={section.id}
                className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-3"
              >
                <div className="flex items-center gap-4">
                  {/* カラー選択 */}
                  <input
                    type="color"
                    value={section.color || '#64B5F6'}
                    onChange={(e) => handleUpdateSection(section.id, { color: e.target.value })}
                    className="w-8 h-8 cursor-pointer border-0"
                    title="カラーを選択"
                  />

                  {/* セクション名 */}
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => handleUpdateSection(section.id, { name: e.target.value })}
                    className="input-industrial flex-1"
                    placeholder="セクション名"
                  />

                  {/* 削除ボタン */}
                  <button
                    onClick={() => handleRemoveSection(section.id)}
                    disabled={sections.length <= 2}
                    className="p-2 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="削除"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* 時間設定 */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="font-display text-xs text-[var(--color-text-tertiary)]">開始</label>
                    <input
                      type="time"
                      value={section.start}
                      onChange={(e) => handleUpdateSection(section.id, { start: e.target.value })}
                      className="input-industrial w-32"
                    />
                  </div>
                  <span className="text-[var(--color-text-tertiary)]">〜</span>
                  <div className="flex items-center gap-2">
                    <label className="font-display text-xs text-[var(--color-text-tertiary)]">終了</label>
                    <select
                      value={section.end}
                      onChange={(e) => handleUpdateSection(section.id, { end: e.target.value })}
                      className="input-industrial w-32"
                    >
                      {generateTimeOptions().map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* セクション追加ボタン */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleAddSection}
              disabled={sections.length >= 5}
              className="btn-industrial flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              セクションを追加
            </button>
            <button
              onClick={handleCopyToOtherDays}
              className="btn-industrial"
            >
              すべての曜日にコピー
            </button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* 保存ボタン */}
          <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="btn-industrial disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasChanges ? '変更を保存' : '保存済み'}
            </button>
          </div>
        </>
      )}

      {!settings.enabled && (
        <p className="text-[var(--color-text-tertiary)] text-sm">
          時間セクション機能を有効にすると、1日を複数の時間帯（朝、仕事、夜など）に分けて管理できます。
          タスクを時間帯ごとに整理したり、並び替えたりすることができます。
        </p>
      )}
    </div>
  )
}

// 時間オプションを生成（00:00〜24:00、30分刻み）
function generateTimeOptions(): string[] {
  const options: string[] = []
  for (let h = 0; h <= 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 24 && m > 0) break
      options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return options
}

