// 同期状態を管理するコンテキスト
// アプリ全体で同期バックエンド（GitHub/Cloudflare）の状態を共有する

import { createContext, useContext, ReactNode } from 'react'
import { useSyncBackend, SyncBackendType, SyncResult } from '../hooks/useSyncBackend'

interface SyncContextValue {
  backendType: SyncBackendType
  syncing: boolean
  error: string | null
  lastSyncedAt: Date | null
  pendingChanges: boolean
  syncNow: () => Promise<SyncResult>
  markDataChanged: () => void
  clearPendingChanges: () => void
}

const SyncContext = createContext<SyncContextValue | null>(null)

interface SyncProviderProps {
  children: ReactNode
}

export function SyncProvider({ children }: SyncProviderProps) {
  const syncBackend = useSyncBackend()

  return (
    <SyncContext.Provider value={syncBackend}>
      {children}
    </SyncContext.Provider>
  )
}

/**
 * 同期コンテキストを使用するフック
 */
export function useSync(): SyncContextValue {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}

/**
 * 同期コンテキストを安全に使用するフック（プロバイダー外でも動作）
 */
export function useSyncSafe(): SyncContextValue | null {
  return useContext(SyncContext)
}

