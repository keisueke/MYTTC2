import { useState, useEffect, useCallback } from 'react'
import { Task, Project, Mode, Tag, Wish, Goal, Memo, MemoTemplate, SubTask, DailyRecord, RoutineExecution } from '../types'
import * as taskService from '../services/taskService'
import { notifyDataChanged } from './useSyncBackend'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [modes, setModes] = useState<Mode[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [wishes, setWishes] = useState<Wish[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [memoTemplates, setMemoTemplates] = useState<MemoTemplate[]>([])
  const [subTasks, setSubTasks] = useState<SubTask[]>([])
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([])
  const [routineExecutions, setRoutineExecutions] = useState<RoutineExecution[]>([])
  const [loading, setLoading] = useState(true)

  // データを読み込む
  const loadData = useCallback(() => {
    try {
      setTasks(taskService.getTasks())
      setProjects(taskService.getProjects())
      setModes(taskService.getModes())
      setTags(taskService.getTags())
      setWishes(taskService.getWishes())
      setGoals(taskService.getGoals())
      setMemos(taskService.getMemos())
      setMemoTemplates(taskService.getMemoTemplates())
      setSubTasks(taskService.getSubTasks())
      setDailyRecords(taskService.getDailyRecords())
      setRoutineExecutions(taskService.getRoutineExecutions())
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初回読み込み
  useEffect(() => {
    loadData()
    // 現在時刻が朝5時を過ぎている場合は、昨日の未完了タスクを処理
    const now = new Date()
    if (now.getHours() >= 5) {
      taskService.processIncompleteTasksFromYesterday()
    } else {
      // 朝5時前の場合は、通常のルーティン実行記録生成のみ
      taskService.ensureTodayRoutineExecutions()
    }
  }, [loadData])

  // 朝5時のタイミングを監視
  useEffect(() => {
    let lastProcessedHour = -1
    
    const checkMorning5AM = () => {
      const now = new Date()
      const hour = now.getHours()
      const minute = now.getMinutes()
      
      // 朝5時00分〜5時01分の間で処理を実行（1回のみ）
      if (hour === 5 && minute === 0 && lastProcessedHour !== 5) {
        taskService.processIncompleteTasksFromYesterday()
        // ルーティン実行記録も生成
        taskService.ensureTodayRoutineExecutions()
        loadData()
        lastProcessedHour = 5
      } else if (hour !== 5) {
        // 5時以外の時間になったらリセット
        lastProcessedHour = -1
      }
    }
    
    // 初回チェック
    checkMorning5AM()
    
    // 1分ごとにチェック
    const interval = setInterval(() => {
      checkMorning5AM()
    }, 60000) // 1分
    
    return () => clearInterval(interval)
  }, [loadData])

  // ページがフォーカスされた時にデータを更新
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }
    
    const handleFocus = () => {
      loadData()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [loadData])

  // タスクを追加
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, referenceDate?: Date) => {
    try {
      const newTask = taskService.addTask(task, referenceDate)
      setTasks(prev => [...prev, newTask])
      notifyDataChanged()
      return newTask
    } catch (error) {
      console.error('Failed to add task:', error)
      throw error
    }
  }, [])

  // タスクを更新
  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>, referenceDate?: Date) => {
    try {
      const updatedTask = taskService.updateTask(id, updates)
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      
      // ルーティンタスクの場合、RoutineExecutionも更新
      if (updatedTask.repeatPattern !== 'none') {
        const today = referenceDate || new Date()
        const todayStr = taskService.toLocalDateStr(today)
        
        // 今日のRoutineExecutionを検索
        const existingExecution = routineExecutions.find(e => 
          e.routineTaskId === id && e.date.startsWith(todayStr)
        )
        
        if (existingExecution) {
          // 更新に経過時間、開始時刻、終了時刻、完了時刻が含まれている場合はRoutineExecutionも更新
          const executionUpdates: Partial<Omit<RoutineExecution, 'id' | 'createdAt'>> = {}
          
          if (updates.elapsedTime !== undefined) {
            executionUpdates.elapsedTime = updates.elapsedTime
          }
          if (updates.startTime !== undefined) {
            executionUpdates.startTime = updates.startTime
          }
          if (updates.endTime !== undefined) {
            executionUpdates.endTime = updates.endTime
          }
          if (updates.completedAt !== undefined) {
            executionUpdates.completedAt = updates.completedAt
          }
          // startTimeとendTimeの両方がある場合は完了とみなす
          if (updates.startTime && updates.endTime && !updates.completedAt) {
            executionUpdates.completedAt = updates.endTime
          }
          
          if (Object.keys(executionUpdates).length > 0) {
            taskService.updateRoutineExecution(existingExecution.id, executionUpdates)
            setRoutineExecutions(taskService.getRoutineExecutions())
          }
        }
      }
      
      notifyDataChanged()
      return updatedTask
    } catch (error) {
      console.error('Failed to update task:', error)
      throw error
    }
  }, [routineExecutions])

  // タスクを削除
  const deleteTask = useCallback((id: string) => {
    try {
      taskService.deleteTask(id)
      setTasks(prev => prev.filter(t => t.id !== id))
      notifyDataChanged()
    } catch (error) {
      console.error('Failed to delete task:', error)
      throw error
    }
  }, [])

  // タスクをコピー
  const copyTask = useCallback((id: string) => {
    try {
      const newTask = taskService.copyTask(id)
      setTasks(prev => [...prev, newTask])
      notifyDataChanged()
      return newTask
    } catch (error) {
      console.error('Failed to copy task:', error)
      throw error
    }
  }, [])

  // タスクの順番を移動（ドラッグ&ドロップ用）
  const moveTaskToPosition = useCallback((taskId: string, newIndex: number, filteredTaskIds: string[]) => {
    try {
      taskService.moveTaskToPosition(taskId, newIndex, filteredTaskIds)
      loadData() // 順番が変わったので全体を再読み込み
      notifyDataChanged()
    } catch (error) {
      console.error('Failed to move task:', error)
      throw error
    }
  }, [loadData])


  // タスクのタイマーを開始
  const startTaskTimer = useCallback((id: string) => {
    try {
      const updatedTask = taskService.startTaskTimer(id)
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      // ルーティンタスクの場合は、routineExecutionsも更新
      // taskServiceで更新された最新の状態を取得
      if (updatedTask.repeatPattern !== 'none') {
        const today = taskService.toLocalDateStr(new Date())
        const latestExecutions = taskService.getRoutineExecutions(id, today)
        if (latestExecutions.length > 0) {
          const updatedExecution = latestExecutions[0]
          setRoutineExecutions(prev => {
            const existingIndex = prev.findIndex(e => e.id === updatedExecution.id)
            if (existingIndex >= 0) {
              return prev.map(e => e.id === updatedExecution.id ? updatedExecution : e)
            } else {
              return [...prev, updatedExecution]
            }
          })
        }
      }
      notifyDataChanged()
      return updatedTask
    } catch (error) {
      console.error('Failed to start task timer:', error)
      throw error
    }
  }, [])

  // タスクのタイマーを停止
  const stopTaskTimer = useCallback((id: string) => {
    try {
      const updatedTask = taskService.stopTaskTimer(id)
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      // ルーティンタスクの場合は、routineExecutionsも更新
      // taskServiceで更新された最新の状態を取得
      if (updatedTask.repeatPattern !== 'none') {
        const today = taskService.toLocalDateStr(new Date())
        const latestExecutions = taskService.getRoutineExecutions(id, today)
        if (latestExecutions.length > 0) {
          const updatedExecution = latestExecutions[0]
          setRoutineExecutions(prev => {
            const existingIndex = prev.findIndex(e => e.id === updatedExecution.id)
            if (existingIndex >= 0) {
              return prev.map(e => e.id === updatedExecution.id ? updatedExecution : e)
            } else {
              return [...prev, updatedExecution]
            }
          })
        }
      }
      notifyDataChanged()
      return updatedTask
    } catch (error) {
      console.error('Failed to stop task timer:', error)
      throw error
    }
  }, [])

  // タスクのタイマーをリセット
  const resetTaskTimer = useCallback((id: string) => {
    try {
      const updatedTask = taskService.resetTaskTimer(id)
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      notifyDataChanged()
      return updatedTask
    } catch (error) {
      console.error('Failed to reset task timer:', error)
      throw error
    }
  }, [])

  // プロジェクトを追加
  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const newProject = taskService.addProject(project)
      setProjects(prev => [...prev, newProject])
      notifyDataChanged()
      return newProject
    } catch (error) {
      console.error('Failed to add project:', error)
      throw error
    }
  }, [])

  // プロジェクトを更新
  const updateProject = useCallback((id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    try {
      const updatedProject = taskService.updateProject(id, updates)
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p))
      notifyDataChanged()
      return updatedProject
    } catch (error) {
      console.error('Failed to update project:', error)
      throw error
    }
  }, [])

  // プロジェクトを削除
  const deleteProject = useCallback((id: string) => {
    try {
      taskService.deleteProject(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      setTasks(taskService.getTasks())
      notifyDataChanged()
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  }, [])

  // モードを追加
  const addMode = useCallback((mode: Omit<Mode, 'id' | 'createdAt'>) => {
    try {
      const newMode = taskService.addMode(mode)
      setModes(prev => [...prev, newMode])
      notifyDataChanged()
      return newMode
    } catch (error) {
      console.error('Failed to add mode:', error)
      throw error
    }
  }, [])

  // モードを更新
  const updateMode = useCallback((id: string, updates: Partial<Omit<Mode, 'id' | 'createdAt'>>) => {
    try {
      const updatedMode = taskService.updateMode(id, updates)
      setModes(prev => prev.map(m => m.id === id ? updatedMode : m))
      notifyDataChanged()
      return updatedMode
    } catch (error) {
      console.error('Failed to update mode:', error)
      throw error
    }
  }, [])

  // モードを削除
  const deleteMode = useCallback((id: string) => {
    try {
      taskService.deleteMode(id)
      setModes(prev => prev.filter(m => m.id !== id))
      setTasks(taskService.getTasks())
      notifyDataChanged()
    } catch (error) {
      console.error('Failed to delete mode:', error)
      throw error
    }
  }, [])

  // タグを追加
  const addTag = useCallback((tag: Omit<Tag, 'id' | 'createdAt'>) => {
    try {
      const newTag = taskService.addTag(tag)
      setTags(prev => [...prev, newTag])
      notifyDataChanged()
      return newTag
    } catch (error) {
      console.error('Failed to add tag:', error)
      throw error
    }
  }, [])

  // タグを更新
  const updateTag = useCallback((id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>) => {
    try {
      const updatedTag = taskService.updateTag(id, updates)
      setTags(prev => prev.map(t => t.id === id ? updatedTag : t))
      notifyDataChanged()
      return updatedTag
    } catch (error) {
      console.error('Failed to update tag:', error)
      throw error
    }
  }, [])

  // タグを削除
  const deleteTag = useCallback((id: string) => {
    try {
      taskService.deleteTag(id)
      setTags(prev => prev.filter(t => t.id !== id))
      setTasks(taskService.getTasks())
      notifyDataChanged()
    } catch (error) {
      console.error('Failed to delete tag:', error)
      throw error
    }
  }, [])

  // Wishを追加
  const addWish = useCallback((wish: Omit<Wish, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newWish = taskService.addWish(wish)
      setWishes(prev => [...prev, newWish])
      notifyDataChanged()
      return newWish
    } catch (error) {
      console.error('Failed to add wish:', error)
      throw error
    }
  }, [])

  // Wishを更新
  const updateWish = useCallback((id: string, updates: Partial<Omit<Wish, 'id' | 'createdAt'>>) => {
    try {
      const updatedWish = taskService.updateWish(id, updates)
      setWishes(prev => prev.map(w => w.id === id ? updatedWish : w))
      notifyDataChanged()
      return updatedWish
    } catch (error) {
      console.error('Failed to update wish:', error)
      throw error
    }
  }, [])

  // Wishを削除
  const deleteWish = useCallback((id: string) => {
    try {
      taskService.deleteWish(id)
      setWishes(prev => prev.filter(w => w.id !== id))
      notifyDataChanged()
    } catch (error) {
      console.error('Failed to delete wish:', error)
      throw error
    }
  }, [])

  // Goalを追加
  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newGoal = taskService.addGoal(goal)
      setGoals(prev => [...prev, newGoal])
      notifyDataChanged()
      return newGoal
    } catch (error) {
      console.error('Failed to add goal:', error)
      throw error
    }
  }, [])

  // Goalを更新
  const updateGoal = useCallback((id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => {
    try {
      const updatedGoal = taskService.updateGoal(id, updates)
      setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g))
      notifyDataChanged()
      return updatedGoal
    } catch (error) {
      console.error('Failed to update goal:', error)
      throw error
    }
  }, [])

  // Goalを削除
  const deleteGoal = useCallback((id: string) => {
    try {
      taskService.deleteGoal(id)
      setGoals(prev => prev.filter(g => g.id !== id))
      notifyDataChanged()
    } catch (error) {
      console.error('Failed to delete goal:', error)
      throw error
    }
  }, [])

  // Memoを追加
  const addMemo = useCallback((memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newMemo = taskService.addMemo(memo)
      setMemos(prev => [...prev, newMemo])
      notifyDataChanged()
      return newMemo
    } catch (error) {
      console.error('Failed to add memo:', error)
      throw error
    }
  }, [])

  // Memoを更新
  const updateMemo = useCallback((id: string, updates: Partial<Omit<Memo, 'id' | 'createdAt'>>) => {
    try {
      const updatedMemo = taskService.updateMemo(id, updates)
      setMemos(prev => prev.map(m => m.id === id ? updatedMemo : m))
      notifyDataChanged()
      return updatedMemo
    } catch (error) {
      console.error('Failed to update memo:', error)
      throw error
    }
  }, [])

  // Memoを削除
  const deleteMemo = useCallback((id: string) => {
    try {
      taskService.deleteMemo(id)
      setMemos(prev => prev.filter(m => m.id !== id))
      notifyDataChanged()
    } catch (error) {
      console.error('Failed to delete memo:', error)
      throw error
    }
  }, [])

  // MemoTemplateを追加
  const addMemoTemplate = useCallback((template: Omit<MemoTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTemplate = taskService.addMemoTemplate(template)
      setMemoTemplates(prev => [...prev, newTemplate])
      notifyDataChanged()
      return newTemplate
    } catch (error) {
      console.error('Failed to add memo template:', error)
      throw error
    }
  }, [])

  // MemoTemplateを更新
  const updateMemoTemplate = useCallback((id: string, updates: Partial<Omit<MemoTemplate, 'id' | 'createdAt'>>) => {
    try {
      const updatedTemplate = taskService.updateMemoTemplate(id, updates)
      setMemoTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t))
      notifyDataChanged()
      return updatedTemplate
    } catch (error) {
      console.error('Failed to update memo template:', error)
      throw error
    }
  }, [])

  // MemoTemplateを削除
  const deleteMemoTemplate = useCallback((id: string) => {
    try {
      taskService.deleteMemoTemplate(id)
      setMemoTemplates(prev => prev.filter(t => t.id !== id))
      notifyDataChanged()
    } catch (error) {
      console.error('Failed to delete memo template:', error)
      throw error
    }
  }, [])

  // SubTaskを取得
  const getSubTasks = useCallback((taskId?: string): SubTask[] => {
    try {
      return taskService.getSubTasks(taskId)
    } catch (error) {
      console.error('Failed to get sub tasks:', error)
      return []
    }
  }, [])

  // SubTaskを追加
  const addSubTask = useCallback((subTask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'>): SubTask => {
    try {
      const newSubTask = taskService.addSubTask(subTask)
      setSubTasks(prev => [...prev, newSubTask])
      notifyDataChanged()
      return newSubTask
    } catch (error) {
      console.error('Failed to add sub task:', error)
      throw error
    }
  }, [])

  // SubTaskを更新
  const updateSubTask = useCallback((id: string, updates: Partial<Omit<SubTask, 'id' | 'createdAt'>>): SubTask => {
    try {
      const updatedSubTask = taskService.updateSubTask(id, updates)
      setSubTasks(prev => prev.map(st => st.id === id ? updatedSubTask : st))
      notifyDataChanged()
      return updatedSubTask
    } catch (error) {
      console.error('Failed to update sub task:', error)
      throw error
    }
  }, [])

  // SubTaskを削除
  const deleteSubTask = useCallback((id: string) => {
    try {
      taskService.deleteSubTask(id)
      setSubTasks(prev => prev.filter(st => st.id !== id))
      notifyDataChanged()
    } catch (error) {
      console.error('Failed to delete sub task:', error)
      throw error
    }
  }, [])

  // SubTaskの完了状態を切り替え
  const toggleSubTaskComplete = useCallback((id: string, completed: boolean) => {
    try {
      taskService.toggleSubTaskComplete(id, completed)
      setSubTasks(prev => prev.map(st => 
        st.id === id 
          ? { ...st, completedAt: completed ? new Date().toISOString() : undefined, updatedAt: new Date().toISOString() }
          : st
      ))
      notifyDataChanged()
    } catch (error) {
      console.error('Failed to toggle sub task complete:', error)
      throw error
    }
  }, [])

  // RoutineExecutionを取得
  const getRoutineExecutions = useCallback((routineTaskId?: string, date?: string): RoutineExecution[] => {
    return taskService.getRoutineExecutions(routineTaskId, date)
  }, [])

  // RoutineExecutionを追加
  const addRoutineExecution = useCallback((execution: Omit<RoutineExecution, 'id' | 'createdAt' | 'updatedAt'>): RoutineExecution => {
    try {
      const newExecution = taskService.addRoutineExecution(execution)
      setRoutineExecutions(prev => [...prev, newExecution])
      notifyDataChanged()
      return newExecution
    } catch (error) {
      console.error('Failed to add routine execution:', error)
      throw error
    }
  }, [])

  // RoutineExecutionを更新
  const updateRoutineExecution = useCallback((id: string, updates: Partial<Omit<RoutineExecution, 'id' | 'createdAt'>>): RoutineExecution => {
    try {
      const updatedExecution = taskService.updateRoutineExecution(id, updates)
      setRoutineExecutions(prev => prev.map(e => e.id === id ? updatedExecution : e))
      notifyDataChanged()
      return updatedExecution
    } catch (error) {
      console.error('Failed to update routine execution:', error)
      throw error
    }
  }, [])

  // RoutineExecutionを削除
  const deleteRoutineExecution = useCallback((id: string) => {
    try {
      taskService.deleteRoutineExecution(id)
      setRoutineExecutions(prev => prev.filter(e => e.id !== id))
      notifyDataChanged()
    } catch (error) {
      console.error('Failed to delete routine execution:', error)
      throw error
    }
  }, [])

  return {
    tasks,
    projects,
    modes,
    tags,
    wishes,
    goals,
    loading,
    addTask,
    updateTask,
    deleteTask,
    copyTask,
    moveTaskToPosition,
    startTaskTimer,
    stopTaskTimer,
    resetTaskTimer,
    addProject,
    updateProject,
    deleteProject,
    addMode,
    updateMode,
    deleteMode,
    addTag,
    updateTag,
    deleteTag,
    addWish,
    updateWish,
    deleteWish,
    addGoal,
    updateGoal,
    deleteGoal,
    memos,
    addMemo,
    updateMemo,
    deleteMemo,
    memoTemplates,
    addMemoTemplate,
    updateMemoTemplate,
    deleteMemoTemplate,
    subTasks,
    getSubTasks,
    addSubTask,
    updateSubTask,
    deleteSubTask,
    toggleSubTaskComplete,
    dailyRecords,
    routineExecutions,
    getRoutineExecutions,
    addRoutineExecution,
    updateRoutineExecution,
    deleteRoutineExecution,
    refresh: loadData,
  }
}

