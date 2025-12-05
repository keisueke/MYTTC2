import { Task, DailyRecord } from '../types'

/**
 * Gemini APIエラークラス
 */
export class GeminiApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'GeminiApiError'
  }
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

/**
 * Gemini APIリクエストを実行
 */
async function geminiRequest(
  endpoint: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${GEMINI_API_BASE}${endpoint}?key=${apiKey}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new GeminiApiError(
      errorData.error?.message || `Gemini API error: ${response.statusText}`,
      response.status,
      errorData
    )
  }

  return response.json()
}

/**
 * APIキーを検証
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const prompt = 'Hello'
    const response = await geminiRequest(
      '/models/gemini-pro:generateContent',
      apiKey,
      {
        method: 'POST',
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    )
    return !!response
  } catch (error) {
    if (error instanceof GeminiApiError) {
      return false
    }
    throw error
  }
}

/**
 * 日次振り返りを生成
 */
export async function generateDailyReflection(
  apiKey: string,
  tasks: Task[],
  dailyRecords?: DailyRecord[]
): Promise<{
  summary: string
  insights: string[]
  suggestions: string[]
}> {
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

  // タスクデータを構造化
  const taskData = {
    total: todayTasks.length,
    completed: completedTasks.length,
    incomplete: incompleteTasks.length,
    completedTasks: completedTasks.map(task => ({
      title: task.title,
      elapsedTime: task.elapsedTime ? Math.floor(task.elapsedTime / 60) : null, // 分に変換
      estimatedTime: task.estimatedTime,
    })),
    incompleteTasks: incompleteTasks.map(task => ({
      title: task.title,
      estimatedTime: task.estimatedTime,
    })),
  }

  // 日次記録データを構造化
  const dailyRecordData = dailyRecords?.find(record => record.date === today)
  const healthData = dailyRecordData ? {
    weight: dailyRecordData.weight,
    sleepDuration: dailyRecordData.sleepDuration ? Math.floor(dailyRecordData.sleepDuration / 60) : null, // 時間に変換
    breakfast: dailyRecordData.breakfast,
    lunch: dailyRecordData.lunch,
    dinner: dailyRecordData.dinner,
  } : null

  // プロンプトを構築
  const prompt = `あなたはタスク管理の専門家です。以下のデータを分析して、日次振り返りレポートを生成してください。

## 今日のタスクデータ
- 総タスク数: ${taskData.total}
- 完了タスク数: ${taskData.completed}
- 未完了タスク数: ${taskData.incomplete}

### 完了したタスク
${taskData.completedTasks.map((task, i) => 
  `${i + 1}. ${task.title}${task.elapsedTime ? ` (実績時間: ${task.elapsedTime}分)` : ''}${task.estimatedTime ? ` (予定時間: ${task.estimatedTime}分)` : ''}`
).join('\n') || 'なし'}

### 未完了のタスク
${taskData.incompleteTasks.map((task, i) => 
  `${i + 1}. ${task.title}${task.estimatedTime ? ` (予定時間: ${task.estimatedTime}分)` : ''}`
).join('\n') || 'なし'}

${healthData ? `## 今日の健康データ
- 体重: ${healthData.weight ? `${healthData.weight}kg` : '記録なし'}
- 睡眠時間: ${healthData.sleepDuration ? `${healthData.sleepDuration}時間` : '記録なし'}
- 朝食: ${healthData.breakfast || '記録なし'}
- 昼食: ${healthData.lunch || '記録なし'}
- 夕食: ${healthData.dinner || '記録なし'}
` : ''}

以下の形式でJSON形式で返答してください：
{
  "summary": "今日の振り返りの要約（100文字程度）",
  "insights": [
    "分析結果のインサイト1",
    "分析結果のインサイト2",
    "分析結果のインサイト3"
  ],
  "suggestions": [
    "改善提案1",
    "改善提案2",
    "改善提案3"
  ]
}

インサイトは、タスクの完了率、時間の使い方、パターンなどの分析結果を提供してください。
改善提案は、具体的で実行可能なアドバイスを提供してください。`

  try {
    const response = await geminiRequest(
      '/models/gemini-pro:generateContent',
      apiKey,
      {
        method: 'POST',
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    )

    // レスポンスからテキストを抽出
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // JSONを抽出（コードブロック内のJSONを探す）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new GeminiApiError('レスポンスからJSONを抽出できませんでした')
    }

    const jsonText = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonText)

    return {
      summary: parsed.summary || '振り返りを生成しました',
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    }
  } catch (error) {
    if (error instanceof GeminiApiError) {
      throw error
    }
    if (error instanceof SyntaxError) {
      throw new GeminiApiError('レスポンスの解析に失敗しました')
    }
    throw new GeminiApiError(`振り返りの生成に失敗しました: ${error}`)
  }
}

