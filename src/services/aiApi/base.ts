import { Task, DailyRecord, Project, Mode, Tag } from '../../types'

/**
 * AI APIプロバイダーの共通インターフェース
 */
export interface AIApiProvider {
  /**
   * APIキーを検証
   */
  validateApiKey(apiKey: string, model?: string): Promise<boolean>

  /**
   * 日次振り返りを生成
   */
  generateReflection(
    apiKey: string,
    tasks: Task[],
    dailyRecords?: DailyRecord[],
    projects?: Project[],
    modes?: Mode[],
    tags?: Tag[],
    model?: string
  ): Promise<{
    summary: string
    insights: string[]
    suggestions: string[]
  }>
}

/**
 * 共通のプロンプトを生成
 */
export function buildReflectionPrompt(
  tasks: Task[],
  dailyRecords?: DailyRecord[],
  projects?: Project[],
  modes?: Mode[],
  tags?: Tag[]
): string {
  const today = new Date().toISOString().split('T')[0]
  
  // 今日のタスクをフィルタ
  const todayTasks = tasks.filter(task => {
    if (task.completedAt) {
      return task.completedAt.startsWith(today)
    }
    if (task.createdAt) {
      return task.createdAt.startsWith(today)
    }
    return false
  })

  const completedTasks = todayTasks.filter(task => task.completedAt)
  const incompleteTasks = todayTasks.filter(task => !task.completedAt)

  // プロジェクト/モード/タグのマップを作成
  const projectMap = new Map(projects?.map(p => [p.id, p]) || [])
  const modeMap = new Map(modes?.map(m => [m.id, m]) || [])
  const tagMap = new Map(tags?.map(t => [t.id, t]) || [])

  // タスクデータを構造化（プロジェクト/モード/タグ情報を含む）
  const taskData = {
    total: todayTasks.length,
    completed: completedTasks.length,
    incomplete: incompleteTasks.length,
    completedTasks: completedTasks.map(task => {
      const project = task.projectId ? projectMap.get(task.projectId) : null
      const mode = task.modeId ? modeMap.get(task.modeId) : null
      const taskTags = task.tagIds?.map(id => tagMap.get(id)).filter(Boolean) || []
      const timeDiff = task.estimatedTime && task.elapsedTime 
        ? Math.floor(task.elapsedTime / 60) - task.estimatedTime 
        : null
      
      return {
        title: task.title,
        project: project?.name || null,
        mode: mode?.name || null,
        tags: taskTags.map(t => t!.name),
        elapsedTime: task.elapsedTime ? Math.floor(task.elapsedTime / 60) : null,
        estimatedTime: task.estimatedTime,
        timeDiff: timeDiff, // 予定時間との差分（分）
        timeEfficiency: task.estimatedTime && task.elapsedTime 
          ? Math.round((task.estimatedTime / Math.floor(task.elapsedTime / 60)) * 100) 
          : null, // 時間効率（%）
      }
    }),
    incompleteTasks: incompleteTasks.map(task => {
      const project = task.projectId ? projectMap.get(task.projectId) : null
      const mode = task.modeId ? modeMap.get(task.modeId) : null
      const taskTags = task.tagIds?.map(id => tagMap.get(id)).filter(Boolean) || []
      
      return {
        title: task.title,
        project: project?.name || null,
        mode: mode?.name || null,
        tags: taskTags.map(t => t!.name),
        estimatedTime: task.estimatedTime,
      }
    }),
  }

  // カテゴリー別の集計
  const projectStats = new Map<string, { completed: number; total: number; time: number }>()
  const modeStats = new Map<string, { completed: number; total: number; time: number }>()
  const tagStats = new Map<string, { completed: number; total: number }>()

  todayTasks.forEach(task => {
    const isCompleted = !!task.completedAt
    const taskTime = task.elapsedTime ? Math.floor(task.elapsedTime / 60) : 0

    if (task.projectId) {
      const project = projectMap.get(task.projectId)
      if (project) {
        const stats = projectStats.get(project.id) || { completed: 0, total: 0, time: 0 }
        stats.total++
        if (isCompleted) stats.completed++
        stats.time += taskTime
        projectStats.set(project.id, stats)
      }
    }

    if (task.modeId) {
      const mode = modeMap.get(task.modeId)
      if (mode) {
        const stats = modeStats.get(mode.id) || { completed: 0, total: 0, time: 0 }
        stats.total++
        if (isCompleted) stats.completed++
        stats.time += taskTime
        modeStats.set(mode.id, stats)
      }
    }

    task.tagIds?.forEach(tagId => {
      const tag = tagMap.get(tagId)
      if (tag) {
        const stats = tagStats.get(tag.id) || { completed: 0, total: 0 }
        stats.total++
        if (isCompleted) stats.completed++
        tagStats.set(tag.id, stats)
      }
    })
  })

  // 時間効率の分析
  const tasksWithTimeData = completedTasks.filter(t => t.estimatedTime && t.elapsedTime)
  const avgTimeEfficiency = tasksWithTimeData.length > 0
    ? tasksWithTimeData.reduce((sum, task) => {
        const efficiency = task.estimatedTime! / Math.floor(task.elapsedTime! / 60)
        return sum + efficiency
      }, 0) / tasksWithTimeData.length
    : null

  // 日次記録データを構造化
  const dailyRecordData = dailyRecords?.find(record => record.date === today)
  const healthData = dailyRecordData ? {
    weight: dailyRecordData.weight,
    sleepDuration: dailyRecordData.sleepDuration ? Math.floor(dailyRecordData.sleepDuration / 60) : null,
    bedtime: dailyRecordData.bedtime,
    wakeTime: dailyRecordData.wakeTime,
    breakfast: dailyRecordData.breakfast,
    lunch: dailyRecordData.lunch,
    dinner: dailyRecordData.dinner,
  } : null

  // プロンプトを構築
  return `あなたはタスク管理と生産性向上の専門家です。以下のデータを包括的に分析して、深い洞察と具体的な改善提案を含む日次振り返りレポートを生成してください。

## 今日のタスクデータ
- 総タスク数: ${taskData.total}
- 完了タスク数: ${taskData.completed}
- 未完了タスク数: ${taskData.incomplete}
- 完了率: ${taskData.total > 0 ? Math.round((taskData.completed / taskData.total) * 100) : 0}%
${avgTimeEfficiency !== null ? `- 平均時間効率: ${Math.round(avgTimeEfficiency * 100)}% (予定時間に対する実績時間の比率)` : ''}

### 完了したタスク（詳細）
${taskData.completedTasks.map((task, i) => {
  const parts = [`${i + 1}. ${task.title}`]
  if (task.project) parts.push(`[プロジェクト: ${task.project}]`)
  if (task.mode) parts.push(`[モード: ${task.mode}]`)
  if (task.tags.length > 0) parts.push(`[タグ: ${task.tags.join(', ')}]`)
  if (task.estimatedTime) parts.push(`予定: ${task.estimatedTime}分`)
  if (task.elapsedTime) parts.push(`実績: ${task.elapsedTime}分`)
  if (task.timeDiff !== null) {
    const diffText = task.timeDiff > 0 ? `+${task.timeDiff}分超過` : `${task.timeDiff}分短縮`
    parts.push(`(${diffText})`)
  }
  if (task.timeEfficiency !== null) {
    parts.push(`効率: ${task.timeEfficiency}%`)
  }
  return parts.join(' ')
}).join('\n') || 'なし'}

### 未完了のタスク
${taskData.incompleteTasks.map((task, i) => {
  const parts = [`${i + 1}. ${task.title}`]
  if (task.project) parts.push(`[プロジェクト: ${task.project}]`)
  if (task.mode) parts.push(`[モード: ${task.mode}]`)
  if (task.tags.length > 0) parts.push(`[タグ: ${task.tags.join(', ')}]`)
  if (task.estimatedTime) parts.push(`(予定: ${task.estimatedTime}分)`)
  return parts.join(' ')
}).join('\n') || 'なし'}

${Array.from(projectStats.entries()).length > 0 ? `## プロジェクト別分析
${Array.from(projectStats.entries()).map(([id, stats]) => {
  const project = projectMap.get(id)
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  return `- ${project?.name || '未設定'}: ${stats.completed}/${stats.total}完了 (${completionRate}%), 作業時間: ${stats.time}分`
}).join('\n')}
` : ''}

${Array.from(modeStats.entries()).length > 0 ? `## モード別分析
${Array.from(modeStats.entries()).map(([id, stats]) => {
  const mode = modeMap.get(id)
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  return `- ${mode?.name || '未設定'}: ${stats.completed}/${stats.total}完了 (${completionRate}%), 作業時間: ${stats.time}分`
}).join('\n')}
` : ''}

${Array.from(tagStats.entries()).length > 0 ? `## タグ別分析
${Array.from(tagStats.entries()).map(([id, stats]) => {
  const tag = tagMap.get(id)
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  return `- ${tag?.name || '未設定'}: ${stats.completed}/${stats.total}完了 (${completionRate}%)`
}).join('\n')}
` : ''}

${healthData ? `## 今日の健康データ
- 体重: ${healthData.weight ? `${healthData.weight}kg` : '記録なし'}
- 睡眠時間: ${healthData.sleepDuration ? `${healthData.sleepDuration}時間` : '記録なし'}
${healthData.bedtime ? `- 就寝時間: ${healthData.bedtime}` : ''}
${healthData.wakeTime ? `- 起床時間: ${healthData.wakeTime}` : ''}
- 朝食: ${healthData.breakfast || '記録なし'}
- 昼食: ${healthData.lunch || '記録なし'}
- 夕食: ${healthData.dinner || '記録なし'}

**健康データとパフォーマンスの関連性を分析してください：**
- 睡眠時間とタスク完了率の関係
- 食事パターンと集中力・生産性の関係
- 健康習慣がタスクパフォーマンスに与える影響
` : ''}

## 分析の観点

以下の観点から包括的に分析してください：

1. **時間効率の分析**
   - 予定時間と実績時間の差分から見える時間見積もりの精度
   - 効率的に完了したタスクと非効率だったタスクの特徴
   - 時間配分の最適化の余地

2. **カテゴリー別の生産性**
   - プロジェクト/モード/タグ別の完了率と時間配分の傾向
   - 特定のカテゴリーでの強みや課題
   - バランスの取れた配分になっているか

3. **健康とパフォーマンスの関連性**
   - 睡眠時間、食事パターンがタスク完了率に与える影響
   - 健康習慣と生産性の相関関係
   - 最適なパフォーマンスを発揮するための健康習慣の提案

4. **モチベーションと感情的な側面**
   - タスクの完了状況から推測されるモチベーションレベル
   - ストレス要因や集中力の阻害要因
   - 今日の成果から見えるポジティブな側面

5. **パターンと習慣**
   - 繰り返し見られる行動パターン
   - 改善すべき習慣と維持すべき習慣
   - 長期的な成長につながる洞察

以下の形式でJSON形式で返答してください：
{
  "summary": "今日の振り返りの要約（150-200文字程度）。タスク完了状況、時間効率、健康データとの関連性、モチベーションなどを包括的に要約してください。",
  "insights": [
    "データに基づいた深い分析結果1（時間効率、カテゴリー別傾向、健康との関連性など）",
    "データに基づいた深い分析結果2",
    "データに基づいた深い分析結果3",
    "データに基づいた深い分析結果4"
  ],
  "suggestions": [
    "具体的で実行可能な改善提案1（データに基づいた具体的なアクション）",
    "具体的で実行可能な改善提案2",
    "具体的で実行可能な改善提案3",
    "具体的で実行可能な改善提案4"
  ]
}

**重要な指示：**
- インサイトは、単なる事実の列挙ではなく、データから読み取れる深い洞察を提供してください
- 改善提案は、抽象的ではなく、明日から実行できる具体的なアクションを提示してください
- 健康データがある場合は、必ずパフォーマンスとの関連性を分析してください
- ポジティブな成果も認め、モチベーションを高める内容を含めてください
- カテゴリー別の分析結果を活用して、バランスの取れた提案をしてください`
}

