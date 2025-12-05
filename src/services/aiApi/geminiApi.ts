import { Task, DailyRecord } from '../../types'
import { AIApiProvider, buildReflectionPrompt } from './base'

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
 * Gemini APIプロバイダー
 */
export const geminiApiProvider: AIApiProvider = {
  /**
   * APIキーを検証
   */
  async validateApiKey(apiKey: string, model?: string): Promise<boolean> {
    try {
      const prompt = 'Hello'
      const modelName = model || 'gemini-pro'
      const response = await geminiRequest(
        `/models/${modelName}:generateContent`,
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
    const modelName = model || 'gemini-pro'

    try {
      const response = await geminiRequest(
        `/models/${modelName}:generateContent`,
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
  },
}

