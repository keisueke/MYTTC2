import { useState, useEffect, useCallback } from 'react'
import { Task, Category } from '../types'
import * as taskService from '../services/taskService'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // データを読み込む
  const loadData = useCallback(() => {
    try {
      setTasks(taskService.getTasks())
      setCategories(taskService.getCategories())
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

  // タスクの完了状態を切り替え
  const toggleTaskCompletion = useCallback((id: string) => {
    try {
      const updatedTask = taskService.toggleTaskCompletion(id)
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      return updatedTask
    } catch (error) {
      console.error('Failed to toggle task completion:', error)
      throw error
    }
  }, [])

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

  // カテゴリを追加
  const addCategory = useCallback((category: Omit<Category, 'id' | 'createdAt'>) => {
    try {
      const newCategory = taskService.addCategory(category)
      setCategories(prev => [...prev, newCategory])
      return newCategory
    } catch (error) {
      console.error('Failed to add category:', error)
      throw error
    }
  }, [])

  // カテゴリを更新
  const updateCategory = useCallback((id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>) => {
    try {
      const updatedCategory = taskService.updateCategory(id, updates)
      setCategories(prev => prev.map(c => c.id === id ? updatedCategory : c))
      return updatedCategory
    } catch (error) {
      console.error('Failed to update category:', error)
      throw error
    }
  }, [])

  // カテゴリを削除
  const deleteCategory = useCallback((id: string) => {
    try {
      taskService.deleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      // 関連するタスクのcategoryIdも更新されるため、タスクを再読み込み
      setTasks(taskService.getTasks())
    } catch (error) {
      console.error('Failed to delete category:', error)
      throw error
    }
  }, [])

  return {
    tasks,
    categories,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    startTaskTimer,
    stopTaskTimer,
    resetTaskTimer,
    addCategory,
    updateCategory,
    deleteCategory,
    refresh: loadData,
  }
}

