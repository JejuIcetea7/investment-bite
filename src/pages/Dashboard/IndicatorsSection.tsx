import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Indicator, HoverHelp } from '../../types'
import { INDICATOR_HELP, IND_PER_PAGE, IND_INTERVAL_MS } from '../../constants'
import Sparkline from '../../components/Sparkline'

export default function IndicatorsSection({
  indicators,
  beginner,
  setHoverHelp,
}: {
  indicators: Indicator[]
  beginner: boolean
  setHoverHelp: Dispatch<SetStateAction<HoverHelp | null>>
}) {
  const [indPage, setIndPage] = useState(0)
  const [indPlaying, setIndPlaying] = useState(true)
  const [indResetKey, setIndResetKey] = useState(0)

  const indTotalPages = Math.max(1, Math.ceil(indicators.length / IND_PER_PAGE))
  const safeIndPage = Math.min(indPage, indTotalPages - 1)

  useEffect(() => {
    if (!indPlaying) return
    const id = setInterval(() => {
      setIndPage((p) => (p + 1) % indTotalPages)
    }, IND_INTERVAL_MS)
    return () => clearInterval(id)
  }, [indPlaying, indResetKey, indTotalPages])

  const goPrev = () => { setIndPage((p) => (p - 1 + indTotalPages) % indTotalPages); setIndResetKey((v) => v + 1) }
  const goNext = () => { setIndPage((p) => (p + 1) % indTotalPages); setIndResetKey((v) => v + 1) }

  const showHelp = (title: string, text: string) => (event: React.MouseEvent<HTMLElement>) => {
    setHoverHelp({ title, text, x: event.clientX + 16, y: event.clientY + 16 })
  }

  return (
    <section className="indicators" data-tour="market-summary">
      <div className="card-head">
        <div className="card-head-left">
          <div className="card-num"><span className="card-num-dot">1</span> 시장 요약</div>
          <div className="card-title">오늘의 경제 지수 현황</div>
          {beginner && <div className="card-sub">주요 지수와 환율, 위험지표를 한눈에 볼 수 있어요.</div>}
        </div>
        <div className="ind-pager-controls">
          <button className="ind-arrow" onClick={goPrev} aria-label="이전">‹</button>
          <button className="ind-play" onClick={() => { setIndPlaying((v) => !v); setIndResetKey((v) => v + 1) }} aria-label={indPlaying ? '일시정지' : '재생'}>
            {indPlaying ? '⏸' : '▶'}
          </button>
          <button className="ind-arrow" onClick={goNext} aria-label="다음">›</button>
        </div>
      </div>
      <div className="indicators-page">
        {indicators.slice(safeIndPage * IND_PER_PAGE, (safeIndPage + 1) * IND_PER_PAGE).map((indicator) => (
          <div
            key={indicator.label}
            className="indicator"
            onMouseEnter={beginner ? showHelp(
              INDICATOR_HELP[indicator.label]?.title ?? indicator.label,
              INDICATOR_HELP[indicator.label]?.text ?? '이 지표에 대한 설명이 아직 준비되지 않았습니다.',
            ) : undefined}
            onMouseMove={beginner ? (e) => setHoverHelp((prev) => prev ? { ...prev, x: e.clientX + 16, y: e.clientY + 16 } : prev) : undefined}
            onMouseLeave={beginner ? () => setHoverHelp(null) : undefined}
            style={{ cursor: beginner ? 'help' : 'default' }}
          >
            <div className="indicator-label">
              {indicator.label}
              {beginner && <span className="indicator-info">i</span>}
            </div>
            <div className="indicator-value">{indicator.value}</div>
            <div className={`indicator-change ${indicator.up ? 'up' : 'down'}`}>
              {indicator.change} ({indicator.pct})
            </div>
            <div className="indicator-spark">
              <Sparkline data={indicator.series} />
            </div>
          </div>
        ))}
      </div>
      <div className="ind-progress-bar">
        {indPlaying && (
          <div
            key={indPage}
            className="ind-progress-bar-fill"
            style={{ '--ind-dur': `${IND_INTERVAL_MS}ms` } as React.CSSProperties}
          />
        )}
      </div>
      <div className="ind-pager-foot">
        <div className="ind-page-count">
          <span className="ind-page-num">{String(safeIndPage + 1).padStart(2, '0')}</span>
          <span className="ind-page-sep">/</span>
          <span className="ind-page-total">{String(indTotalPages).padStart(2, '0')}</span>
          <span className="ind-page-label">페이지</span>
        </div>
        <div className="ind-dots">
          {Array.from({ length: indTotalPages }).map((_, p) => (
            <button
              key={p}
              className={`ind-dot ${p === safeIndPage ? 'active' : ''}`}
              onClick={() => { setIndPage(p); setIndResetKey((v) => v + 1) }}
              aria-label={`페이지 ${p + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
