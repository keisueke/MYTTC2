// Cloudflare Workers メインエントリーポイント

import { Hono } from 'hono'
import { apiKeyAuth, handleOptions, corsHeaders, isAllowedOrigin } from './auth'
import { getTasks, getTask, createTask, updateTask, deleteTask } from './routes/tasks'
import { getSync, postSync } from './routes/sync'
import { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

// 動的CORS設定ミドルウェア
app.use('/*', async (c, next) => {
  const origin = c.req.header('Origin')
  const allowedOrigins = c.env.ALLOWED_ORIGINS
  
  // オリジンが許可されているかチェック
  if (origin && !isAllowedOrigin(origin, allowedOrigins)) {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Origin not allowed',
      },
      403
    )
  }
  
  await next()
  
  // レスポンスにCORSヘッダーを追加
  const headers = corsHeaders(origin, allowedOrigins)
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      c.res.headers.set(key, value)
    }
  })
})

// OPTIONSリクエストのハンドリング
app.options('/*', handleOptions)

// 認証ミドルウェア（API_KEYが設定されている場合のみ）
app.use('/api/*', apiKeyAuth)

// ヘルスチェック
app.get('/health', (c) => {
  const origin = c.req.header('Origin')
  const allowedOrigins = c.env.ALLOWED_ORIGINS
  return c.json({ status: 'ok' }, 200, corsHeaders(origin, allowedOrigins))
})

// タスク関連のエンドポイント
app.get('/api/tasks', getTasks)
app.get('/api/tasks/:id', getTask)
app.post('/api/tasks', createTask)
app.put('/api/tasks/:id', updateTask)
app.delete('/api/tasks/:id', deleteTask)

// データ同期エンドポイント
app.get('/api/sync', getSync)
app.post('/api/sync', postSync)

// 404ハンドラー
app.notFound((c) => {
  const origin = c.req.header('Origin')
  const allowedOrigins = c.env.ALLOWED_ORIGINS
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: 'Endpoint not found',
    },
    404,
    corsHeaders(origin, allowedOrigins)
  )
})

// エラーハンドラー
app.onError((err, c) => {
  console.error('Error:', err)
  const origin = c.req.header('Origin')
  const allowedOrigins = c.env.ALLOWED_ORIGINS
  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
      message: err.message,
    },
    500,
    corsHeaders(origin, allowedOrigins)
  )
})

export default app

