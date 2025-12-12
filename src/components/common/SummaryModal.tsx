import { useState } from 'react'
import { copyToClipboard, downloadText } from '../../utils/export'

interface SummaryModalProps {
    isOpen: boolean
    summary: string
    title: string
    onClose: () => void
    onCopySuccess?: () => void
    onCopyError?: () => void
}

/**
 * まとめ表示モーダル
 * iOS Safari対応: 同期的なコピーボタンを提供
 */
export default function SummaryModal({
    isOpen,
    summary,
    title,
    onClose,
    onCopySuccess,
    onCopyError,
}: SummaryModalProps) {
    const [copied, setCopied] = useState(false)
    const [copying, setCopying] = useState(false)

    if (!isOpen) return null

    const handleCopy = async () => {
        setCopying(true)
        try {
            const success = await copyToClipboard(summary)
            if (success) {
                setCopied(true)
                onCopySuccess?.()
                setTimeout(() => setCopied(false), 2000)
            } else {
                onCopyError?.()
            }
        } finally {
            setCopying(false)
        }
    }

    const handleDownload = () => {
        const dateStr = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '')
        downloadText(summary, `summary_${dateStr}.txt`)
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal - centered with margin for mobile */}
            <div className="relative w-full max-w-2xl my-8 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                    <div>
                        <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
                            Summary
                        </p>
                        <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
                    <pre className="font-mono text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap break-words">
                        {summary}
                    </pre>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                    <button
                        onClick={handleDownload}
                        className="btn-industrial flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>ダウンロード</span>
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={copying}
                        className={`btn-industrial flex items-center gap-2 ${copied
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-bg-primary)]'
                            }`}
                    >
                        {copied ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>コピー完了</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>{copying ? 'コピー中...' : 'コピー'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
