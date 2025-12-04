import { useParams, useNavigate } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'
import { GoalCategory } from '../types'

const GOAL_CATEGORIES: Record<GoalCategory, { label: string; code: string }> = {
  'social-contribution': { label: '社会貢献', code: 'SOC' },
  'family': { label: '家族', code: 'FAM' },
  'relationships': { label: '人間関係', code: 'REL' },
  'hobby': { label: '趣味', code: 'HOB' },
  'work': { label: '仕事', code: 'WRK' },
  'finance': { label: 'ファイナンス', code: 'FIN' },
  'health': { label: '健康', code: 'HLT' },
  'intelligence': { label: '知性', code: 'INT' },
  'other': { label: 'その他', code: 'OTH' },
}

export default function GoalDetail() {
  const { category } = useParams<{ category: GoalCategory }>()
  const navigate = useNavigate()
  const { goals, tasks, subTasks, loading } = useTasks()

  if (!category || !GOAL_CATEGORIES[category]) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-display text-sm text-[var(--color-text-tertiary)]">
          無効なカテゴリーです
        </p>
      </div>
    )
  }

  const categoryInfo = GOAL_CATEGORIES[category]
  const currentYear = new Date().getFullYear()

  // 選択されたカテゴリーの目標を取得（現在年）
  const categoryGoals = goals.filter(
    goal => goal.category === category && goal.year === currentYear
  )

  // 目標に関連するタスクを取得
  const relatedTasks = tasks.filter(task => {
    if (!task.goalId) return false
    return categoryGoals.some(goal => goal.id === task.goalId)
  })

  // 各タスクに関連する詳細タスクを取得
  const tasksWithSubTasks = relatedTasks.map(task => {
    const taskSubTasks = subTasks.filter(st => st.taskId === task.id)
    return {
      task,
      subTasks: taskSubTasks,
    }
  })

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
            Goal Detail
          </p>
          <div className="flex items-center gap-3">
            <span className="font-display text-xs tracking-[0.1em] text-[var(--color-accent)]">
              [{categoryInfo.code}]
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              {categoryInfo.label}
            </h1>
          </div>
        </div>
        <button
          onClick={() => navigate('/goals')}
          className="btn-industrial"
        >
          戻る
        </button>
      </div>

      {tasksWithSubTasks.length === 0 ? (
        <div className="card-industrial p-8 text-center">
          <p className="font-display text-sm text-[var(--color-text-tertiary)]">
            このカテゴリーに関連するタスクはありません
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {tasksWithSubTasks.map(({ task, subTasks }) => {
            const relatedGoal = categoryGoals.find(g => g.id === task.goalId)
            
            return (
              <div key={task.id} className="card-industrial p-6">
                {/* タスクヘッダー */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {task.completedAt && (
                        <svg className="w-5 h-5 text-[var(--color-secondary)]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <h3 className={`font-display text-lg font-semibold ${
                        task.completedAt ? 'text-[var(--color-text-tertiary)] line-through' : 'text-[var(--color-text-primary)]'
                      }`}>
                        {task.title}
                      </h3>
                    </div>
                    {relatedGoal && (
                      <p className="font-display text-xs text-[var(--color-text-secondary)]">
                        関連目標: {relatedGoal.title}
                      </p>
                    )}
                    {task.description && (
                      <p className="font-display text-sm text-[var(--color-text-secondary)] mt-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* 詳細タスク */}
                {subTasks.length > 0 ? (
                  <div className="space-y-2">
                    <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-3">
                      詳細タスク
                    </p>
                    {subTasks
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((subTask) => (
                        <div
                          key={subTask.id}
                          className="p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex items-start gap-3"
                        >
                          {subTask.completedAt ? (
                            <svg className="w-4 h-4 text-[var(--color-secondary)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <div className="w-4 h-4 border-2 border-[var(--color-border)] rounded-full flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-display text-sm ${
                              subTask.completedAt 
                                ? 'text-[var(--color-text-tertiary)] line-through' 
                                : 'text-[var(--color-text-primary)]'
                            }`}>
                              {subTask.title}
                            </h4>
                            {subTask.description && (
                              <p className="font-display text-xs text-[var(--color-text-secondary)] mt-1">
                                {subTask.description}
                              </p>
                            )}
                            {subTask.completedAt && (
                              <p className="font-display text-[10px] text-[var(--color-text-tertiary)] mt-1">
                                完了日: {new Date(subTask.completedAt).toLocaleDateString('ja-JP', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="font-display text-xs text-[var(--color-text-tertiary)]">
                    詳細タスクはありません
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

