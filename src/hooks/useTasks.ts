import { useState, useEffect, useCallback } from 'react'
import { Task, Project, Mode, Tag, Wish, Goal, Memo, MemoTemplate } from '../types'
import * as taskService from '../services/taskService'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [modes, setModes] = useState<Mode[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [wishes, setWishes] = useState<Wish[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [memoTemplates, setMemoTemplates] = useState<MemoTemplate[]>([])
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
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初回読み込み
  useEffect(() => {
    loadData()
  }, [loadData])

  // タスクを追加
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask = taskService.addTask(task)
      setTasks(prev => [...prev, newTask])
      return newTask
    } catch (error) {
      console.error('Failed to add task:', error)
      throw error
    }
  }, [])

  // タスクを更新
  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    try {
      const updatedTask = taskService.updateTask(id, updates)
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      return updatedTask
    } catch (error) {
      console.error('Failed to update task:', error)
      throw error
    }
  }, [])

  // タスクを削除
  const deleteTask = useCallback((id: string) => {
    try {
      taskService.deleteTask(id)
      setTasks(prev => prev.filter(t => t.id !== id))
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
    } catch (error) {
      console.error('Failed to delete memo template:', error)
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
    refresh: loadData,
  }
}

