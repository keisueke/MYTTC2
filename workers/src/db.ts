// D1データベース操作のヘルパー関数

import type { D1Database } from '@cloudflare/workers-types'

/**
 * エラーハンドリング付きでクエリを実行
 */
export async function queryDB<T = any>(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const result = await db.prepare(sql).bind(...params).all<T>()
    return result.results || []
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

/**
 * 単一の行を取得
 */
export async function queryOne<T = any>(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<T | null> {
  try {
    const result = await db.prepare(sql).bind(...params).first<T>()
    return result || null
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

/**
 * INSERT/UPDATE/DELETEを実行
 */
export async function executeDB(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<{ success: boolean; meta: any }> {
  try {
    const result = await db.prepare(sql).bind(...params).run()
    return {
      success: true,
      meta: result.meta,
    }
  } catch (error) {
    console.error('Database execute error:', error)
    throw error
  }
}

/**
 * トランザクション内で複数のクエリを実行
 */
export async function executeTransaction(
  db: D1Database,
  queries: Array<{ sql: string; params: any[] }>
): Promise<{ success: boolean }> {
  try {
    await db.batch(
      queries.map((q) => db.prepare(q.sql).bind(...q.params))
    )
    return { success: true }
  } catch (error) {
    console.error('Transaction error:', error)
    throw error
  }
}

