import { useState } from 'react'
import type { PropensityResult, DashboardWidgetKey } from '../../types'
import EditableWidgetShell from '../../components/EditableWidgetShell'

export default function PropensitySection({
  propensityResult,
  beginner,
  hiddenWidgets,
  editMode,
  onStartAnalysis,
  onToggle,
}: {
  propensityResult: PropensityResult | null
  beginner: boolean
  hiddenWidgets: DashboardWidgetKey[]
  editMode: boolean
  onStartAnalysis: () => void
  onToggle: () => void
}) {
  const [whyPropOpen, setWhyPropOpen] = useState(false)

  return (
    <EditableWidgetShell widgetKey="propensity" visible={!hiddenWidgets.includes('propensity')} editMode={editMode} onToggle={onToggle}>
      <section className="card" data-tour="propensity">
        <div className="card-head">
          <div className="card-head-left">
            <div className="card-num"><span className="card-num-dot">5</span> 유저 투자성향</div>
            <div className="card-title">나의 투자 DNA</div>
            {beginner && <div className="card-sub">간단한 설문과 관심 종목을 바탕으로 보여줘요.</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button className="why-btn" onClick={() => setWhyPropOpen((v) => !v)}>
                <span className="q">?</span> Why?
              </button>
              <div className={`why-pop ${whyPropOpen ? 'show' : ''}`}>
                <span className="why-pop-tag">왜 이 성향일까?</span>
                <div className="why-pop-title">나의 투자 DNA 분석</div>
                <div className="why-pop-text">설문 답변과 관심 종목의 변동성을 바탕으로 성향을 계산합니다.</div>
                <div className="why-pop-list">
                  <div className="why-pop-li">손실 감내 수준 · 투자 기간 반영</div>
                  <div className="why-pop-li">관심 종목 리스크 프로파일 분석</div>
                  <div className="why-pop-li">4개 질문 → 안정형~공격형 분류</div>
                </div>
              </div>
            </div>
            <button className="card-action" onClick={onStartAnalysis}>성향 분석 시작</button>
          </div>
        </div>
        {propensityResult ? (
          <>
            <div className="propensity">
              <div className="donut-wrap">
                <svg viewBox="0 0 120 120" width="130" height="130">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#f7f6f4" strokeWidth="14" />
                  <circle
                    cx="60" cy="60" r="48" fill="none" stroke="#facc18" strokeWidth="14"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={`${2 * Math.PI * 48 * (1 - propensityResult.score / 100)}`}
                    transform="rotate(-90 60 60)"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="donut-center">
                  <div className="donut-type">{propensityResult.title}</div>
                  <div className="donut-score">스코어 {propensityResult.score}</div>
                </div>
              </div>
              <div className="propensity-list">
                {propensityResult.traits.map((trait) => (
                  <div key={trait.label} className="propensity-row">
                    <div className="propensity-label">{trait.label}</div>
                    <div className="propensity-bar">
                      <div className={`propensity-bar-fill ${trait.point ? 'point' : ''}`} style={{ width: `${trait.val}%` }} />
                    </div>
                    <div className="propensity-val">{trait.val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glossary-mini" style={{ marginTop: 12 }}>
              {propensityResult.badge} · {propensityResult.summary} {beginner ? ` ${propensityResult.note}` : ''}
            </div>
            <button className="btn-ghost propensity-cta" onClick={onStartAnalysis}>다시 분석하기</button>
          </>
        ) : (
          <div style={{ display: 'grid', gap: 12, alignItems: 'start' }}>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
              4개의 질문으로 투자 성향을 분석하고, 내 성향에 맞는 해석을 보여드려요.
            </div>
            <button className="btn-primary propensity-cta" onClick={onStartAnalysis}>성향 분석 시작하기</button>
            <div className="glossary-mini">분석을 완료하면 안정형, 균형형, 성장형, 공격형 중 하나로 정리됩니다.</div>
          </div>
        )}
      </section>
    </EditableWidgetShell>
  )
}
