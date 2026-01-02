import { Task, DailyRecord, Project, Mode, Tag, ApiErrorResponse } from '../../types'
import { AIApiProvider, buildReflectionPrompt } from './base'

/**
 * OpenAI APIエラークラス
 */
export class OpenAIApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: ApiErrorResponse
  ) {
    super(message)
    this.name = 'OpenAIApiError'
  }
}

const OPENAI_API_BASE = 'https://api.openai.com/v1'

/**
 * OpenAI APIリクエストを実行
 */
async function openaiRequest(
  endpoint: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${OPENAI_API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new OpenAIApiError(
      errorData.error?.message || `OpenAI API error: ${response.statusText}`,
      response.status,
      errorData
    )
  }

  return response.json()
}

/**
 * OpenAI APIプロバイダー
 */
export const openaiApiProvider: AIApiProvider = {
  /**
   * APIキーを検証
   */
  async validateApiKey(apiKey: string, model?: string): Promise<boolean> {
    try {
      const response = await openaiRequest(
        '/chat/completions',
        apiKey,
        {
          method: 'POST',
          body: JSON.stringify({
            model: model || 'gpt-3.5-turbo',
            messages: [{
              role: 'user',
              content: 'Hello'
            }],
            max_tokens: 10
          })
        }
      )
      return !!response
    } catch (error) {
      if (error instanceof OpenAIApiError) {
        // エラーメッセージを保持するために再スロー
        throw error
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
    projects?: Project[],
    modes?: Mode[],
    tags?: Tag[],
    model?: string
  ): Promise<{
    summary: string
    insights: string[]
    suggestions: string[]
  }> {
    const prompt = buildReflectionPrompt(tasks, dailyRecords, projects, modes, tags)
    const modelName = model || 'gpt-4'

    try {
      const response = await openaiRequest(
        '/chat/completions',
        apiKey,
        {
          method: 'POST',
          body: JSON.stringify({
            model: modelName,
            messages: [{
              role: 'user',
              content: prompt
            }],
            response_format: { type: 'json_object' },
            max_tokens: 2000
          })
        }
      )

      // レスポンスからテキストを抽出
      const text = response.choices?.[0]?.message?.content || ''
      
      // JSONを抽出（コードブロック内のJSONを探す）
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new OpenAIApiError('レスポンスからJSONを抽出できませんでした')
      }

      const jsonText = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonText)

      return {
        summary: parsed.summary || '振り返りを生成しました',
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      }
    } catch (error) {
      if (error instanceof OpenAIApiError) {
        throw error
      }
      if (error instanceof SyntaxError) {
        throw new OpenAIApiError('レスポンスの解析に失敗しました')
      }
      throw new OpenAIApiError(`振り返りの生成に失敗しました: ${error}`)
    }
  },
}

