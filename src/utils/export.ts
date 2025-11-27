import { Task, Category } from '../types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const priorityLabels = {
  low: '低',
  medium: '中',
  high: '高',
}

/**
 * タスクをMarkdown形式に変換
 */
export function tasksToMarkdown(tasks: Task[], categories: Category[]): string {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]))
  
  const completedTasks = tasks.filter(t => t.completed)
  const activeTasks = tasks.filter(t => !t.completed)
  
  let markdown = '# タスク一覧\n\n'
  markdown += `エクスポート日時: ${format(new Date(), 'yyyy年MM月dd日 HH:mm', { locale: ja })}\n\n`
  markdown += `## 統計\n\n`
  markdown += `- 全タスク数: ${tasks.length}\n`
  markdown += `- 未完了: ${activeTasks.length}\n`
  markdown += `- 完了: ${completedTasks.length}\n\n`
  
  if (activeTasks.length > 0) {
    markdown += `## 未完了タスク\n\n`
    activeTasks.forEach((task, index) => {
      markdown += `### ${index + 1}. ${task.title}\n\n`
      if (task.description) {
        markdown += `${task.description}\n\n`
      }
      markdown += `- **優先度**: ${priorityLabels[task.priority]}\n`
      if (task.categoryId && categoryMap.has(task.categoryId)) {
        markdown += `- **カテゴリ**: ${categoryMap.get(task.categoryId)}\n`
      }
      if (task.dueDate) {
        markdown += `- **期限**: ${format(new Date(task.dueDate), 'yyyy年MM月dd日', { locale: ja })}\n`
      }
      if (task.repeatPattern !== 'none') {
        markdown += `- **繰り返し**: ${task.repeatPattern}\n`
      }
      markdown += `- **作成日**: ${format(new Date(task.createdAt), 'yyyy年MM月dd日', { locale: ja })}\n\n`
    })
  }
  
  if (completedTasks.length > 0) {
    markdown += `## 完了タスク\n\n`
    completedTasks.forEach((task, index) => {
      markdown += `### ${index + 1}. ~~${task.title}~~\n\n`
      if (task.description) {
        markdown += `${task.description}\n\n`
      }
      markdown += `- **完了日**: ${format(new Date(task.updatedAt), 'yyyy年MM月dd日', { locale: ja })}\n\n`
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
export function exportTasks(tasks: Task[], categories: Category[]): void {
  const markdown = tasksToMarkdown(tasks, categories)
  const filename = `tasks_${format(new Date(), 'yyyyMMdd_HHmmss')}.md`
  downloadMarkdown(markdown, filename)
}

