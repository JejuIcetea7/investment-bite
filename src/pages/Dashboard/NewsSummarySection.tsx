import { DASHBOARD_NEWS_ITEMS } from '../../constants'
import type { DashboardWidgetKey } from '../../types'
import EditableWidgetShell from '../../components/EditableWidgetShell'

export default function NewsSummarySection({
  hiddenWidgets,
  editMode,
  onNavigateToNews,
  onToggle,
}: {
  hiddenWidgets: DashboardWidgetKey[]
  editMode: boolean
  onNavigateToNews: () => void
  onToggle: () => void
}) {
  return (
    <EditableWidgetShell widgetKey="news" visible={!hiddenWidgets.includes('news')} editMode={editMode} onToggle={onToggle}>
      <section className="card" data-tour="news">
        <div className="card-head">
          <div className="card-head-left">
            <div className="card-num"><span className="card-num-dot">3</span> 주요 뉴스</div>
            <div className="card-title">시장 핵심 뉴스</div>
          </div>
          <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={onNavigateToNews}>
            주요뉴스 보러가기 →
          </button>
        </div>
        <div className="news-list">
          {DASHBOARD_NEWS_ITEMS.map((item) => (
            <div key={item.title} className="news-item" onClick={onNavigateToNews} style={{ cursor: 'pointer' }}>
              <div className="news-thumb">📰</div>
              <div className="news-content">
                <span className="news-tag tag-market">{item.tag}</span>
                <div className="news-title">{item.title}</div>
                <div className="news-meta">{item.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </EditableWidgetShell>
  )
}
