import { usePWAInstall } from '../../hooks/usePWAInstall'

export default function InstallPrompt() {
  const { isInstallable, isInstalled, showPrompt, handleInstall, handleDismiss } = usePWAInstall()

  if (isInstalled || !isInstallable || !showPrompt) {
    return null
  }

  // iOS Safariかどうかを判定
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isIOSSafari = isIOS && isSafari

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="card-industrial p-4 border-2 border-[var(--color-accent)] shadow-lg">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h3 className="font-display text-sm font-semibold text-[var(--color-text-primary)] mb-1">
              アプリをインストール
            </h3>
            <p className="font-display text-xs text-[var(--color-text-secondary)]">
              {isIOSSafari
                ? 'ホーム画面に追加して、アプリのように使用できます'
                : 'ホーム画面に追加して、アプリのように使用できます'}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isIOSSafari ? (
          <div className="space-y-3">
            <div className="p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
              <p className="font-display text-xs text-[var(--color-text-secondary)] mb-2">
                <strong className="text-[var(--color-text-primary)]">インストール手順:</strong>
              </p>
              <ol className="font-display text-xs text-[var(--color-text-secondary)] space-y-1 list-decimal list-inside">
                <li>下部の共有ボタン <svg className="inline w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg> をタップ</li>
                <li>「ホーム画面に追加」を選択</li>
                <li>「追加」をタップ</li>
              </ol>
            </div>
            <button
              onClick={handleDismiss}
              className="btn-industrial w-full"
            >
              了解しました
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="btn-industrial flex-1"
            >
              インストール
            </button>
            <button
              onClick={handleDismiss}
              className="btn-industrial"
            >
              後で
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

