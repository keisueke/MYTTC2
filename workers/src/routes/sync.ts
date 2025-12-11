// データ同期エンドポイント

import { Context } from 'hono'
import { Env, SyncRequest, SyncResponse, ApiResponse } from '../types'
import { queryDB, queryOne, executeDB, executeTransaction } from '../db'
import { corsHeaders } from '../auth'

// ============================================
// camelCase <-> snake_case 変換ユーティリティ
// ============================================

/**
 * タスクをsnake_case（DB）からcamelCase（フロントエンド）に変換
 */
function convertTaskToCamelCase(task: any): any {
  if (!task) return null
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    projectId: task.project_id,
    modeId: task.mode_id,
    tagIds: task.tag_ids ? safeJsonParse(task.tag_ids) : undefined,
    goalId: task.goal_id,
    repeatPattern: task.repeat_pattern || 'none',
    repeatConfig: task.repeat_config ? safeJsonParse(task.repeat_config) : undefined,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    startTime: task.start_time,
    endTime: task.end_time,
    elapsedTime: task.elapsed_time,
    isRunning: task.is_running === 1,
    estimatedTime: task.estimated_time,
    completedAt: task.completed_at,
    skippedAt: task.skipped_at,
    order: task.order_index,
    dueDate: task.due_date,
    timeSectionId: task.time_section_id,
    showInRoutineChecker: task.show_in_routine_checker === 1,
  }
}

/**
 * プロジェクトをsnake_case（DB）からcamelCase（フロントエンド）に変換
 */
function convertProjectToCamelCase(project: any): any {
  if (!project) return null
  return {
    id: project.id,
    name: project.name,
    color: project.color,
    createdAt: project.created_at,
  }
}

/**
 * モードをsnake_case（DB）からcamelCase（フロントエンド）に変換
 */
function convertModeToCamelCase(mode: any): any {
  if (!mode) return null
  return {
    id: mode.id,
    name: mode.name,
    color: mode.color,
    createdAt: mode.created_at,
  }
}

/**
 * タグをsnake_case（DB）からcamelCase（フロントエンド）に変換
 */
function convertTagToCamelCase(tag: any): any {
  if (!tag) return null
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.created_at,
  }
}

/**
 * ルーティン実行記録をsnake_case（DB）からcamelCase（フロントエンド）に変換
 */
function convertRoutineExecutionToCamelCase(execution: any): any {
  if (!execution) return null
  return {
    id: execution.id,
    routineTaskId: execution.routine_task_id,
    date: execution.date,
    completedAt: execution.completed_at,
    skippedAt: execution.skipped_at,
    elapsedTime: execution.elapsed_time,
    startTime: execution.start_time,
    endTime: execution.end_time,
    createdAt: execution.created_at,
    updatedAt: execution.updated_at,
  }
}

/**
 * 日次記録をsnake_case（DB）からcamelCase（フロントエンド）に変換
 */
