// 認証ミドルウェア

import { Context, Next } from 'hono'
import { Env } from './types'

/**
 * APIキー認証ミドルウェア
 */
export async function apiKeyAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const apiKey = c.env.API_KEY

  // API_KEYが設定されていない場合は認証をスキップ（開発環境またはCloudflare Access使用時）
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
 * 許可されたオリジンかどうかを確認
 */
export function isAllowedOrigin(origin: string | null, allowedOrigins?: string): boolean {
  if (!origin) return false
  
  // ALLOWED_ORIGINSが設定されていない場合は全て許可（開発環境用）
  if (!allowedOrigins) return true
  
  const origins = allowedOrigins.split(',').map(o => o.trim())
  return origins.includes(origin) || origins.includes('*')
}

/**
 * CORS設定（動的オリジン対応）
 */
export function corsHeaders(origin?: string | null, allowedOrigins?: string) {
  // オリジンが許可されている場合はそのオリジンを返す
  // 許可されていない場合や設定がない場合は '*' を返す
  const allowOrigin = origin && isAllowedOrigin(origin, allowedOrigins) 
    ? origin 
    : (allowedOrigins ? '' : '*')
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Allow-Credentials': 'true', // Cloudflare Accessのクッキー用
  }
}

/**
 * OPTIONSリクエストのハンドリング
 */
export async function handleOptions(c: Context<{ Bindings: Env }>) {
  const origin = c.req.header('Origin')
  const allowedOrigins = c.env.ALLOWED_ORIGINS
  return c.text('', 204, corsHeaders(origin, allowedOrigins))
}

