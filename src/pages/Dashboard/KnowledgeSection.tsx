import type { KnowledgeCard, DashboardWidgetKey } from '../../types'
import EditableWidgetShell from '../../components/EditableWidgetShell'

export default function KnowledgeSection({
  knowledgeCards,
  beginner,
  hiddenWidgets,
  editMode,
  onRefresh,
  onToggle,
}: {
  knowledgeCards: KnowledgeCard[]
  beginner: boolean
  hiddenWidgets: DashboardWidgetKey[]
  editMode: boolean
  onRefresh: () => void
  onToggle: () => void
}) {
  return (
    <EditableWidgetShell widgetKey="know" visible={!hiddenWidgets.includes('know')} editMode={editMode} onToggle={onToggle}>
      <section className="card" data-tour="know">
        <div className="card-head">
          <div className="card-head-left">
            <div className="card-num"><span className="card-num-dot">5</span> 투자 상식 카드</div>
            <div className="card-title">오늘의 한 입 지식</div>
            {beginner && <div className="card-sub">매일 바뀌는 짧은 투자 상식이에요.</div>}
          </div>
          <button className="know-refresh-btn" onClick={onRefresh}>↻ 다른 카드 보기</button>
        </div>
        <div className="know-cards-stack">
          {knowledgeCards.map((card) => (
            <div key={card.id} className="know-card-item">
              <span className="know-card-category">{card.category}</span>
              <div className="know-card-term">{card.term}</div>
              <div className="know-card-desc">{card.description}</div>
            </div>
          ))}
        </div>
      </section>
    </EditableWidgetShell>
  )
}