function convertDailyRecordToCamelCase(record: any): any {
  if (!record) return null
  return {
    id: record.id,
    date: record.date,
    weight: record.weight,
    bedtime: record.bedtime,
    wakeTime: record.wake_time,
    sleepDuration: record.sleep_duration,
    breakfast: record.breakfast,
    lunch: record.lunch,
    dinner: record.dinner,
    snack: record.snack,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
}

/**
 * 目標をsnake_case（DB）からcamelCase（フロントエンド）に変換
 */
function convertGoalToCamelCase(goal: any): any {
  if (!goal) return null
  return {
    id: goal.id,
    year: goal.year,
    category: goal.category,
    title: goal.title,
    description: goal.description,
    progress: goal.progress,
    parentGoalId: goal.parent_goal_id,
    position: goal.position,
    completedAt: goal.completed_at,
    createdAt: goal.created_at,
    updatedAt: goal.updated_at,
  }
}

/**
 * メモをsnake_case（DB）からcamelCase（フロントエンド）に変換
 */
function convertMemoToCamelCase(memo: any): any {
  if (!memo) return null
  return {
    id: memo.id,
    title: memo.title,
    content: memo.content,
    createdAt: memo.created_at,
    updatedAt: memo.updated_at,
  }
}

/**
 * メモテンプレートをsnake_case（DB）からcamelCase（フロントエンド）に変換
 */
function convertMemoTemplateToCamelCase(template: any): any {
  if (!template) return null
  return {
    id: template.id,
    title: template.title,
    content: template.content,
    createdAt: template.created_at,
    updatedAt: template.updated_at,
  }
}

/**
 * Wishをsnake_case（DB）からcamelCase（フロントエンド）に変換
 */
function convertWishToCamelCase(wish: any): any {
  if (!wish) return null
  return {
    id: wish.id,
    title: wish.title,
    description: wish.description,
    projectId: wish.project_id,
    modeId: wish.mode_id,
    tagIds: wish.tag_ids ? safeJsonParse(wish.tag_ids) : undefined,
    createdAt: wish.created_at,
    updatedAt: wish.updated_at,
  }
}

/**
 * サブタスクをsnake_case（DB）からcamelCase（フロントエンド）に変換
 */
function convertSubTaskToCamelCase(subTask: any): any {
  if (!subTask) return null
  return {
    id: subTask.id,
    taskId: subTask.task_id,
    title: subTask.title,
    description: subTask.description,
    completedAt: subTask.completed_at,
    order: subTask.order_index,
    createdAt: subTask.created_at,
    updatedAt: subTask.updated_at,
  }
}

/**
 * 安全なJSON解析
 */
function safeJsonParse(value: string | null | undefined): any {
  if (!value) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

/**
 * 安全なJSON文字列化
 */
function safeJsonStringify(value: any): string | null {
  if (value === undefined || value === null) return null
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

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

    // snake_case から camelCase に変換
    const response: SyncResponse = {
      lastSynced: now,
      data: {
        tasks: (tasks as any[]).map(convertTaskToCamelCase),
        projects: (projects as any[]).map(convertProjectToCamelCase),
        modes: (modes as any[]).map(convertModeToCamelCase),
        tags: (tags as any[]).map(convertTagToCamelCase),
        routineExecutions: (routineExecutions as any[]).map(convertRoutineExecutionToCamelCase),
        dailyRecords: (dailyRecords as any[]).map(convertDailyRecordToCamelCase),
        goals: (goals as any[]).map(convertGoalToCamelCase),
        memos: (memos as any[]).map(convertMemoToCamelCase),
        memoTemplates: (memoTemplates as any[]).map(convertMemoTemplateToCamelCase),
        wishes: (wishes as any[]).map(convertWishToCamelCase),
        subTasks: (subTasks as any[]).map(convertSubTaskToCamelCase),
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

    // タスクを保存（camelCase から snake_case に変換）
    // 注意: 削除はフロント側のマージロジックで処理するため、ここでは INSERT OR REPLACE のみ
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
            // camelCase と snake_case の両方をサポート
            task.projectId || task.project_id || null,
            task.modeId || task.mode_id || null,
            safeJsonStringify(task.tagIds) || task.tag_ids || null,
            task.goalId || task.goal_id || null,
            task.repeatPattern || task.repeat_pattern || 'none',
            safeJsonStringify(task.repeatConfig) || task.repeat_config || null,
            task.createdAt || task.created_at || now,
            now,
            task.startTime || task.start_time || null,
            task.endTime || task.end_time || null,
            task.elapsedTime ?? task.elapsed_time ?? 0,
            (task.isRunning || task.is_running) ? 1 : 0,
            task.estimatedTime || task.estimated_time || null,
            task.completedAt || task.completed_at || null,
            task.skippedAt || task.skipped_at || null,
            task.order ?? task.order_index ?? null,
            task.dueDate || task.due_date || null,
            task.timeSectionId || task.time_section_id || null,
            (task.showInRoutineChecker ?? task.show_in_routine_checker ?? true) ? 1 : 0,
          ],
        })
      }
    }

    // モードを保存
    if (body.data.modes) {
      for (const mode of body.data.modes) {
        queries.push({
          sql: `INSERT OR REPLACE INTO modes (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
          params: [
            mode.id,
            mode.name,
            mode.color || null,
            mode.createdAt || mode.created_at || now,
          ],
        })
      }
    }

    // タグを保存
    if (body.data.tags) {
      for (const tag of body.data.tags) {
        queries.push({
          sql: `INSERT OR REPLACE INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
          params: [
            tag.id,
            tag.name,
            tag.color || null,
            tag.createdAt || tag.created_at || now,
          ],
        })
      }
    }

    // プロジェクトを保存
    if (body.data.projects) {
      for (const project of body.data.projects) {
        queries.push({
          sql: `INSERT OR REPLACE INTO projects (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
          params: [
            project.id,
            project.name,
            project.color || null,
            project.createdAt || project.created_at || now,
          ],
        })
      }
    }

    // ルーティン実行記録を保存
    if (body.data.routineExecutions) {
      for (const execution of body.data.routineExecutions) {
        queries.push({
          sql: `INSERT OR REPLACE INTO routine_executions (
            id, routine_task_id, date, completed_at, skipped_at,
            elapsed_time, start_time, end_time, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            execution.id,
            execution.routineTaskId || execution.routine_task_id,
            execution.date,
            execution.completedAt || execution.completed_at || null,
            execution.skippedAt || execution.skipped_at || null,
            execution.elapsedTime ?? execution.elapsed_time ?? 0,
            execution.startTime || execution.start_time || null,
            execution.endTime || execution.end_time || null,
            execution.createdAt || execution.created_at || now,
            now,
          ],
        })
      }
    }

    // 日次記録を保存
    if (body.data.dailyRecords) {
      for (const record of body.data.dailyRecords) {
        queries.push({
          sql: `INSERT OR REPLACE INTO daily_records (
            id, date, weight, bedtime, wake_time, sleep_duration,
            breakfast, lunch, dinner, snack, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            record.id,
            record.date,
            record.weight || null,
            record.bedtime || null,
            record.wakeTime || record.wake_time || null,
            record.sleepDuration ?? record.sleep_duration ?? null,
            record.breakfast || null,
            record.lunch || null,
            record.dinner || null,
            record.snack || null,
            record.createdAt || record.created_at || now,
            now,
          ],
        })
      }
    }

    // 目標を保存
    if (body.data.goals) {
      for (const goal of body.data.goals) {
        queries.push({
          sql: `INSERT OR REPLACE INTO goals (
            id, year, category, title, description, progress,
            parent_goal_id, position, completed_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            goal.id,
            goal.year,
            goal.category,
            goal.title,
            goal.description || null,
            goal.progress ?? 0,
            goal.parentGoalId || goal.parent_goal_id || null,
            goal.position ?? null,
            goal.completedAt || goal.completed_at || null,
            goal.createdAt || goal.created_at || now,
            now,
          ],
        })
      }
    }

    // メモを保存
    if (body.data.memos) {
      for (const memo of body.data.memos) {
        queries.push({
          sql: `INSERT OR REPLACE INTO memos (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
          params: [
            memo.id,
            memo.title,
            memo.content,
            memo.createdAt || memo.created_at || now,
            now,
          ],
        })
      }
    }

    // メモテンプレートを保存
    if (body.data.memoTemplates) {
      for (const template of body.data.memoTemplates) {
        queries.push({
          sql: `INSERT OR REPLACE INTO memo_templates (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
          params: [
            template.id,
            template.title,
            template.content,
            template.createdAt || template.created_at || now,
            now,
          ],
        })
      }
    }

    // Wishを保存
    if (body.data.wishes) {
      for (const wish of body.data.wishes) {
        queries.push({
          sql: `INSERT OR REPLACE INTO wishes (
            id, title, description, project_id, mode_id, tag_ids, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            wish.id,
            wish.title,
            wish.description || null,
            wish.projectId || wish.project_id || null,
            wish.modeId || wish.mode_id || null,
            safeJsonStringify(wish.tagIds) || wish.tag_ids || null,
            wish.createdAt || wish.created_at || now,
            now,
          ],
        })
      }
    }

    // サブタスクを保存
    if (body.data.subTasks) {
      for (const subTask of body.data.subTasks) {
        queries.push({
          sql: `INSERT OR REPLACE INTO sub_tasks (
            id, task_id, title, description, completed_at, order_index, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            subTask.id,
            subTask.taskId || subTask.task_id,
            subTask.title,
            subTask.description || null,
            subTask.completedAt || subTask.completed_at || null,
            subTask.order ?? subTask.order_index ?? null,
            subTask.createdAt || subTask.created_at || now,
            now,
          ],
        })
      }
    }

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
