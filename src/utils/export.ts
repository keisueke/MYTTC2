import { Task, Project, Mode, Tag } from '../types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * タスクをMarkdown形式に変換
 */
export function tasksToMarkdown(tasks: Task[], projects: Project[], modes: Mode[], tags: Tag[]): string {
  const projectMap = new Map(projects.map(p => [p.id, p.name]))
  const modeMap = new Map(modes.map(m => [m.id, m.name]))
  const tagMap = new Map(tags.map(t => [t.id, t.name]))
  
  let markdown = '# タスク一覧\n\n'
  markdown += `エクスポート日時: ${format(new Date(), 'yyyy年MM月dd日 HH:mm', { locale: ja })}\n\n`
  markdown += `## 統計\n\n`
  markdown += `- 全タスク数: ${tasks.length}\n\n`
  
  if (tasks.length > 0) {
    markdown += `## タスク一覧\n\n`
    tasks.forEach((task, index) => {
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
export function exportTasks(tasks: Task[], projects: Project[], modes: Mode[], tags: Tag[]): void {
  const markdown = tasksToMarkdown(tasks, projects, modes, tags)
  const filename = `tasks_${format(new Date(), 'yyyyMMdd_HHmmss')}.md`
  downloadMarkdown(markdown, filename)
}

