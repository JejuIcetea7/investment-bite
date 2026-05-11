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
  const sectorArticles = newsData?.sectorNews[selectedSector] ?? []

  if (!newsData) return <div className="news-page"><NewsLoadingSkeleton /></div>

  return (
    <div className="news-page">
      <section className="news-section card">
        <div className="card-head">
          <div className="card-head-left">
            <div className="card-num"><span className="card-num-dot">1</span> 주요 뉴스</div>
            <div className="card-title">오늘의 증시 핵심 뉴스</div>
            <div className="card-sub">국내외 주식시장에 영향을 주는 주요 뉴스를 모았어요.</div>
          </div>
        </div>
        <div className="news-cards-list">
          {newsData.topNews.map((article, i) => (
            <NewsCard key={i} article={article} onClick={() => onCardClick(article)} />
          ))}
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
        <div className="sector-tabs">
          {NEWS_SECTORS.map(sector => (
            <button
              key={sector}
              className={`sector-tab ${selectedSector === sector ? 'active' : ''}`}
              onClick={() => setSelectedSector(sector)}
            >
              {sector}
            </button>
          ))}
        </div>
        <div className="news-cards-list" style={{ marginTop: 16 }}>
          {sectorArticles.map((article, i) => (
            <NewsCard key={i} article={article} onClick={() => onCardClick(article)} />
          ))}
        </div>
      </section>
    </div>
  )
}
