import { Task, Project, Mode, Tag } from '../types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getWeatherData, getWeatherDescriptionFromCode } from '../services/weatherService'
import { getDailyRecord, getSummaryConfig, getWeatherConfig } from '../services/taskService'
import { getReflectionByDate } from '../services/reflectionService'

/**
 * タスクをMarkdown形式に変換
 */
export function tasksToMarkdown(tasks: Task[], projects: Project[], modes: Mode[], tags: Tag[], targetDate?: Date): string {
  const projectMap = new Map(projects.map(p => [p.id, p.name]))
  const modeMap = new Map(modes.map(m => [m.id, m.name]))
  const tagMap = new Map(tags.map(t => [t.id, t.name]))
  
  // 指定日がある場合、その日のタスクをフィルタリング
  let filteredTasks = tasks
  if (targetDate) {
    const date = new Date(targetDate)
    date.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)
    
    filteredTasks = tasks.filter(task => {
      if (!task.startTime) return false
      const startDate = new Date(task.startTime)
      return startDate >= date && startDate <= dateEnd
    })
  }
  
  let markdown = '# タスク一覧\n\n'
  const exportDate = targetDate || new Date()
  markdown += `エクスポート日時: ${format(exportDate, 'yyyy年MM月dd日 HH:mm', { locale: ja })}\n\n`
  
  // 指定日の健康データを取得
  const summaryConfig = getSummaryConfig()
  const todayRecord = getDailyRecord(exportDate)
  if (todayRecord && Object.keys(summaryConfig).some(key => summaryConfig[key as keyof typeof summaryConfig])) {
    markdown += `## 健康データ\n`
    
    if (summaryConfig.includeWeight && todayRecord.weight !== undefined) {
      markdown += `- 体重: ${todayRecord.weight} kg\n`
    }
    
    if (summaryConfig.includeBedtime && todayRecord.bedtime) {
      markdown += `- 就寝時間: ${todayRecord.bedtime}\n`
    }
    
    if (summaryConfig.includeWakeTime && todayRecord.wakeTime) {
      markdown += `- 起床時間: ${todayRecord.wakeTime}\n`
    }
    
    if (summaryConfig.includeSleepDuration && todayRecord.sleepDuration !== undefined) {
      const hours = Math.floor(todayRecord.sleepDuration / 60)
      const minutes = todayRecord.sleepDuration % 60
      markdown += `- 睡眠時間: ${hours}時間${minutes}分\n`
    }
    
    if (summaryConfig.includeBreakfast && todayRecord.breakfast) {
      markdown += `- 朝食: ${todayRecord.breakfast}\n`
    }
    
    if (summaryConfig.includeLunch && todayRecord.lunch) {
      markdown += `- 昼食: ${todayRecord.lunch}\n`
    }
    
    if (summaryConfig.includeDinner && todayRecord.dinner) {
      markdown += `- 夕食: ${todayRecord.dinner}\n`
    }
    
    if (summaryConfig.includeSnack && todayRecord.snack) {
      markdown += `- 間食: ${todayRecord.snack}\n`
    }
    
    markdown += `\n`
  }
  
  markdown += `## 統計\n\n`
  markdown += `- 全タスク数: ${filteredTasks.length}\n\n`
  
  if (filteredTasks.length > 0) {
    markdown += `## タスク一覧\n\n`
    filteredTasks.forEach((task, index) => {
      markdown += `### ${index + 1}. ${task.title}\n\n`
      if (task.description) {
        markdown += `${task.description}\n\n`
      }
      if (task.projectId && projectMap.has(task.projectId)) {
        markdown += `- **プロジェクト**: ${projectMap.get(task.projectId)}\n`
      }
      if (task.modeId && modeMap.has(task.modeId)) {
        markdown += `- **モード**: ${modeMap.get(task.modeId)}\n`
      }
      if (task.tagIds && task.tagIds.length > 0) {
        const tagNames = task.tagIds.map(id => tagMap.get(id)).filter(Boolean).join(', ')
        if (tagNames) {
          markdown += `- **タグ**: ${tagNames}\n`
        }
      }
      if (task.repeatPattern !== 'none') {
        markdown += `- **繰り返し**: ${task.repeatPattern}\n`
      }
      if (task.startTime) {
        markdown += `- **開始時間**: ${format(new Date(task.startTime), 'yyyy年MM月dd日 HH:mm', { locale: ja })}\n`
      }
      if (task.endTime) {
        markdown += `- **終了時間**: ${format(new Date(task.endTime), 'yyyy年MM月dd日 HH:mm', { locale: ja })}\n`
      }
      if (task.elapsedTime) {
        const hours = Math.floor(task.elapsedTime / 3600)
        const minutes = Math.floor((task.elapsedTime % 3600) / 60)
        markdown += `- **経過時間**: ${hours}時間${minutes}分\n`
      }
      markdown += `- **作成日**: ${format(new Date(task.createdAt), 'yyyy年MM月dd日', { locale: ja })}\n\n`
    })
  }
  
  return markdown
}

