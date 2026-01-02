/**
 * ルーティン管理サービス
 * RoutineExecution関連の処理
 */
import { RoutineExecution, SubTask, Task } from '../types'
import { loadData, saveData, toLocalISOString, toLocalDateStr } from './dataStorage'
import { isRepeatTaskForToday } from '../utils/repeatUtils'

/**
 * ルーティン実行記録を取得する
 */
export function getRoutineExecutions(routineTaskId?: string, date?: string): RoutineExecution[] {
  const data = loadData()
  if (!data.routineExecutions) {
    return []
  }

  let executions = data.routineExecutions

  if (routineTaskId) {
    executions = executions.filter(e => e.routineTaskId === routineTaskId)
  }

  if (date) {
    const dateStr = date.split('T')[0]
    executions = executions.filter(e => e.date.startsWith(dateStr))
  }

  return executions.filter(e => !e.deletedAt).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * ルーティン実行記録を追加する
 */
export function addRoutineExecution(execution: Omit<RoutineExecution, 'id' | 'createdAt' | 'updatedAt'>): RoutineExecution {
  const data = loadData()
  if (!data.routineExecutions) {
    data.routineExecutions = []
  }

  const newExecution: RoutineExecution = {
    ...execution,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  data.routineExecutions.push(newExecution)
  saveData(data)
  return newExecution
}

/**
 * ルーティン実行記録を更新する
 */
export function updateRoutineExecution(id: string, updates: Partial<Omit<RoutineExecution, 'id' | 'createdAt'>>): RoutineExecution {
  const data = loadData()
  if (!data.routineExecutions) {
    throw new Error(`RoutineExecution with id ${id} not found`)
  }

  const executionIndex = data.routineExecutions.findIndex(e => e.id === id)
  if (executionIndex === -1) {
    throw new Error(`RoutineExecution with id ${id} not found`)
  }

  const updatedExecution: RoutineExecution = {
    ...data.routineExecutions[executionIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  data.routineExecutions[executionIndex] = updatedExecution
  saveData(data)
  return updatedExecution
}

/**
 * ルーティン実行記録を削除する
 */
export function deleteRoutineExecution(id: string): void {
  const data = loadData()
  if (!data.routineExecutions) {
    return
  }

  const executionIndex = data.routineExecutions.findIndex(e => e.id === id)
  if (executionIndex === -1) {
    return
  }

  const execution = data.routineExecutions[executionIndex]
  execution.deletedAt = new Date().toISOString()
  execution.updatedAt = new Date().toISOString()
  saveData(data)
}

// =====================================
// 昨日判定とSubTask完了判定のユーティリティ関数
// =====================================

/**
 * 昨日の日付文字列を取得（朝5時基準）
 */
export function getYesterdayDateStr(): string {
  const now = new Date()
  const yesterday = new Date(now)
  if (now.getHours() < 5) {
    yesterday.setDate(yesterday.getDate() - 1)
  }
  yesterday.setHours(0, 0, 0, 0)
  return toLocalDateStr(yesterday)
}

/**
 * SubTaskが昨日完了したかどうかを判定
 */
export function isSubTaskCompletedYesterday(subTask: SubTask): boolean {
  if (!subTask.completedAt) return false
  const completedDate = new Date(subTask.completedAt)
  const yesterdayStr = getYesterdayDateStr()
  const completedDateStr = toLocalDateStr(completedDate)
  return completedDateStr === yesterdayStr
}

/**
 * 昨日のRoutineExecutionを取得
 */
export function getYesterdayRoutineExecution(routineTaskId: string): RoutineExecution | undefined {
  const data = loadData()
  if (!data.routineExecutions) return undefined
  const yesterdayStr = getYesterdayDateStr()
  return data.routineExecutions.find(e => 
    e.routineTaskId === routineTaskId && e.date.startsWith(yesterdayStr) && !e.deletedAt
  )
}

/**
 * 指定した日付のRoutineExecutionを取得
 */
export function getRoutineExecutionForDate(routineTaskId: string, date: string): RoutineExecution | undefined {
  const data = loadData()
  if (!data.routineExecutions) return undefined
  return data.routineExecutions.find(e => 
    e.routineTaskId === routineTaskId && e.date.startsWith(date) && !e.deletedAt
  )
}

/**
 * 指定した日付のRoutineExecutionの完了状態を修正
 */
export function updateRoutineExecutionForDate(
  routineTaskId: string,
  date: string, // YYYY-MM-DD形式
  updates: {
    completedAt?: string | null // nullの場合は完了を取り消し
    skippedAt?: string | null // nullの場合はスキップを取り消し
  }
): RoutineExecution | null {
  const data = loadData()
  if (!data.routineExecutions) {
    data.routineExecutions = []
  }

  let execution = data.routineExecutions.find(e =>
    e.routineTaskId === routineTaskId && e.date.startsWith(date) && !e.deletedAt
  )

  if (!execution) {
    // 実行記録が存在しない場合は作成
    const newExecution: RoutineExecution = {
      id: crypto.randomUUID(),
      routineTaskId,
      date,
      completedAt: updates.completedAt || undefined,
      skippedAt: updates.skippedAt || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    data.routineExecutions.push(newExecution)
    saveData(data)
    return newExecution
  }

  // 既存の実行記録を更新
  if (updates.completedAt !== undefined) {
    execution.completedAt = updates.completedAt || undefined
    // 完了した場合はスキップを解除
    if (updates.completedAt) {
      execution.skippedAt = undefined
    }
  }
  
  if (updates.skippedAt !== undefined) {
    execution.skippedAt = updates.skippedAt || undefined
    // スキップした場合は完了を解除
    if (updates.skippedAt) {
      execution.completedAt = undefined
    }
  }

  execution.updatedAt = new Date().toISOString()
  saveData(data)
  return execution
}

/**
 * 昨日の未完了ルーティンタスクを検出
 * 朝5時時点で前日の未完了ルーティンを返す
 */
export function getIncompleteRoutinesFromYesterday(): Task[] {
  const data = loadData()
  const now = new Date()

  // 朝5時時点での「昨日」を計算
  // 現在時刻が5時未満の場合は、さらに1日前を「昨日」とする
  const yesterday = new Date(now)
  if (now.getHours() < 5) {
    yesterday.setDate(yesterday.getDate() - 1)
  }
  yesterday.setHours(0, 0, 0, 0)
  const yesterdayStr = toLocalDateStr(yesterday)

  // 昨日のルーティン実行記録を取得
  const yesterdayExecutions = data.routineExecutions?.filter(execution => {
    return execution.date.startsWith(yesterdayStr) && !execution.completedAt && !execution.skippedAt
  }) || []

  // 未完了のルーティンタスク（テンプレート）を取得
  const incompleteRoutines = yesterdayExecutions
    .map(execution => data.tasks.find(task => task.id === execution.routineTaskId))
    .filter((task): task is Task => task !== undefined && task.repeatPattern !== 'none')

  return incompleteRoutines
}

/**
 * 昨日の未完了タスクを処理し、今日の繰り返しタスクを生成
 * 朝5時時点で前日の未完了タスクを「やらなかったこと」として記録
 */
export function processIncompleteTasksFromYesterday(): void {
  const data = loadData()
  const now = new Date()

  // 朝5時時点での「昨日」を計算
  // 現在時刻が5時未満の場合は、さらに1日前を「昨日」とする
  const yesterday = new Date(now)
  if (now.getHours() < 5) {
    yesterday.setDate(yesterday.getDate() - 1)
  }
  yesterday.setHours(0, 0, 0, 0)
  const yesterdayStr = toLocalDateStr(yesterday)

  // 昨日作成されたタスクで、完了していないタスクを検出（非ルーティンタスク）
  const incompleteTasks = data.tasks.filter(task => {
    if (!task.createdAt) return false  // createdAtがない場合はスキップ
    if (task.repeatPattern !== 'none') return false // ルーティンタスクは別処理
    const taskDateStr = task.createdAt.split('T')[0]
    return taskDateStr === yesterdayStr &&
      !task.completedAt &&
      !task.skippedAt &&
      !task.deletedAt
  })

  // 未完了タスクに`skippedAt`を設定
  let hasUpdates = false
  for (const task of incompleteTasks) {
    task.skippedAt = toLocalISOString(new Date())
    task.updatedAt = toLocalISOString(new Date())
    hasUpdates = true
  }

  // ルーティンタスクのスキップ処理
  const routineTasks = data.tasks.filter(task => 
    task.repeatPattern !== 'none' && !task.deletedAt
  )

  if (!data.routineExecutions) {
    data.routineExecutions = []
  }

  for (const routineTask of routineTasks) {
    // 昨日の実行記録を取得
    const yesterdayExecution = data.routineExecutions.find(e =>
      e.routineTaskId === routineTask.id && e.date.startsWith(yesterdayStr) && !e.deletedAt
    )

    // 昨日の実行記録が存在し、完了もスキップもされていない場合
    if (yesterdayExecution && !yesterdayExecution.completedAt && !yesterdayExecution.skippedAt) {
      // SubTaskの完了状況をチェック
      const subTasks = data.subTasks?.filter(st => 
        st.taskId === routineTask.id && !st.deletedAt
      ) || []

      // SubTaskがある場合：すべてのSubTaskが昨日完了しているかチェック
      // SubTaskがない場合：ルーティン自体が完了していないのでスキップ
      let shouldSkip = false
      
      if (subTasks.length > 0) {
        // すべてのSubTaskが昨日完了していない場合、スキップとして記録
        const allSubTasksCompletedYesterday = subTasks.every(st => {
          if (!st.completedAt) return false
          const completedDateStr = toLocalDateStr(new Date(st.completedAt))
          return completedDateStr === yesterdayStr
        })
        shouldSkip = !allSubTasksCompletedYesterday
      } else {
        // SubTaskがない場合は、親タスク自体が未完了ならスキップ
        shouldSkip = true
      }

      if (shouldSkip) {
        // スキップ記録を設定
        yesterdayExecution.skippedAt = toLocalISOString(new Date())
        yesterdayExecution.updatedAt = toLocalISOString(new Date())
        hasUpdates = true
      }
    }
  }

  if (hasUpdates) {
    saveData(data)
  }

  // 今日のルーティン実行記録を生成
  ensureTodayRoutineExecutions()
}

/**
 * 今日のルーティン実行記録を生成
 */
export function ensureTodayRoutineExecutions(): void {
  const data = loadData()
  const today = toLocalDateStr(new Date())

  // 繰り返しタスク（テンプレート）を取得（削除済みを除く）
  const routineTasks = data.tasks.filter(task => task.repeatPattern !== 'none' && !task.deletedAt)

  if (!data.routineExecutions) {
    data.routineExecutions = []
  }

  let hasNewExecutions = false

  for (const routineTask of routineTasks) {
    // 今日の実行記録が既に存在するかチェック
    const todayExecution = data.routineExecutions.find(e =>
      e.routineTaskId === routineTask.id && e.date.startsWith(today)
    )

    // 存在しない場合、新しい実行記録を生成
    if (!todayExecution) {
      // 今日に該当するかチェック
      if (isRepeatTaskForToday(routineTask)) {
        addRoutineExecution({
          routineTaskId: routineTask.id,
          date: today,
        })
        hasNewExecutions = true
      }
    }
  }

  if (hasNewExecutions) {
    // saveDataはaddRoutineExecution内で既に呼ばれているが、念のため
    saveData(data)
  }
}

