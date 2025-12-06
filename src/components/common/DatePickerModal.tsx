import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface DatePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (date: Date) => void
  defaultDate?: Date
  title?: string
}

export default function DatePickerModal({
  isOpen,
  onClose,
  onConfirm,
  defaultDate = new Date(),
  title = '日付を選択',
}: DatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return defaultDate.toISOString().split('T')[0]
  })

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  console.log('DatePickerModal render, isOpen:', isOpen, 'mounted:', mounted)

  if (!isOpen || !mounted) return null

  const handleConfirm = () => {
    const date = new Date(selectedDate)
    date.setHours(0, 0, 0, 0)
    onConfirm(date)
    onClose()
  }

  const handleToday = () => {
    const today = new Date()
    setSelectedDate(today.toISOString().split('T')[0])
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card-industrial p-6 max-w-md w-full mx-4 border-2 border-[var(--color-accent)]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            {title}
          </h2>
          <p className="font-display text-xs text-[var(--color-text-tertiary)]">
            まとめを生成する日付を選択してください
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
              日付
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-industrial w-full"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="btn-industrial text-xs"
            >
              今日
            </button>
            <p className="font-display text-xs text-[var(--color-text-secondary)]">
              選択日: {format(new Date(selectedDate), 'yyyy年MM月dd日(E)', { locale: ja })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="btn-industrial flex-1"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            className="btn-industrial flex-1 bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:opacity-90"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

