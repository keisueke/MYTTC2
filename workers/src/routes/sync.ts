// データ同期エンドポイント

import { Context } from 'hono'
import { Env, SyncRequest, SyncResponse, ApiResponse } from '../types'
import { queryDB, queryOne, executeDB, executeTransaction } from '../db'
import { corsHeaders } from '../auth'

/**
 * データ同期（GET: 最新データを取得）
 */
export async function getSync(c: Context<{ Bindings: Env }>) {
  try {
    const lastSynced = c.req.query('lastSynced')

    // すべてのデータを取得
    const [tasks, projects, modes, tags, routineExecutions, dailyRecords, goals, memos, memoTemplates, wishes, subTasks, userSettings] = await Promise.all([
      queryDB(c.env.DB, 'SELECT * FROM tasks ORDER BY created_at DESC'),
      queryDB(c.env.DB, 'SELECT * FROM projects ORDER BY created_at DESC'),
      queryDB(c.env.DB, 'SELECT * FROM modes ORDER BY created_at DESC'),
      queryDB(c.env.DB, 'SELECT * FROM tags ORDER BY created_at DESC'),
      queryDB(c.env.DB, 'SELECT * FROM routine_executions ORDER BY date DESC'),
      queryDB(c.env.DB, 'SELECT * FROM daily_records ORDER BY date DESC'),
      queryDB(c.env.DB, 'SELECT * FROM goals ORDER BY created_at DESC'),
      queryDB(c.env.DB, 'SELECT * FROM memos ORDER BY created_at DESC'),
      queryDB(c.env.DB, 'SELECT * FROM memo_templates ORDER BY created_at DESC'),
      queryDB(c.env.DB, 'SELECT * FROM wishes ORDER BY created_at DESC'),
      queryDB(c.env.DB, 'SELECT * FROM sub_tasks ORDER BY order_index, created_at'),
      queryOne(c.env.DB, "SELECT * FROM user_settings WHERE user_id = 'default'"),
    ])

    const now = new Date().toISOString()

    const response: SyncResponse = {
      lastSynced: now,
      data: {
        tasks: tasks as any[],
        projects: projects as any[],
        modes: modes as any[],
        tags: tags as any[],
        routineExecutions: routineExecutions as any[],
        dailyRecords: dailyRecords as any[],
        goals: goals as any[],
        memos: memos as any[],
        memoTemplates: memoTemplates as any[],
        wishes: wishes as any[],
        subTasks: subTasks as any[],
        userSettings: userSettings || {
          user_id: 'default',
          updated_at: now,
        } as any,
      },
      conflict: false,
    }

    return c.json(
      {
        success: true,
        data: response,
      } as ApiResponse<SyncResponse>,
      200,
      corsHeaders()
    )
  } catch (error) {
    console.error('Get sync error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to sync data',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse,
      500,
      corsHeaders()
    )
  }
}

/**
 * データ同期（POST: データを送信して同期）
 */
export async function postSync(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json<SyncRequest>()
    const now = new Date().toISOString()

    if (!body.data) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Data is required',
        } as ApiResponse,
        400,
        corsHeaders()
      )
    }

    // トランザクションでデータを保存
    const queries: Array<{ sql: string; params: any[] }> = []

    // 各データタイプを保存
    if (body.data.tasks) {
      for (const task of body.data.tasks) {
        queries.push({
          sql: `INSERT OR REPLACE INTO tasks (
            id, title, description, project_id, mode_id, tag_ids, goal_id,
            repeat_pattern, repeat_config, created_at, updated_at,
            start_time, end_time, elapsed_time, is_running, estimated_time,
            completed_at, skipped_at, order_index, due_date, time_section_id,
            show_in_routine_checker
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            task.id,
            task.title,
            task.description || null,
            task.project_id || null,
            task.mode_id || null,
            task.tag_ids || null,
            task.goal_id || null,
            task.repeat_pattern || 'none',
            task.repeat_config || null,
            task.created_at || now,
            now,
            task.start_time || null,
            task.end_time || null,
            task.elapsed_time || 0,
            task.is_running || 0,
            task.estimated_time || null,
            task.completed_at || null,
            task.skipped_at || null,
            task.order_index || null,
            task.due_date || null,
            task.time_section_id || null,
            task.show_in_routine_checker ?? 1,
          ],
        })
      }
    }

    // modes を保存
    if (body.data.modes) {
      for (const mode of body.data.modes) {
        queries.push({
          sql: `INSERT OR REPLACE INTO modes (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
          params: [
            mode.id,
            mode.name,
            mode.color || null,
            mode.created_at || now,
          ],
        })
      }
    }

    // tags を保存
    if (body.data.tags) {
      for (const tag of body.data.tags) {
        queries.push({
          sql: `INSERT OR REPLACE INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
          params: [
            tag.id,
            tag.name,
            tag.color || null,
            tag.created_at || now,
          ],
        })
      }
    }

    // projects を保存
    if (body.data.projects) {
      for (const project of body.data.projects) {
        queries.push({
          sql: `INSERT OR REPLACE INTO projects (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
          params: [
            project.id,
            project.name,
            project.color || null,
            project.created_at || now,
          ],
        })
      }
    }

    // 他のデータタイプも同様に処理
    // routineExecutions, dailyRecords, goals, memos, memoTemplates, wishes, subTasks

    await executeTransaction(c.env.DB, queries)

    // 同期後のデータを返す
    return getSync(c)
  } catch (error) {
    console.error('Post sync error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to sync data',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse,
      500,
      corsHeaders()
    )
  }
}

