import { useState } from 'react'
import type { NewsArticle, NewsData, NewsSectorKey } from '../../types'
import { NEWS_SECTORS } from '../../constants'
import NewsCard from './NewsCard'

export default function NewsPage({
  newsData,
  onCardClick,
}: {
  newsData: NewsData | null
  onCardClick: (article: NewsArticle) => void
}) {
  const [selectedSector, setSelectedSector] = useState<NewsSectorKey>('AI')
  const sectorArticles = newsData?.sectorNews[selectedSector] ?? []

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
          {newsData?.topNews && newsData.topNews.length > 0 ? (
            newsData.topNews.map((article, i) => (
              <NewsCard key={i} article={article} onClick={() => onCardClick(article)} />
            ))
          ) : (
            <div className="news-empty">
              <div className="news-empty-title">뉴스를 불러오는 중이에요</div>
              <div className="news-empty-sub">npm run sync:news 를 실행하거나 잠시 후 새로고침해 주세요.</div>
            </div>
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
          {sectorArticles.length > 0 ? (
            sectorArticles.map((article, i) => (
              <NewsCard key={i} article={article} onClick={() => onCardClick(article)} />
            ))
          ) : (
            <div className="news-empty">
              <div className="news-empty-title">해당 섹터 뉴스를 불러오는 중이에요</div>
              <div className="news-empty-sub">잠시 후 새로고침해 주세요.</div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
