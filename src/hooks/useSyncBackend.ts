// GitHub/Cloudflare共通の同期フック
// どちらの同期バックエンドが有効かを判定し、統一されたインターフェースで同期を行う

import { useState, useCallback, useEffect, useRef } from 'react'
import { useGitHub, loadGitHubConfig } from './useGitHub'
import { useCloudflare } from './useCloudflare'

export type SyncBackendType = 'github' | 'cloudflare' | 'none'
export type SyncResult = 'pulled' | 'pushed' | 'up-to-date' | 'conflict' | 'skipped' | 'error'

// データ変更イベント名
export const DATA_CHANGED_EVENT = 'mytcc2:data-changed'

/**
 * データが変更されたことを通知するユーティリティ関数
 * useTasks などから呼び出される
 */
export function notifyDataChanged(): void {
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT))
}

interface UseSyncBackendReturn {
  backendType: SyncBackendType
  syncing: boolean
  error: string | null
  lastSyncedAt: Date | null
  pendingChanges: boolean
  syncNow: () => Promise<SyncResult>
  markDataChanged: () => void
  clearPendingChanges: () => void
}

// デバウンス時間（ミリ秒）
const DEBOUNCE_MS = 3000

/**
 * 有効な同期バックエンドを判定
 */
export function detectSyncBackend(): SyncBackendType {
  // GitHub設定をチェック
  const githubConfig = loadGitHubConfig()
  if (githubConfig && githubConfig.token && githubConfig.owner && githubConfig.repo) {
    return 'github'
  }

  // Cloudflare設定をチェック
  try {
    const cfConfigStr = localStorage.getItem('mytcc2_cloudflare_config')
    if (cfConfigStr) {
      const cfConfig = JSON.parse(cfConfigStr)
      if (cfConfig && cfConfig.apiUrl) {
        return 'cloudflare'
      }
    }
  } catch (e) {
    // パースエラーは無視
  }

  return 'none'
}

/**
 * 統一された同期インターフェースを提供するフック
 */
export function useSyncBackend(): UseSyncBackendReturn {
  const github = useGitHub()
  const cloudflare = useCloudflare()

  const [backendType, setBackendType] = useState<SyncBackendType>(() => detectSyncBackend())
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [pendingChanges, setPendingChanges] = useState(false)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSyncingRef = useRef(false)

  // バックエンドタイプの再検出
  useEffect(() => {
    const newType = detectSyncBackend()
    setBackendType(newType)
  }, [github.config, cloudflare.config])

  /**
   * 同期を実行
   */
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (backendType === 'none') {
      return 'skipped'
    }

    // 既に同期中の場合はスキップ
    if (isSyncingRef.current) {
      return 'skipped'
    }

    isSyncingRef.current = true
    setSyncing(true)
    setError(null)

    try {
      let result: 'pulled' | 'pushed' | 'up-to-date' | 'conflict'

      if (backendType === 'github') {
        result = await github.syncBidirectional()
      } else {
        result = await cloudflare.syncBidirectional()
      }

      setLastSyncedAt(new Date())
      setPendingChanges(false)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '同期に失敗しました'
      setError(errorMessage)
      console.error(`[useSyncBackend] Sync failed (${backendType}):`, err)
      return 'error'
    } finally {
      setSyncing(false)
      isSyncingRef.current = false
    }
  }, [backendType, github, cloudflare])

  /**
   * データが変更されたことをマーク（デバウンス付き自動同期をトリガー）
   */
  const markDataChanged = useCallback(() => {
    if (backendType === 'none') {
      return
    }

    setPendingChanges(true)

    // 既存のタイマーをクリア
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // デバウンス付きで同期をスケジュール
    debounceTimerRef.current = setTimeout(async () => {
      const result = await syncNow()
      if (result === 'error') {
        // エラーの場合は通知のみ（UIはブロックしない）
        console.warn('[useSyncBackend] Auto-sync failed, will retry on next change')
      }
    }, DEBOUNCE_MS)
  }, [backendType, syncNow])

  /**
   * pendingChangesフラグをクリア（手動同期成功時など）
   */
  const clearPendingChanges = useCallback(() => {
    setPendingChanges(false)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // カスタムイベントでデータ変更を検知
  useEffect(() => {
    const handleDataChanged = () => {
      markDataChanged()
    }

    window.addEventListener(DATA_CHANGED_EVENT, handleDataChanged)
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, handleDataChanged)
    }
  }, [markDataChanged])

  // 終了時の同期（beforeunload / visibilitychange）
  useEffect(() => {
    if (backendType === 'none') {
      return
    }

    const handleBeforeUnload = () => {
      // ページ離脱時にpendingChangesがあれば同期を試みる
      // 注意: 非同期処理の完了は保証されない
      if (pendingChanges && !isSyncingRef.current) {
        // sendBeaconを使う場合はここで実装
        // 現在は単純にsyncNowを呼び出す（完了は保証されない）
        syncNow().catch(() => {
          // エラーは無視（ページ離脱時のため）
        })
      }
    }

    const handleVisibilityChange = () => {
      // ページが非表示になった時に同期を試みる
      if (document.visibilityState === 'hidden' && pendingChanges && !isSyncingRef.current) {
        syncNow().catch(() => {
          // エラーは無視
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [backendType, pendingChanges, syncNow])

  return {
    backendType,
    syncing: syncing || github.syncing || cloudflare.syncing,
    error: error || github.error || cloudflare.error,
    lastSyncedAt,
    pendingChanges,
    syncNow,
    markDataChanged,
    clearPendingChanges,
  }
}

