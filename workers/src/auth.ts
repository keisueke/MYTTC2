// 認証ミドルウェア

import { Context, Next } from 'hono'
import { Env } from './types'

/**
 * APIキー認証ミドルウェア
 */
export async function apiKeyAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const apiKey = c.env.API_KEY

  // API_KEYが設定されていない場合は認証をスキップ（開発環境）
  if (!apiKey) {
    return next()
  }

  const requestKey = c.req.header('X-API-Key') || c.req.query('api_key')

  if (!requestKey || requestKey !== apiKey) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing API key',
      },
      401
    )
  }

  return next()
}

/**
 * CORS設定
 */
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  }
}

/**
 * OPTIONSリクエストのハンドリング
 */
export async function handleOptions(c: Context) {
  return c.text('', 204, corsHeaders())
}