/**
 * Markdownファイルをダウンロード
 */
export function downloadMarkdown(content: string, filename: string = 'tasks.md'): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * タスクをエクスポート
 */
export function exportTasks(tasks: Task[], projects: Project[], modes: Mode[], tags: Tag[], targetDate?: Date): void {
  const markdown = tasksToMarkdown(tasks, projects, modes, tags, targetDate)
  const dateStr = targetDate 
    ? format(targetDate, 'yyyyMMdd', { locale: ja })
    : format(new Date(), 'yyyyMMdd_HHmmss', { locale: ja })
  const filename = `tasks_${dateStr}.md`
  downloadMarkdown(markdown, filename)
}

/**
 * 秒をHH:MM:SS形式に変換
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 分をHH:MM:SS形式に変換
 */
function formatTimeFromMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`
}

/**
 * 指定日のまとめを生成
 */
export async function generateTodaySummary(
  tasks: Task[],
  projects: Project[],
  modes: Mode[],
  tags: Tag[],
  targetDate?: Date
): Promise<string> {
  const date = targetDate || new Date()
  const today = new Date(date)
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  // 今日作業したタスクをフィルタリング（startTimeが今日）
  const todayTasks = tasks.filter(task => {
    if (!task.startTime) return false
    const startDate = new Date(task.startTime)
    return startDate >= today && startDate <= todayEnd
  })

  // 開始時間順にソート
  todayTasks.sort((a, b) => {
    if (!a.startTime || !b.startTime) return 0
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  })

  const projectMap = new Map(projects.map(p => [p.id, p.name]))
  const modeMap = new Map(modes.map(m => [m.id, m.name]))
  const tagMap = new Map(tags.map(t => [t.id, t.name]))

  // 天気情報を取得
  let weatherInfo = ''
  try {
    const weatherData = await getWeatherData()
    const weatherConfig = getWeatherConfig()
    if (weatherData) {
      const weatherDescription = getWeatherDescriptionFromCode(weatherData.weatherCode)
      weatherInfo = `## 天気\n- 天気: ${weatherDescription}\n`
      weatherInfo += `- 気温: ${weatherData.temperature}°C (最高 ${weatherData.maxTemperature}°C / 最低 ${weatherData.minTemperature}°C)\n`
      weatherInfo += `- 気圧: ${weatherData.pressure} hPa\n`
      weatherInfo += `- 湿度: ${Math.round(weatherData.humidity)}%\n`
      weatherInfo += `- 場所: ${weatherConfig.cityName}\n`
    }
  } catch (error) {
    console.error('Failed to fetch weather data:', error)
    weatherInfo = `## 天気\n\n天気情報の取得に失敗しました\n`
  }

  // 健康データを取得
  const summaryConfig = getSummaryConfig()
  const todayRecord = getDailyRecord(date)
  let healthInfo = ''
  
    if (todayRecord && Object.keys(summaryConfig).some(key => summaryConfig[key as keyof typeof summaryConfig])) {
    healthInfo = `## 健康データ\n`
    if (summaryConfig.includeWeight && todayRecord.weight !== undefined) {
      healthInfo += `- 体重: ${todayRecord.weight} kg\n`
    }
    
    if (summaryConfig.includeBedtime && todayRecord.bedtime) {
      healthInfo += `- 就寝時間: ${todayRecord.bedtime}\n`
    }
    
    if (summaryConfig.includeWakeTime && todayRecord.wakeTime) {
      healthInfo += `- 起床時間: ${todayRecord.wakeTime}\n`
    }
    
    if (summaryConfig.includeSleepDuration && todayRecord.sleepDuration !== undefined) {
      const hours = Math.floor(todayRecord.sleepDuration / 60)
      const minutes = todayRecord.sleepDuration % 60
      healthInfo += `- 睡眠時間: ${hours}時間${minutes}分\n`
    }
    
    if (summaryConfig.includeBreakfast && todayRecord.breakfast) {
      healthInfo += `- 朝食: ${todayRecord.breakfast}\n`
    }
    
    if (summaryConfig.includeLunch && todayRecord.lunch) {
      healthInfo += `- 昼食: ${todayRecord.lunch}\n`
    }
    
    if (summaryConfig.includeDinner && todayRecord.dinner) {
      healthInfo += `- 夕食: ${todayRecord.dinner}\n`
    }
    
    if (summaryConfig.includeSnack && todayRecord.snack) {
      healthInfo += `- 間食: ${todayRecord.snack}\n`
    }
  }

  // 集計データを計算
  const totalElapsedTime = todayTasks.reduce((sum, task) => sum + (task.elapsedTime || 0), 0)
  const totalEstimatedTime = todayTasks.reduce((sum, task) => sum + ((task.estimatedTime || 0) * 60), 0) // 分を秒に変換

  // プロジェクト別集計
  const projectTimes = new Map<string, { time: number; count: number }>()
  todayTasks.forEach(task => {
    const projectName = task.projectId && projectMap.has(task.projectId) 
      ? projectMap.get(task.projectId)! 
      : 'プロジェクトなし'
    const elapsed = task.elapsedTime || 0
    const current = projectTimes.get(projectName) || { time: 0, count: 0 }
    projectTimes.set(projectName, {
      time: current.time + elapsed,
      count: current.count + 1
    })
  })

  // モード別集計
  const modeTimes = new Map<string, { time: number; count: number }>()
  todayTasks.forEach(task => {
    if (task.modeId && modeMap.has(task.modeId)) {
      const modeName = modeMap.get(task.modeId)!
      const elapsed = task.elapsedTime || 0
      const current = modeTimes.get(modeName) || { time: 0, count: 0 }
      modeTimes.set(modeName, {
        time: current.time + elapsed,
        count: current.count + 1
      })
    }
  })

  // Markdownを生成
  let markdown = weatherInfo
  if (healthInfo) {
    markdown += healthInfo
  }
  // タスクデータ概要
  markdown += `## タスクデータ概要\n- 総タスク数: ${todayTasks.length}\n`
  markdown += `- 総実績時間: ${formatTime(totalElapsedTime)}\n`
  markdown += `- 総見積時間: ${formatTime(totalEstimatedTime)}\n`
  // プロジェクト別集計
  if (projectTimes.size > 0) {
    const sortedProjects = Array.from(projectTimes.entries()).sort((a, b) => b[1].time - a[1].time)
    markdown += `### プロジェクト別集計\n`
    sortedProjects.forEach(([projectName, data]) => {
      markdown += `- ${projectName}: ${formatTime(data.time)} (${data.count}タスク)\n`
    })
  }
  // モード別集計
  if (modeTimes.size > 0) {
    const sortedModes = Array.from(modeTimes.entries()).sort((a, b) => b[1].time - a[1].time)
    markdown += `### モード別集計\n`
    sortedModes.forEach(([modeName, data]) => {
      markdown += `- ${modeName}: ${formatTime(data.time)} (${data.count}タスク)\n`
    })
  }
  // タスク詳細
  markdown += `## タスク詳細\n`
  if (todayTasks.length === 0) {
    const dateStr = format(date, 'yyyy年MM月dd日', { locale: ja })
    markdown += `${dateStr}に作業したタスクはありません。\n\n`
  } else {
    todayTasks.forEach((task, index) => {
      markdown += `### ${index + 1}. ${task.title}\n`
      // 時間
      if (task.startTime && task.endTime) {
        const startTime = format(new Date(task.startTime), 'HH:mm', { locale: ja })
        const endTime = format(new Date(task.endTime), 'HH:mm', { locale: ja })
        markdown += `- 時間: ${startTime} - ${endTime}\n`
      }

      // 実績時間と見積時間
      if (task.elapsedTime) {
        const elapsedStr = formatTime(task.elapsedTime)
        if (task.estimatedTime) {
          const estimatedStr = formatTimeFromMinutes(task.estimatedTime)
          markdown += `- 実績時間: ${elapsedStr} (見積: ${estimatedStr})\n`
        } else {
          markdown += `- 実績時間: ${elapsedStr}\n`
        }
      } else if (task.estimatedTime) {
        const estimatedStr = formatTimeFromMinutes(task.estimatedTime)
        markdown += `- 見積時間: ${estimatedStr}\n`
      }

      // モード
      if (task.modeId && modeMap.has(task.modeId)) {
        markdown += `- モード: ${modeMap.get(task.modeId)}\n`
      }

      // タグ
      if (task.tagIds && task.tagIds.length > 0) {
        const tagNames = task.tagIds.map(id => tagMap.get(id)).filter(Boolean).join(', ')
        if (tagNames) {
          markdown += `- タグ: ${tagNames}\n`
        }
      }

      // ルーチン
      if (task.repeatPattern !== 'none') {
        markdown += `- ルーチン: ${task.title}\n`
      }

      markdown += `\n`
    })
  }
  // AI振り返りを取得
  const dateStr = format(date, 'yyyy-MM-dd', { locale: ja })
  const reflection = getReflectionByDate(dateStr)

  if (reflection) {
    markdown += `## AI振り返り\n### 要約\n${reflection.summary}\n`
    if (reflection.insights && reflection.insights.length > 0) {
      markdown += `### インサイト\n`
      reflection.insights.forEach(insight => {
        markdown += `- ${insight}\n`
      })
      markdown += `\n`
    }
    if (reflection.suggestions && reflection.suggestions.length > 0) {
      markdown += `### 改善提案\n`
      reflection.suggestions.forEach(suggestion => {
        markdown += `- ${suggestion}\n`
      })
      markdown += `\n`
    }
  }

  return markdown
}

/**
 * テキストをクリップボードにコピー
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    // フォールバック: 古い方法を試す
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError)
      return false
    }
  }
}

