import { useState, useMemo } from 'react'
import { Goal, GoalCategory } from '../types'
import { useTasks } from '../hooks/useTasks'
import MandalaChart from '../components/goals/MandalaChart'

const GOAL_CATEGORIES: { value: GoalCategory; label: string; code: string }[] = [
  { value: 'social-contribution', label: '社会貢献', code: 'SOC' },
  { value: 'family', label: '家族', code: 'FAM' },
  { value: 'relationships', label: '人間関係', code: 'REL' },
  { value: 'hobby', label: '趣味', code: 'HOB' },
  { value: 'work', label: '仕事', code: 'WRK' },
  { value: 'finance', label: 'ファイナンス', code: 'FIN' },
  { value: 'health', label: '健康', code: 'HLT' },
  { value: 'intelligence', label: '知性', code: 'INT' },
  { value: 'other', label: 'その他', code: 'OTH' },
]

export default function Goals() {
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useTasks()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined)
  const [editingPosition, setEditingPosition] = useState<number | undefined>(undefined)
  const [editingCategory, setEditingCategory] = useState<GoalCategory | undefined>(undefined)
  const [showForm, setShowForm] = useState(false)

  const yearGoals = useMemo(() => {
    return goals.filter(g => g.year === selectedYear)
  }, [goals, selectedYear])

  // 利用可能な年のリストを生成（保存されている年 + 現在年から前後5年）
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const savedYears = Array.from(new Set(goals.map(g => g.year))).sort((a, b) => b - a)
    const yearRange = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)
    const allYears = Array.from(new Set([...savedYears, ...yearRange])).sort((a, b) => b - a)
    return allYears
  }, [goals])

  const goalsByCategory = useMemo(() => {
    const result: Record<GoalCategory, { main?: Goal; subs: Goal[] }> = {
      'social-contribution': { subs: [] },
      'family': { subs: [] },
      'relationships': { subs: [] },
      'hobby': { subs: [] },
      'work': { subs: [] },
      'finance': { subs: [] },
      'health': { subs: [] },
      'intelligence': { subs: [] },
      'other': { subs: [] },
    }

    yearGoals.forEach(goal => {
      if (!goal.parentGoalId && !goal.position) {
        result[goal.category].main = goal
      } else if (goal.parentGoalId || goal.position) {
        result[goal.category].subs.push(goal)
      }
    })

    return result
  }, [yearGoals])

  const handleCreateOrUpdate = (goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, goalData)
    } else {
      const newGoalData = {
        ...goalData,
        position: editingPosition,
        parentGoalId: editingPosition !== 0 && editingCategory ? 
          goalsByCategory[editingCategory].main?.id : undefined,
      }
      addGoal(newGoalData)
    }
    setShowForm(false)
    setEditingGoal(undefined)
    setEditingPosition(undefined)
    setEditingCategory(undefined)
  }

  const handleEditMainGoal = (category: GoalCategory) => {
    const mainGoal = goalsByCategory[category].main
    setEditingGoal(mainGoal)
    setEditingPosition(0)
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleEditSubGoal = (category: GoalCategory, position: number) => {
    const subGoal = goalsByCategory[category].subs.find(g => g.position === position)
    setEditingGoal(subGoal)
    setEditingPosition(position)
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('この目標を削除しますか？')) {
      deleteGoal(id)
    }
  }

  const handleToggleComplete = (goalId: string, completed: boolean) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    
    updateGoal(goalId, {
      completedAt: completed ? new Date().toISOString() : undefined,
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingGoal(undefined)
    setEditingPosition(undefined)
    setEditingCategory(undefined)
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
            Annual Goals
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            年間目標
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="font-display text-xs text-[var(--color-text-secondary)]">
              年:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input-industrial px-3 py-1.5 font-display text-xs tracking-wider min-w-[100px]"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="2000"
              max="2100"
              placeholder="年を入力"
              className="input-industrial px-3 py-1.5 font-display text-xs tracking-wider w-24"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const year = Number((e.target as HTMLInputElement).value)
                  if (year >= 2000 && year <= 2100) {
                    setSelectedYear(year)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {showForm ? (
        <GoalForm
          goal={editingGoal}
          year={selectedYear}
          category={editingCategory}
          position={editingPosition}
          onSubmit={handleCreateOrUpdate}
          onCancel={handleCancel}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {GOAL_CATEGORIES.map((category, index) => {
            const { main, subs } = goalsByCategory[category.value]
            
            return (
              <div key={category.value} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <MandalaChart
                  categoryLabel={category.label}
                  categoryIcon={category.code}
                  mainGoal={main}
                  subGoals={subs}
                  onEditMainGoal={() => handleEditMainGoal(category.value)}
                  onEditSubGoal={(position) => handleEditSubGoal(category.value, position)}
                  onDeleteGoal={handleDelete}
                  onToggleComplete={handleToggleComplete}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface GoalFormProps {
  goal?: Goal
  year: number
  category?: GoalCategory
  position?: number
  onSubmit: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

function GoalForm({ goal, year, category, position, onSubmit, onCancel }: GoalFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory>(goal?.category || category || 'social-contribution')
  const [title, setTitle] = useState(goal?.title || '')
  const [description, setDescription] = useState(goal?.description || '')
  const [progress, setProgress] = useState(goal?.progress?.toString() || '')

  const isMainGoal = position === 0 || (!goal?.parentGoalId && !goal?.position)
  const positionLabel = position !== undefined && position > 0 
    ? ['', '左上', '上', '右上', '左', '右', '左下', '下', '右下'][position]
    : ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    onSubmit({
      year,
      category: selectedCategory,
      title: title.trim(),
      description: description.trim() || undefined,
      progress: progress ? Number(progress) : undefined,
      position: position !== undefined ? position : (isMainGoal ? 0 : undefined),
    })
  }

  return (
    <form id="goal-form" onSubmit={handleSubmit} className="card-industrial p-6 animate-scale-in">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
        <div>
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
            {goal ? 'Edit Goal' : 'New Goal'}
          </p>
          <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
            {goal ? '目標を編集' : '新しい目標を作成'}
            {positionLabel && <span className="ml-2 text-sm text-[var(--color-text-tertiary)]">({positionLabel})</span>}
          </h2>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            カテゴリ <span className="text-[var(--color-error)]">*</span>
          </label>
          <select
            name="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as GoalCategory)}
            className="input-industrial w-full"
            required
            disabled={category !== undefined}
          >
            {GOAL_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                [{cat.code}] {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            タイトル <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-industrial w-full"
            placeholder={isMainGoal ? "メイン目標のタイトルを入力" : "細分化された目標のタイトルを入力"}
            required
          />
        </div>

        <div>
          <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            説明
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="input-industrial w-full resize-none"
            placeholder="目標の詳細を入力（任意）"
          />
        </div>

        <div>
          <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
            進捗率 (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className="input-industrial w-full"
            placeholder="0-100"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onCancel}
            className="btn-industrial"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="btn-industrial"
          >
            {goal ? '更新' : '作成'}
          </button>
        </div>
      </div>
    </form>
  )
}
