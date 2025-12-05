import { Task, DailyRecord } from '../../types'
import { AIApiProvider, buildReflectionPrompt } from './base'

/**
 * Claude APIエラークラス
 */
export class ClaudeApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ClaudeApiError'
  }
}

const CLAUDE_API_BASE = 'https://api.anthropic.com/v1'

/**
 * Claude APIリクエストを実行
 */
async function claudeRequest(
  endpoint: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${CLAUDE_API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ClaudeApiError(
      errorData.error?.message || `Claude API error: ${response.statusText}`,
      response.status,
      errorData
    )
  }

  return response.json()
}

/**
 * Claude APIプロバイダー
 */
export const claudeApiProvider: AIApiProvider = {
  /**
   * APIキーを検証
   */
  async validateApiKey(apiKey: string, model?: string): Promise<boolean> {
    try {
      const response = await claudeRequest(
        '/messages',
        apiKey,
        {
          method: 'POST',
          body: JSON.stringify({
            model: model || 'claude-3-sonnet-20240229',
            max_tokens: 10,
            messages: [{
              role: 'user',
              content: 'Hello'
            }]
          })
        }
      )
      return !!response
    } catch (error) {
      if (error instanceof ClaudeApiError) {
        return false
      }
      throw error
    }
  },

  /**
   * 日次振り返りを生成
   */
  async generateReflection(
    apiKey: string,
    tasks: Task[],
    dailyRecords?: DailyRecord[],
    model?: string
  ): Promise<{
    summary: string
    insights: string[]
    suggestions: string[]
  }> {
    const prompt = buildReflectionPrompt(tasks, dailyRecords)
    const modelName = model || 'claude-3-opus-20240229'

    try {
      const response = await claudeRequest(
        '/messages',
        apiKey,
        {
          method: 'POST',
          body: JSON.stringify({
            model: modelName,
            max_tokens: 4096,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })
        }
      )

      // レスポンスからテキストを抽出
      const text = response.content?.[0]?.text || ''
      
      // JSONを抽出（コードブロック内のJSONを探す）
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new ClaudeApiError('レスポンスからJSONを抽出できませんでした')
      }

      const jsonText = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonText)

      return {
        summary: parsed.summary || '振り返りを生成しました',
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      }
    } catch (error) {
      if (error instanceof ClaudeApiError) {
        throw error
      }
      if (error instanceof SyntaxError) {
        throw new ClaudeApiError('レスポンスの解析に失敗しました')
      }
      throw new ClaudeApiError(`振り返りの生成に失敗しました: ${error}`)
    }
  },
}

