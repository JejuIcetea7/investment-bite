import { createPortal } from 'react-dom'
import type { HoverHelp } from '../types'

export default function SectionHelpTooltip({ help }: { help: HoverHelp | null }) {
  if (!help) return null
  return createPortal(
    <div className="tooltip-fixed show" style={{ left: help.x, top: help.y, zIndex: 999 }}>
      <div className="tooltip-label">What it is</div>
      <div className="tooltip-title">{help.title}</div>
      <div>{help.text}</div>
    </div>,
    document.body,
  )
}
