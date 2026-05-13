import type { ReactNode } from 'react'
import type { DashboardWidgetKey } from '../types'
import { DASHBOARD_WIDGET_LABELS } from '../constants'

export default function EditableWidgetShell({
  widgetKey,
  visible,
  editMode,
  onToggle,
  children,
}: {
  widgetKey: DashboardWidgetKey
  visible: boolean
  editMode: boolean
  onToggle: () => void
  children: ReactNode
}) {
  if (!editMode && !visible) return null

  return (
    <div className={`editable-widget-shell ${editMode ? 'edit-mode' : ''} ${visible ? 'is-visible' : 'is-hidden'}`} data-widget={widgetKey}>
      {editMode && (
        <button type="button" className="editable-widget-toggle" onClick={onToggle} aria-pressed={visible}>
          {visible ? '숨기기' : '보이기'}
        </button>
      )}
      {visible ? children : (
        <div className="editable-widget-placeholder card">
          <div className="editable-widget-placeholder-title">{DASHBOARD_WIDGET_LABELS[widgetKey]}</div>
          <div className="editable-widget-placeholder-sub">편집 모드에서 다시 표시할 수 있어요.</div>
        </div>
      )}
    </div>
  )
}
