import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // フェードアウトのアニメーション時間
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const bgColor = 
    type === 'success' ? 'bg-[var(--color-secondary)]' :
    type === 'error' ? 'bg-[var(--color-error)]' :
    'bg-[var(--color-accent)]'

  return (
    <div
      className={`${bgColor} text-white px-4 py-2 rounded-lg shadow-lg min-w-[200px] max-w-[400px] animate-fade-in-up transition-opacity duration-300`}
      style={{
        opacity: isVisible ? 1 : 0,
      }}
    >
      <p className="font-display text-sm">{message}</p>
    </div>
  )
}

