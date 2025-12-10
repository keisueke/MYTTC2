// タスク関連のエンドポイント

import { Context } from 'hono'
import { Env, Task, ApiResponse } from '../types'
import { queryDB, queryOne, executeDB } from '../db'
import { corsHeaders } from '../auth'

/**
 * タスク一覧を取得
 */
export async function getTasks(c: Context<{ Bindings: Env }>) {
  try {
    const tasks = await queryDB<Task>(
      c.env.DB,
      'SELECT * FROM tasks ORDER BY created_at DESC'
    )

    return c.json(
      {
        success: true,
        data: tasks,
      } as ApiResponse<Task[]>,
      200,
      corsHeaders()
    )
  } catch (error) {
    console.error('Get tasks error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to fetch tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse,
      500,
      corsHeaders()
    )
  }
}

/**
 * タスクを取得（ID指定）
 */
export async function getTask(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')
    const task = await queryOne<Task>(
      c.env.DB,
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    )

    if (!task) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Task not found',
        } as ApiResponse,
        404,
        corsHeaders()
      )
    }

    return c.json(
      {
        success: true,
        data: task,
      } as ApiResponse<Task>,
      200,
      corsHeaders()
    )
  } catch (error) {
    console.error('Get task error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to fetch task',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse,
      500,
      corsHeaders()
    )
  }
}

/**
 * タスクを作成
 */
export async function createTask(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json<Task>()
    const now = new Date().toISOString()

    const task: Task = {
      id: body.id || crypto.randomUUID(),
      title: body.title,
      description: body.description,
      project_id: body.project_id,
      mode_id: body.mode_id,
      tag_ids: body.tag_ids,
      goal_id: body.goal_id,
      repeat_pattern: body.repeat_pattern || 'none',
      repeat_config: body.repeat_config,
      created_at: body.created_at || now,
      updated_at: now,
      start_time: body.start_time,
      end_time: body.end_time,
      elapsed_time: body.elapsed_time || 0,
      is_running: body.is_running || 0,
      estimated_time: body.estimated_time,
      completed_at: body.completed_at,
      skipped_at: body.skipped_at,
      order_index: body.order_index,
      due_date: body.due_date,
      time_section_id: body.time_section_id,
      show_in_routine_checker: body.show_in_routine_checker ?? 1,
    }

    await executeDB(
      c.env.DB,
      `INSERT INTO tasks (
        id, title, description, project_id, mode_id, tag_ids, goal_id,
        repeat_pattern, repeat_config, created_at, updated_at,
        start_time, end_time, elapsed_time, is_running, estimated_time,
        completed_at, skipped_at, order_index, due_date, time_section_id,
        show_in_routine_checker
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.description || null,
        task.project_id || null,
        task.mode_id || null,
        task.tag_ids || null,
        task.goal_id || null,
        task.repeat_pattern,
        task.repeat_config || null,
        task.created_at,
        task.updated_at,
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
      ]
    )

    return c.json(
      {
        success: true,
        data: task,
      } as ApiResponse<Task>,
      201,
      corsHeaders()
    )
  } catch (error) {
    console.error('Create task error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to create task',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse,
      500,
      corsHeaders()
    )
  }
}

/**
 * タスクを更新
 */
export async function updateTask(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<Partial<Task>>()
    const now = new Date().toISOString()

    // 既存のタスクを取得
    const existing = await queryOne<Task>(
      c.env.DB,
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    )

    if (!existing) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Task not found',
        } as ApiResponse,
        404,
        corsHeaders()
      )
    }

    // 更新
    const updated: Task = {
      ...existing,
      ...body,
      id, // IDは変更不可
      updated_at: now,
    }

    await executeDB(
      c.env.DB,
      `UPDATE tasks SET
        title = ?, description = ?, project_id = ?, mode_id = ?, tag_ids = ?,
        goal_id = ?, repeat_pattern = ?, repeat_config = ?, updated_at = ?,
        start_time = ?, end_time = ?, elapsed_time = ?, is_running = ?,
        estimated_time = ?, completed_at = ?, skipped_at = ?, order_index = ?,
        due_date = ?, time_section_id = ?, show_in_routine_checker = ?
      WHERE id = ?`,
      [
        updated.title,
        updated.description || null,
        updated.project_id || null,
        updated.mode_id || null,
        updated.tag_ids || null,
        updated.goal_id || null,
        updated.repeat_pattern,
        updated.repeat_config || null,
        updated.updated_at,
        updated.start_time || null,
        updated.end_time || null,
        updated.elapsed_time || 0,
        updated.is_running || 0,
        updated.estimated_time || null,
        updated.completed_at || null,
        updated.skipped_at || null,
        updated.order_index || null,
        updated.due_date || null,
        updated.time_section_id || null,
        updated.show_in_routine_checker ?? 1,
        id,
      ]
    )

    return c.json(
      {
        success: true,
        data: updated,
      } as ApiResponse<Task>,
      200,
      corsHeaders()
    )
  } catch (error) {
    console.error('Update task error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to update task',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse,
      500,
      corsHeaders()
    )
  }
}

/**
 * タスクを削除
 */
export async function deleteTask(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')

    const existing = await queryOne<Task>(
      c.env.DB,
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    )

    if (!existing) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Task not found',
        } as ApiResponse,
        404,
        corsHeaders()
      )
    }

    await executeDB(c.env.DB, 'DELETE FROM tasks WHERE id = ?', [id])

    return c.json(
      {
        success: true,
        message: 'Task deleted successfully',
      } as ApiResponse,
      200,
      corsHeaders()
    )
  } catch (error) {
    console.error('Delete task error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to delete task',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse,
      500,
      corsHeaders()
    )
  }
}

