// Cloudflare Workers メインエントリーポイント

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { apiKeyAuth, handleOptions, corsHeaders } from './auth'
import { getTasks, getTask, createTask, updateTask, deleteTask } from './routes/tasks'
import { getSync, postSync } from './routes/sync'
import { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

// CORS設定
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-API-Key'],
}))

// OPTIONSリクエストのハンドリング
app.options('/*', handleOptions)

// 認証ミドルウェア（API_KEYが設定されている場合のみ）
app.use('/api/*', apiKeyAuth)

// ヘルスチェック
app.get('/health', (c) => {
  return c.json({ status: 'ok' }, 200, corsHeaders())
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
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: 'Endpoint not found',
    },
    404,
    corsHeaders()
  )
})

// エラーハンドラー
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
      message: err.message,
    },
    500,
    corsHeaders()
  )
})

export default app

