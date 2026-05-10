import type { NewsArticle } from '../../types'
import { SENTIMENT_CONFIG } from '../../constants'
import { formatRelativeDate } from '../../utils'

export default function NewsDetailModal({ article, onClose }: { article: NewsArticle; onClose: () => void }) {
  const { label, cls } = SENTIMENT_CONFIG[article.sentiment] ?? SENTIMENT_CONFIG.neutral
  const score = Math.max(10, Math.round(Math.abs(article.sentimentScore) * 100))
  return (
    <>
      <div className="overlay show" onClick={onClose} />
      <div className="modal show">
        <div className="modal-head">
          <div>
            <div className="survey-step">{article.source} · {formatRelativeDate(article.date)}</div>
            <div className="modal-title" style={{ marginTop: 6 }}>{article.title}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="news-detail-sentiment-row">
          <span className={`news-sentiment ${cls}`}>{label} 영향</span>
          <div className="news-sentiment-bar-wrap">
            <div className="news-sentiment-bar">
              <div className={`news-sentiment-bar-fill ${article.sentiment}`} style={{ width: `${score}%` }} />
            </div>
            <span className="news-sentiment-score">{score}점</span>
          </div>
        </div>
        <div className="news-detail-label">AI 요약</div>
        <div className="news-detail-summary">{article.aiSummary || article.description}</div>
        {(article.keywords.length > 0 || article.stocks.length > 0) && (
          <div className="news-detail-tags">
            {article.keywords.map(kw => <span key={kw} className="news-kw-tag">{kw}</span>)}
            {article.stocks.map(s => <span key={s} className="news-stock-tag">{s}</span>)}
          </div>
        )}
        <a href={article.link} target="_blank" rel="noopener noreferrer" className="news-detail-link">
          원문 기사 보기 →
        </a>
      </div>
    </>
  )
}
