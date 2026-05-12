import type { PropensityResult, DashboardWidgetKey } from '../../types'
import EditableWidgetShell from '../../components/EditableWidgetShell'

export default function PropensitySection({
  propensityResult,
  analysisLoading,
  beginner,
  hiddenWidgets,
  editMode,
  onRestartSurvey,
  onToggle,
}: {
  propensityResult: PropensityResult | null
  analysisLoading: boolean
  beginner: boolean
  hiddenWidgets: DashboardWidgetKey[]
  editMode: boolean
  onRestartSurvey: () => void
  onToggle: () => void
}) {
  const summaryItems = (analysisLoading
    ? ['설문 결과를 바탕으로 맞춤 해석을 작성하고 있어요.']
    : (propensityResult?.llmSummary || propensityResult?.summary || '').split(/(?<=[.!?。]|요\.|다\.)\s+/)
  ).filter(Boolean).slice(0, 3)
  const strengthsText = (propensityResult?.strengths ?? []).join(' ')
  const cautionsText = (propensityResult?.cautions ?? []).join(' ')

  return (
    <EditableWidgetShell widgetKey="propensity" visible={!hiddenWidgets.includes('propensity')} editMode={editMode} onToggle={onToggle}>
      <section className="card" data-tour="propensity">
        <div className="card-head">
          <div className="card-head-left">
            <div className="card-num"><span className="card-num-dot">4</span> 유저 투자성향</div>
            <div className="card-title">나의 투자 DNA</div>
            {beginner && <div className="card-sub">간단한 설문과 관심 종목을 바탕으로 보여줘요.</div>}
          </div>
        </div>
        {propensityResult ? (
          <>
            <div className="propensity-dna">
              <div className="propensity-character">
                <img src={propensityResult.characterImage} alt={propensityResult.characterAlt} />
              </div>
              <div className="propensity-dna-main">
                <div className="propensity-result-top">
                  <span className="propensity-badge">{propensityResult.badge}</span>
                </div>
                <div className="propensity-type-title">{propensityResult.title}</div>
                <div className="propensity-summary">{propensityResult.summary}</div>
              </div>
            </div>
            <div className="propensity-analysis-sections">
              <div className="propensity-analysis-section">
                <div className="propensity-insight-title">성향 요약</div>
                {summaryItems.map((item) => (
                  <div key={item} className="propensity-insight-item">{item}</div>
                ))}
              </div>
              <div className="propensity-analysis-section">
                <div className="propensity-insight-title">투자 특징</div>
                <p className="propensity-analysis-text">{strengthsText || propensityResult.summary}</p>
              </div>
              <div className="propensity-analysis-section">
                <div className="propensity-insight-title">주의할 점</div>
                <p className="propensity-analysis-text">{cautionsText || propensityResult.note}</p>
              </div>
              <div className="propensity-analysis-section">
                <div className="propensity-insight-title">한 줄 조언</div>
                <p className="propensity-analysis-text">{analysisLoading ? '분석이 끝나면 설문 답변에 맞춘 조언이 표시됩니다.' : (propensityResult.recommendation || propensityResult.note)}</p>
              </div>
            </div>
            <div className="propensity-actions">
              <button className="btn-ghost propensity-cta" onClick={onRestartSurvey}>재설문</button>
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', gap: 12, alignItems: 'start' }}>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
              4개의 질문으로 투자 성향을 분석하고, 내 성향에 맞는 해석을 보여드려요.
            </div>
            <button className="btn-primary propensity-cta" onClick={onRestartSurvey}>성향 분석 시작하기</button>
            <div className="glossary-mini">분석을 완료하면 5가지 투자 성향 중 하나로 정리됩니다.</div>
          </div>
        )}
      </section>
    </EditableWidgetShell>
  )
}
