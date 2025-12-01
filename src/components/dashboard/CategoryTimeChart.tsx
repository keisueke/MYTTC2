import { useMemo } from 'react'
import { Task, Category } from '../../types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface CategoryTimeChartProps {
  tasks: Task[]
  categories: Category[]
  period: 'week' | 'month'
}

// デフォルトカラー（カテゴリーに色が設定されていない場合）
const defaultColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]

/**
 * 秒数を時間表示に変換（HH:MM形式）
 */
function formatHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export default function CategoryTimeChart({ tasks, categories, period }: CategoryTimeChartProps) {
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>()
    categories.forEach(cat => map.set(cat.id, cat))
    return map
  }, [categories])

  // 期間の開始日と終了日を計算
  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    
    if (period === 'week') {
      const start = new Date(now)
      const dayOfWeek = start.getDay() // 0=日曜日, 1=月曜日, ..., 6=土曜日
      // 月曜日を0として計算（月曜日=0, 火曜日=1, ..., 日曜日=6）
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      start.setDate(start.getDate() - daysFromMonday) // 月曜日に設定
      start.setHours(0, 0, 0, 0)
      return { startDate: start, endDate: end }
    } else {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      start.setHours(0, 0, 0, 0)
      return { startDate: start, endDate: end }
    }
  }, [period])

  // 週間の場合：日別×カテゴリー別の作業時間を集計
  // 月間の場合：カテゴリー別の作業時間を集計
  const dailyCategoryTimes = useMemo(() => {
    if (period === 'month') {
      // 月間の場合は従来通りカテゴリー別のみ
      return null
    }
    
    // 週間の場合：日別×カテゴリー別に集計
    const dailyTimes = new Map<string, Map<string, number>>() // 日付 -> カテゴリー -> 時間
    
    // 完了したタスクで、期間内に完了したものを集計
    const completedTasks = tasks.filter(task => {
      if (!task.completed || !task.endTime) return false
      const endTime = new Date(task.endTime)
      return endTime >= startDate && endTime <= endDate
    })
    
    completedTasks.forEach(task => {
      if (!task.endTime) return
      const endTime = new Date(task.endTime)
      const dateKey = format(endTime, 'yyyy-MM-dd')
      const categoryId = task.categoryId || 'uncategorized'
      const elapsed = task.elapsedTime || 0
      
      if (!dailyTimes.has(dateKey)) {
        dailyTimes.set(dateKey, new Map())
      }
      const dayMap = dailyTimes.get(dateKey)!
      dayMap.set(categoryId, (dayMap.get(categoryId) || 0) + elapsed)
    })
    
    return dailyTimes
  }, [tasks, startDate, endDate, period])

  // カテゴリー別の作業時間を集計（月間用）
  const categoryTimes = useMemo(() => {
    if (period === 'week') {
      return null
    }
    
    const times = new Map<string, number>()
    
    // 完了したタスクで、期間内に完了したものを集計
    const completedTasks = tasks.filter(task => {
      if (!task.completed || !task.endTime) return false
      const endTime = new Date(task.endTime)
      return endTime >= startDate && endTime <= endDate
    })
    
    completedTasks.forEach(task => {
      const categoryId = task.categoryId || 'uncategorized'
      const elapsed = task.elapsedTime || 0
      times.set(categoryId, (times.get(categoryId) || 0) + elapsed)
    })
    
    return times
  }, [tasks, startDate, endDate, period])

  // 週間用：日別データを準備
  const weeklyChartData = useMemo(() => {
    if (!dailyCategoryTimes) return null
    
    // 週の各日を生成（月曜日から日曜日）
    const days: Array<{ date: Date; dateKey: string; label: string }> = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = format(date, 'yyyy-MM-dd')
      const label = format(date, 'M/d(E)', { locale: ja })
      days.push({ date, dateKey, label })
    }
    
    // 全カテゴリーを取得
    const allCategories = new Set<string>()
    dailyCategoryTimes.forEach(dayMap => {
      dayMap.forEach((_, categoryId) => allCategories.add(categoryId))
    })
    
    // カテゴリー情報を取得
    const categoryInfo = new Map<string, { name: string; color: string }>()
    allCategories.forEach(categoryId => {
      const category = categoryId === 'uncategorized'
        ? { id: 'uncategorized', name: 'カテゴリなし', color: undefined }
        : categoryMap.get(categoryId)
      categoryInfo.set(categoryId, {
        name: category?.name || '不明',
        color: category?.color || defaultColors[parseInt(categoryId, 36) % defaultColors.length],
      })
    })
    
    // 各日のデータを準備
    return days.map(day => {
      const dayMap = dailyCategoryTimes.get(day.dateKey) || new Map()
      const dayTotal = Array.from(dayMap.values()).reduce((sum, time) => sum + time, 0)
      
      // カテゴリー別のデータを配列に変換
      const categories = Array.from(dayMap.entries())
        .map(([categoryId, time]) => ({
          categoryId,
          categoryName: categoryInfo.get(categoryId)?.name || '不明',
          color: categoryInfo.get(categoryId)?.color || '#999',
          time,
        }))
        .sort((a, b) => b.time - a.time) // 時間の多い順にソート
      
      return {
        ...day,
        total: dayTotal,
        categories,
      }
    })
  }, [dailyCategoryTimes, startDate, categoryMap])

  // 月間用：カテゴリー情報と時間を結合してソート
  const monthlyChartData = useMemo(() => {
    if (!categoryTimes) return null
    
    const data = Array.from(categoryTimes.entries())
      .map(([categoryId, time]) => {
        const category = categoryId === 'uncategorized' 
          ? { id: 'uncategorized', name: 'カテゴリなし', color: undefined }
          : categoryMap.get(categoryId)
        
        return {
          categoryId,
          categoryName: category?.name || '不明',
          color: category?.color || defaultColors[parseInt(categoryId, 36) % defaultColors.length],
          time,
        }
      })
      .sort((a, b) => b.time - a.time) // 時間の多い順にソート
    
    return data
  }, [categoryTimes, categoryMap])

  // 最大時間を取得（週間用：各日の最大値、月間用：合計時間）
  const maxTime = useMemo(() => {
    if (period === 'week' && weeklyChartData) {
      return Math.max(...weeklyChartData.map(d => d.total), 1)
    } else if (period === 'month' && monthlyChartData) {
      return monthlyChartData.reduce((sum, d) => sum + d.time, 0) || 1
    }
    return 1
  }, [period, weeklyChartData, monthlyChartData])

  // 日付範囲の文字列を生成（空の場合も表示）
  const dateRange = useMemo(() => {
    if (period === 'week') {
      return `${format(startDate, 'yyyy年M月d日', { locale: ja })} 〜 ${format(endDate, 'M月d日', { locale: ja })}`
    } else {
      return `${format(startDate, 'yyyy年M月d日', { locale: ja })} 〜 ${format(endDate, 'M月d日', { locale: ja })}`
    }
  }, [startDate, endDate, period])

  const hasData = period === 'week' 
    ? (weeklyChartData && weeklyChartData.some(d => d.total > 0))
    : (monthlyChartData && monthlyChartData.length > 0)

  if (!hasData) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm font-medium mb-2">
          {period === 'week' ? '週間' : '月間'}作業時間
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          {dateRange}
        </p>
        <p className="text-sm">
          作業時間データがありません
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {period === 'week' ? '週間' : '月間'}作業時間
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {dateRange}
          </p>
        </div>
      </div>
      
      {period === 'week' && weeklyChartData ? (
        <>
          {/* 週間：日別積み上げ棒グラフ */}
          <div className="relative h-64 w-full">
            {/* 背景グリッド */}
            <div className="absolute inset-0 flex items-end">
              <div className="w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"></div>
            </div>
            
            {/* 日別の棒グラフ */}
            <div className="relative h-full flex items-end gap-2 px-2">
              {weeklyChartData.map((day) => {
                const dayHeightPercentage = maxTime > 0 ? (day.total / maxTime) * 100 : 0
                
                return (
                  <div key={day.dateKey} className="flex-1 flex flex-col items-center gap-1 h-full">
                    {/* 日別の積み上げバー */}
                    <div className="relative w-full flex flex-col justify-end" style={{ height: `${dayHeightPercentage}%` }}>
                      {day.categories.map((category, index) => {
                        const categoryPercentage = day.total > 0 ? (category.time / day.total) * 100 : 0
                        const previousPercentage = day.categories
                          .slice(0, index)
                          .reduce((sum, c) => sum + (day.total > 0 ? (c.time / day.total) * 100 : 0), 0)
                        
                        return (
                          <div
                            key={category.categoryId}
                            className="absolute left-0 right-0 transition-all duration-500 ease-out rounded-t"
                            style={{
                              bottom: `${previousPercentage}%`,
                              height: `${categoryPercentage}%`,
                              backgroundColor: category.color,
                              opacity: 0.85,
                              borderTop: index > 0 ? '1px solid rgba(255,255,255,0.3)' : 'none',
                            }}
                          />
                        )
                      })}
                    </div>
                    
                    {/* 日付ラベル */}
                    <div className="text-center mt-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {day.label}
                      </div>
                      {day.total > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatHours(day.total)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* 凡例（全カテゴリー） */}
          {(() => {
            const allCategories = new Set<string>()
            weeklyChartData.forEach(day => {
              day.categories.forEach(c => allCategories.add(c.categoryId))
            })
            
            const categoryInfo = new Map<string, { name: string; color: string }>()
            allCategories.forEach(categoryId => {
              const category = categoryId === 'uncategorized'
                ? { id: 'uncategorized', name: 'カテゴリなし', color: undefined }
                : categoryMap.get(categoryId)
              categoryInfo.set(categoryId, {
                name: category?.name || '不明',
                color: category?.color || defaultColors[parseInt(categoryId, 36) % defaultColors.length],
              })
            })
            
            return (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {Array.from(categoryInfo.entries()).map(([categoryId, info]) => (
                  <div key={categoryId} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: info.color }}
                    ></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {info.name}
                    </span>
                  </div>
                ))}
              </div>
            )
          })()}
        </>
      ) : (
        <>
          {/* 月間：カテゴリー別積み上げ棒グラフ */}
          <div className="relative h-64 w-full">
            {/* 背景グリッド */}
            <div className="absolute inset-0 flex items-end">
              <div className="w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"></div>
            </div>
            
            {/* 積み上げバー */}
            <div className="relative h-full flex items-end">
              <div className="w-full h-full flex flex-col justify-end">
                {monthlyChartData && monthlyChartData.length > 0 && (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    {monthlyChartData.map((data, index) => {
                      const totalTime = monthlyChartData.reduce((sum, d) => sum + d.time, 0)
                      const percentage = totalTime > 0 ? (data.time / totalTime) * 100 : 0
                      // 前のカテゴリーまでの累積割合を計算
                      const previousPercentage = monthlyChartData
                        .slice(0, index)
                        .reduce((sum, d) => sum + (totalTime > 0 ? (d.time / totalTime) * 100 : 0), 0)
                      
                      return (
                        <div
                          key={data.categoryId}
                          className="absolute left-0 right-0 transition-all duration-500 ease-out"
                          style={{
                            bottom: `${previousPercentage}%`,
                            height: `${percentage}%`,
                            backgroundColor: data.color,
                            opacity: 0.85,
                            borderTop: index > 0 ? '2px solid rgba(255,255,255,0.3)' : 'none',
                          }}
                        >
                          {/* セグメント内の時間表示 */}
                          {data.time > 0 && percentage > 5 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span
                                className="text-xs font-semibold whitespace-nowrap px-2 py-1 rounded"
                                style={{
                                  color: data.color,
                                  backgroundColor: 'rgba(255,255,255,0.9)',
                                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                }}
                              >
                                {formatHours(data.time)}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* 合計時間表示（バーの上） */}
            {monthlyChartData && monthlyChartData.reduce((sum, d) => sum + d.time, 0) > 0 && (
              <div className="absolute -top-8 left-0 right-0 text-center">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  合計: {formatHours(monthlyChartData.reduce((sum, d) => sum + d.time, 0))}
                </span>
              </div>
            )}
          </div>
          
          {/* 凡例 */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {monthlyChartData?.map((data) => (
              <div key={data.categoryId} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: data.color }}
                ></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {data.categoryName}: {formatHours(data.time)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

