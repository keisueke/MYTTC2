import { ConflictInfo, ConflictResolution } from '../../types'

interface ConflictResolutionDialogProps {
  conflictInfo: ConflictInfo
  onResolve: (resolution: ConflictResolution) => void
  onCancel: () => void
}

export default function ConflictResolutionDialog({
  conflictInfo,
  onResolve,
  onCancel,
}: ConflictResolutionDialogProps) {
  const formatDate = (date: Date | null): string => {
    if (!date) return '不明'
    return new Date(date).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const localDate = conflictInfo.localLastModified
  const remoteDate = conflictInfo.remoteLastModified

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card-industrial p-6 max-w-2xl w-full mx-4 border-2 border-[var(--color-accent)]">
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            同期競合が発生しました
          </h2>
          <p className="font-display text-sm text-[var(--color-text-secondary)]">
            ローカルとリモートのデータが競合しています。どちらを優先するか選択してください。
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-sm font-semibold text-[var(--color-text-primary)]">
                ローカルデータ
              </span>
              <span className="font-display text-xs text-[var(--color-text-tertiary)]">
                最終更新: {formatDate(localDate)}
              </span>
            </div>
            <div className="space-y-1 text-xs text-[var(--color-text-secondary)]">
              <p>タスク: {conflictInfo.localData.tasks?.length || 0}件</p>
              <p>プロジェクト: {conflictInfo.localData.projects?.length || 0}件</p>
              <p>目標: {conflictInfo.localData.goals?.length || 0}件</p>
            </div>
          </div>

          <div className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-sm font-semibold text-[var(--color-text-primary)]">
                リモートデータ
              </span>
              <span className="font-display text-xs text-[var(--color-text-tertiary)]">
                最終更新: {formatDate(remoteDate)}
              </span>
            </div>
            <div className="space-y-1 text-xs text-[var(--color-text-secondary)]">
              <p>タスク: {conflictInfo.remoteData.tasks?.length || 0}件</p>
              <p>プロジェクト: {conflictInfo.remoteData.projects?.length || 0}件</p>
              <p>目標: {conflictInfo.remoteData.goals?.length || 0}件</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onResolve('local')}
            className="btn-industrial flex-1 bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:opacity-90"
          >
            ローカルを優先
          </button>
          <button
            onClick={() => onResolve('remote')}
            className="btn-industrial flex-1 hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)]"
          >
            リモートを優先
          </button>
          <button
            onClick={onCancel}
            className="btn-industrial px-4 hover:bg-[var(--color-bg-tertiary)]"
          >
            キャンセル
          </button>
        </div>

        <div className="mt-4 p-3 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30">
          <p className="font-display text-xs text-[var(--color-warning)]">
            注意: 選択したデータで上書きされます。上書きされない方の変更は失われます。
          </p>
        </div>
      </div>
    </div>
  )
}

