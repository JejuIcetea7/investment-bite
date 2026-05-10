import type { NewsArticle } from '../../types'
import { SENTIMENT_CONFIG } from '../../constants'
import { formatRelativeDate } from '../../utils'

export default function NewsCard({ article, onClick }: { article: NewsArticle; onClick: () => void }) {
  const { label, cls } = SENTIMENT_CONFIG[article.sentiment] ?? SENTIMENT_CONFIG.neutral
  return (
    <div className="news-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="news-card-top">
        <span className={`news-sentiment ${cls}`}>{label}</span>
        <span className="news-card-source">{article.source} · {formatRelativeDate(article.date)}</span>
      </div>
      <div className="news-card-title">{article.title}</div>
      <div className="news-card-summary">{article.aiSummary || article.description}</div>
      <div className="news-card-bottom">
        <div className="news-card-tags">
          {article.keywords.slice(0, 3).map(kw => <span key={kw} className="news-kw-tag">{kw}</span>)}
          {article.stocks.slice(0, 2).map(s => <span key={s} className="news-stock-tag">{s}</span>)}
        </div>
        <span className="news-card-cta">자세히 →</span>
      </div>
    </div>
  )
}
