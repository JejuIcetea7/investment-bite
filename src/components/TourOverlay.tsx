import { useEffect, useState } from 'react'
import type { TourStep } from '../types'

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
    '[data-tour="sidebar-menu"]': '/charcter/궁금한_아이콘.png',
    '[data-tour="sidebar-tools"]': '/charcter/투자_상식_카드_아이콘.png',
    '[data-tour="today-pick"]': '/charcter/공부하는_아이콘.png',
    '[data-tour="header-search"]': '/charcter/궁금한_아이콘.png',
    '[data-tour="header-alert"]': '/charcter/느낌표_아이콘.png',
    '[data-tour="market-summary"]': '/charcter/궁금한_아이콘.png',
    '[data-tour="chart"]': '/charcter/느낌표_아이콘.png',
    '[data-tour="watch"]': '/charcter/하트_아이콘.png',
    '[data-tour="propensity"]': '/charcter/투자성향_분석_아이콘png.png',
    '[data-tour="know"]': '/charcter/공부하는_아이콘.png',
    '[data-tour="quiz"]': '/charcter/투자_상식_카드_아이콘.png',
    '[data-tour="news"]': '/charcter/뉴스_아이콘.png',
    '[data-tour="whole-sector-tabs"]': '/charcter/궁금한_아이콘.png',
    '[data-tour="whole-stock-summary"]': '/charcter/공부하는_아이콘.png',
    '[data-tour="whole-watch-toggle"]': '/charcter/하트_아이콘.png',
    '[data-tour="whole-alert-button"]': '/charcter/느낌표_아이콘.png',
    '[data-tour="news-top"]': '/charcter/뉴스_아이콘.png',
    '[data-tour="news-sector-tabs"]': '/charcter/궁금한_아이콘.png',
    '[data-tour="news-sector-list"]': '/charcter/뉴스_아이콘.png',
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
  const charSrc = CHAR_MAP[box.sel]
  const charOverlap = charSrc ? 70 : 0
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

  left = Math.max(16, Math.min(left, viewportWidth - cardWidth - charOverlap - 16))
  top = Math.max(16, Math.min(top, viewportHeight - cardHeight - 16))

  return (
    <div className="tour-overlay show">
      <div className="tour-spot" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />
      <div className="tour-card" style={{ left, top }}>
        {charSrc && (
          <img src={charSrc} className="tour-char-outside" alt="가이드 캐릭터" />
        )}
        <span className="tour-step-label">STEP {step + 1} / {steps.length}</span>
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
