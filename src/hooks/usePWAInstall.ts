import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const INSTALL_DISMISSED_KEY = 'pwa_install_dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7日間

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // インストール済みかどうかをチェック
    const checkInstalled = () => {
      // スタンドアロンモードで実行されているかチェック
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return true
      }
      
      // iOS Safariの場合
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true)
        return true
      }
      
      return false
    }

    if (checkInstalled()) {
      return
    }

    // 以前にプロンプトを閉じたかチェック
    const dismissedTime = localStorage.getItem(INSTALL_DISMISSED_KEY)
    if (dismissedTime) {
      const timeDiff = Date.now() - parseInt(dismissedTime, 10)
      if (timeDiff < DISMISS_DURATION) {
        return // まだ表示しない
      }
    }

    // beforeinstallpromptイベントのリッスン（Android Chrome等）
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsInstallable(true)
      setShowPrompt(true)
    }

    // インストール後のイベント
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // iOS Safariの場合は常に表示可能として扱う（手動インストールの案内）
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    
    if (isIOS && isSafari && !checkInstalled()) {
      setIsInstallable(true)
      setShowPrompt(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android Chrome等の場合
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true)
        setShowPrompt(false)
      }
      
      setDeferredPrompt(null)
      setIsInstallable(false)
    } else {
      // iOS Safariの場合、手動インストールの案内を表示
      // 実際のインストールはユーザーが手動で行う必要がある
      setShowPrompt(true)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString())
  }

  return {
    isInstallable,
    isInstalled,
    showPrompt,
    handleInstall,
    handleDismiss,
  }
}

