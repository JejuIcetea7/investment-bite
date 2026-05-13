export default function NewsLoadingSkeleton() {
  return (
    <div className="news-loading">
      <div className="news-loading-hero">
        <img src="/charcter/뉴스_아이콘.png" alt="" className="news-loading-char" />
        <div className="news-loading-text">뉴스를 읽는 중이에요</div>
        <div className="news-loading-sub">AI가 요약하고 있어요</div>
      </div>

      <div className="news-skeleton-list">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="news-skeleton-card">
            <div className="news-skeleton-top">
              <div className="skeleton-box" style={{ width: 40, height: 20, borderRadius: 10 }} />
              <div className="skeleton-box" style={{ width: 100, height: 14 }} />
            </div>
            <div className="skeleton-box" style={{ width: '90%', height: 18, marginTop: 12 }} />
            <div className="skeleton-box" style={{ width: '70%', height: 18, marginTop: 8 }} />
            <div className="skeleton-box" style={{ width: '100%', height: 14, marginTop: 10 }} />
            <div className="skeleton-box" style={{ width: '80%', height: 14, marginTop: 6 }} />
            <div className="news-skeleton-tags">
              <div className="skeleton-box" style={{ width: 50, height: 22, borderRadius: 10 }} />
              <div className="skeleton-box" style={{ width: 60, height: 22, borderRadius: 10 }} />
              <div className="skeleton-box" style={{ width: 44, height: 22, borderRadius: 10 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
