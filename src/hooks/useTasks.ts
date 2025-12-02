import { useState, useEffect, useCallback } from 'react'
import { Task, Project, Mode, Tag } from '../types'
import * as taskService from '../services/taskService'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [modes, setModes] = useState<Mode[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  // データを読み込む
  const loadData = useCallback(() => {
    try {
      setTasks(taskService.getTasks())
      setProjects(taskService.getProjects())
      setModes(taskService.getModes())
      setTags(taskService.getTags())
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

  return {
    tasks,
    projects,
    modes,
    tags,
    loading,
    addTask,
    updateTask,
    deleteTask,
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
    refresh: loadData,
  }
}

