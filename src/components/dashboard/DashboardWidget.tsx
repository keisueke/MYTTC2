import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DashboardWidgetId } from '../../types'

interface DashboardWidgetProps {
  id: DashboardWidgetId
  isEditMode: boolean
  visible: boolean
  onToggleVisible: () => void
  children: React.ReactNode
}

export default function DashboardWidget({
  id,
  isEditMode,
  visible,
  onToggleVisible,
  children,
}: DashboardWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (!visible && !isEditMode) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isEditMode ? 'border-2 border-dashed border-[var(--color-border)] rounded-lg' : ''} ${!visible ? 'opacity-50' : ''}`}
    >
      {isEditMode && (
        <div className="absolute -left-8 top-0 bottom-0 flex items-center z-10">
          <button
            {...attributes}
            {...listeners}
            className="w-6 h-6 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] cursor-grab active:cursor-grabbing"
            title="ドラッグして移動"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>
      )}
      {isEditMode && (
        <div className="absolute -right-2 -top-2 z-10">
          <button
            onClick={onToggleVisible}
            className={`w-6 h-6 flex items-center justify-center rounded-full transition-all ${
              visible
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
            } hover:opacity-80`}
            title={visible ? '非表示にする' : '表示する'}
          >
            {visible ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      )}
      <div className={isEditMode ? 'p-2' : ''}>
        {children}
      </div>
    </div>
  )
}

