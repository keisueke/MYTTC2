import { useState } from 'react'
import { Memo } from '../types'
import { useTasks } from '../hooks/useTasks'
import { copyToClipboard } from '../utils/export'

export default function MemoPage() {
  const {
    memos,
    memoTemplates,
    loading,
    addMemo,
    updateMemo,
    deleteMemo,
  } = useTasks()
  
  const [showForm, setShowForm] = useState(false)
  const [editingMemo, setEditingMemo] = useState<Memo | undefined>(undefined)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  const handleCreateMemo = () => {
    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }
    addMemo({ title: title.trim(), content: content.trim() })
    setTitle('')
    setContent('')
    setShowForm(false)
  }

  const handleUpdateMemo = () => {
    if (!editingMemo || !title.trim()) {
      alert('タイトルを入力してください')
      return
    }
    updateMemo(editingMemo.id, { title: title.trim(), content: content.trim() })
    setEditingMemo(undefined)
    setTitle('')
    setContent('')
    setShowForm(false)
  }

  const handleEdit = (memo: Memo) => {
    setEditingMemo(memo)
    setTitle(memo.title)
    setContent(memo.content)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('このメモを削除しますか？')) {
      deleteMemo(id)
    }
  }

  const handleCopy = async (memo: Memo) => {
    const text = `${memo.title}\n\n${memo.content || ''}`
    const success = await copyToClipboard(text)
    if (success) {
      alert('メモをクリップボードにコピーしました')
    } else {
      alert('クリップボードへのコピーに失敗しました')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingMemo(undefined)
    setTitle('')
    setContent('')
    setSelectedTemplateId('')
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (templateId) {
      const template = memoTemplates.find(t => t.id === templateId)
      if (template) {
        setTitle(template.title)
        setContent(template.content)
      }
    } else {
      setTitle('')
      setContent('')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-display text-xs tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-[var(--color-border)] pb-6">
        <div>
          <p className="font-display text-[10px] tracking-[0.3em] uppercase text-[var(--color-accent)] mb-2">
            Memo
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            メモ帳
          </h1>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingMemo(undefined)
              setTitle('')
              setContent('')
              setSelectedTemplateId('')
              setShowForm(true)
            }}
            className="btn-industrial"
          >
            ＋新規メモ
          </button>
        )}
      </div>

      {showForm ? (
        <div className="card-industrial p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
            <div>
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
                {editingMemo ? 'Edit Memo' : 'New Memo'}
              </p>
              <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                {editingMemo ? 'メモを編集' : '新しいメモを作成'}
              </h2>
            </div>
          </div>
          
          <div className="space-y-6">
            {!editingMemo && memoTemplates.length > 0 && (
              <div>
                <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                  テンプレートから選択
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="input-industrial w-full"
                >
                  <option value="">テンプレートを選択...</option>
                  {memoTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                タイトル <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-industrial w-full"
                placeholder="メモのタイトルを入力"
              />
            </div>

            <div>
              <label className="block font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-2">
                内容
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="input-industrial w-full resize-none font-body"
                placeholder="メモの内容を入力"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-industrial"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={editingMemo ? handleUpdateMemo : handleCreateMemo}
                className="btn-industrial"
              >
                {editingMemo ? '更新' : '作成'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {memos.length === 0 ? (
            <div className="card-industrial p-8 text-center">
              <p className="font-display text-sm text-[var(--color-text-tertiary)]">
                メモがありません
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memos
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map((memo) => (
                  <div
                    key={memo.id}
                    className="card-industrial p-5 group hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-display text-sm font-medium text-[var(--color-text-primary)] flex-1 line-clamp-2">
                        {memo.title}
                      </h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(memo)}
                          className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-all"
                          title="コピー"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(memo)}
                          className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)] transition-all"
                          title="編集"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(memo.id)}
                          className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all"
                          title="削除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {memo.content && (
                      <p className="font-body text-sm text-[var(--color-text-secondary)] line-clamp-4 mb-3 whitespace-pre-wrap">
                        {memo.content}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <p className="font-display text-[10px] text-[var(--color-text-tertiary)]">
                        作成: {new Date(memo.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      {memo.createdAt !== memo.updatedAt && (
                        <p className="font-display text-[10px] text-[var(--color-text-tertiary)]">
                          更新: {new Date(memo.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

