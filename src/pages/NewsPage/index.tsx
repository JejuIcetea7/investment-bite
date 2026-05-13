import { useState } from 'react'
import type { NewsArticle, NewsData, NewsSectorKey } from '../../types'
import { NEWS_SECTORS } from '../../constants'
import NewsCard from './NewsCard'
import NewsLoadingSkeleton from './NewsLoadingSkeleton'

export default function NewsPage({
  newsData,
  onCardClick,
}: {
  newsData: NewsData | null
  onCardClick: (article: NewsArticle) => void
}) {
  const [selectedSector, setSelectedSector] = useState<NewsSectorKey>('AI')
  const [topPreviewArticle, setTopPreviewArticle] = useState<NewsArticle | null>(null)
  const [sectorPreviewArticle, setSectorPreviewArticle] = useState<NewsArticle | null>(null)
  const sectorArticles = newsData?.sectorNews[selectedSector] ?? []

  if (!newsData) return <div className="news-page"><NewsLoadingSkeleton /></div>

  return (
    <div className="news-page">
      <section className="news-section card" data-tour="news-top">
        <div className="card-head">
          <div className="card-head-left">
            <div className="card-num"><span className="card-num-dot">1</span> 주요 뉴스</div>
            <div className="card-title">오늘의 증시 핵심 뉴스</div>
            <div className="card-sub">국내외 주식시장에 영향을 주는 주요 뉴스를 모았어요.</div>
          </div>
        </div>
        <div className={`news-section-split ${topPreviewArticle ? 'show-preview' : ''}`}>
          <div className="news-cards-list">
            {newsData.topNews.map((article, i) => (
              <NewsCard
                key={i}
                article={article}
                onClick={() => onCardClick(article)}
                onPreview={() => setTopPreviewArticle((current) => current?.link === article.link ? null : article)}
                previewActive={topPreviewArticle?.link === article.link}
              />
            ))}
          </div>
          {topPreviewArticle && (
            <NewsPagePreview article={topPreviewArticle} onClose={() => setTopPreviewArticle(null)} />
          )}
        </div>
      </section>

      <section className="news-section card">
        <div className="card-head">
          <div className="card-head-left">
            <div className="card-num"><span className="card-num-dot">2</span> 섹터별 뉴스</div>
            <div className="card-title">관심 섹터 뉴스</div>
            <div className="card-sub">섹터를 선택해 관련 뉴스를 확인하세요.</div>
          </div>
        </div>
        <div className="sector-tabs" data-tour="news-sector-tabs">
          {NEWS_SECTORS.map(sector => (
            <button
              key={sector}
              className={`sector-tab ${selectedSector === sector ? 'active' : ''}`}
              onClick={() => {
                setSelectedSector(sector)
                setSectorPreviewArticle(null)
              }}
            >
              {sector}
            </button>
          ))}
        </div>
        <div className={`news-section-split ${sectorPreviewArticle ? 'show-preview' : ''}`} style={{ marginTop: 16 }} data-tour="news-sector-list">
          <div className="news-cards-list">
            {sectorArticles.map((article, i) => (
              <NewsCard
                key={i}
                article={article}
                onClick={() => onCardClick(article)}
                onPreview={() => setSectorPreviewArticle((current) => current?.link === article.link ? null : article)}
                previewActive={sectorPreviewArticle?.link === article.link}
              />
            ))}
          </div>
          {sectorPreviewArticle && (
            <NewsPagePreview article={sectorPreviewArticle} onClose={() => setSectorPreviewArticle(null)} />
          )}
        </div>
      </section>
    </div>
  )
}

function NewsPagePreview({ article, onClose }: { article: NewsArticle; onClose: () => void }) {
  return (
    <aside className="news-page-preview" aria-label={`${article.title} 기사 페이지 미리보기`}>
      <div className="news-page-preview-head">
        <div>
          <div className="news-page-preview-source">{article.source}</div>
          <div className="news-page-preview-title">{article.title}</div>
        </div>
        <button type="button" className="news-page-preview-close" onClick={onClose} aria-label="페이지 보기 닫기">×</button>
      </div>
      <iframe
        className="news-page-preview-frame"
        src={article.link}
        title={article.title}
        loading="lazy"
      />
      <a className="news-page-preview-link" href={article.link} target="_blank" rel="noopener noreferrer">
        새 탭에서 원문 열기
      </a>
    </aside>
  )
}
