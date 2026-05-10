import { useEffect, useState } from 'react'
import type { TourStep } from '../types'
import { TOUR_STEPS } from '../constants'

export default function TourOverlay({
  active,
  step,
  steps,
  onNext,
  onSkip,
}: {
  active: boolean
  step: number
  steps: TourStep[]
  onNext: () => void
  onSkip: () => void
}) {
  const [box, setBox] = useState<null | (TourStep & { x: number; y: number; w: number; h: number })>(null)

  const CHAR_MAP: Record<string, string> = {
    '[data-tour="propensity"]': '/charcter/투자성향_분석_아이콘png.png',
    '[data-tour="know"]': '/charcter/공부하는_아이콘.png',
    '[data-tour="quiz"]': '/charcter/투자_상식_카드_아이콘.png',
    '[data-tour="news"]': '/charcter/뉴스_아이콘.png',
  }

  useEffect(() => {
    if (!active || !steps[step]) return

    const update = () => {
      const target = steps[step]
      const element = document.querySelector(target.sel)
      if (!element) { setBox(null); return }
      const rect = element.getBoundingClientRect()
      setBox({ ...target, x: rect.left - 8, y: rect.top - 8, w: rect.width + 16, h: rect.height + 16 })
    }

    update()
    const element = document.querySelector(steps[step].sel)
    if (element && 'scrollIntoView' in element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [active, step, steps])

  if (!active || !box || !steps[step]) return null

  const cardWidth = 320
  const cardHeight = 180
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = box.x + box.w + 12
  let top = box.y + box.h / 2 - cardHeight / 2

  if (box.pos === 'bottom') {
    left = box.x + box.w / 2 - cardWidth / 2
    top = box.y + box.h + 12
  } else if (box.pos === 'top') {
    left = box.x + box.w / 2 - cardWidth / 2
    top = box.y - cardHeight - 12
  } else if (box.pos === 'left') {
    left = box.x - cardWidth - 12
    top = box.y + box.h / 2 - cardHeight / 2
  }

  left = Math.max(16, Math.min(left, viewportWidth - cardWidth - 16))
  top = Math.max(16, Math.min(top, viewportHeight - cardHeight - 16))

  const charSrc = CHAR_MAP[box.sel]
  const CHAR_SIZE = 140
  const charLeft = Math.max(12, left - CHAR_SIZE - 12)
  const charTop = top + 8

  return (
    <div className="tour-overlay show">
      <div className="tour-spot" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />
      {charSrc && (
        <img src={charSrc} className="tour-char-outside" style={{ left: charLeft, top: charTop, width: CHAR_SIZE, height: CHAR_SIZE }} alt="가이드 캐릭터" />
      )}
      <div className="tour-card" style={{ left, top }}>
        <span className="tour-step-label">STEP {step + 1} / {TOUR_STEPS.length}</span>
        <div className="tour-title">{box.title}</div>
        <div className="tour-text">{box.text}</div>
        <div className="tour-foot">
          <button className="tour-skip" onClick={onSkip}>건너뛰기</button>
          <button className="btn-primary" onClick={onNext}>
            {step === steps.length - 1 ? '시작하기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}
