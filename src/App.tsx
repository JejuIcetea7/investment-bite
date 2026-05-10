import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { MarketData, DailyQuiz, DailyQuizData, KnowledgeCard, NewsData, NewsArticle, WatchItem, PropensityResult, DashboardWidgetKey } from './types'
import { DASHBOARD_WIDGETS, TOUR_STEPS, STOCK_ALIASES } from './constants'
import defaultMarketData from './data/defaultMarketData'
import { normalizeSearchText, createPropensityResult } from './utils'
import SectionHelpTooltip from './components/SectionHelpTooltip'
import TourOverlay from './components/TourOverlay'
import SurveyModal from './components/SurveyModal'
import IndicatorsSection from './pages/Dashboard/IndicatorsSection'
import DashboardPage from './pages/Dashboard'
import WholePage from './pages/WholePage'
import NewsPage from './pages/NewsPage'
import NewsDetailModal from './pages/NewsPage/NewsDetailModal'

function App() {
  const [beginner, setBeginner] = useState(true)
  const [active, setActive] = useState('home')
  const [marketData, setMarketData] = useState<MarketData>(defaultMarketData)
  const [dataSource, setDataSource] = useState<'Yahoo Finance' | '기본 데이터'>('기본 데이터')
  const [dailyQuizzes, setDailyQuizzes] = useState<DailyQuiz[]>([])
  const [dailyQuizIndex, setDailyQuizIndex] = useState(0)
  const [selectedDailyAnswer, setSelectedDailyAnswer] = useState<number | null>(null)
  const [dailyQuizCorrectCount, setDailyQuizCorrectCount] = useState(0)
  const [tourActive, setTourActive] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [propensityOpen, setPropensityOpen] = useState(false)
  const [propensityStep, setPropensityStep] = useState(0)
  const [propensityAnswers, setPropensityAnswers] = useState<number[]>([])
  const [propensityResult, setPropensityResult] = useState<PropensityResult | null>(null)
  const [hoverHelp, setHoverHelp] = useState<{ title: string; text: string; x: number; y: number } | null>(null)
  const [selectedWatchItem, setSelectedWatchItem] = useState<WatchItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [dashboardEditMode, setDashboardEditMode] = useState(false)
  const [hiddenWidgets, setHiddenWidgets] = useState<DashboardWidgetKey[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem('dashboard-hidden-widgets')
      if (!raw) return []
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) return []
      return parsed.filter((item): item is DashboardWidgetKey => DASHBOARD_WIDGETS.includes(item as DashboardWidgetKey))
    } catch {
      return []
    }
  })
  const [loadingVisible, setLoadingVisible] = useState(true)
  const [allKnowledgeCards, setAllKnowledgeCards] = useState<KnowledgeCard[]>([])
  const [knowledgeCards, setKnowledgeCards] = useState<KnowledgeCard[]>([])
  const [newsData, setNewsData] = useState<NewsData | null>(null)
  const [selectedNewsArticle, setSelectedNewsArticle] = useState<NewsArticle | null>(null)

  useEffect(() => {
    document.title = '투자 한입 대시보드 · Yahoo Finance'
    let ignore = false
    fetch('/data/market-data.json', { cache: 'no-store' })
      .then(async (r) => { if (!r.ok) throw new Error(); return r.json() as Promise<MarketData> })
      .then((payload) => { if (!ignore) { setMarketData(payload); setDataSource('Yahoo Finance') } })
      .catch(() => { if (!ignore) setDataSource('기본 데이터') })
      .finally(() => { if (!ignore) setTimeout(() => setLoadingVisible(false), 350) })
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    let ignore = false
    fetch('/data/daily-quiz.json', { cache: 'no-store' })
      .then(async (r) => { if (!r.ok) throw new Error(); return r.json() as Promise<DailyQuizData> })
      .then((payload) => { if (!ignore) setDailyQuizzes(payload.quizzes) })
      .catch(() => { if (!ignore) setDailyQuizzes([]) })
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    fetch('/data/news.json', { cache: 'no-store' })
      .then(r => r.json() as Promise<NewsData>)
      .then(setNewsData)
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/data/knowledge-cards.json')
      .then((r) => r.json() as Promise<{ cards: KnowledgeCard[] }>)
      .then(({ cards }) => {
        setAllKnowledgeCards(cards)
        setKnowledgeCards([...cards].sort(() => Math.random() - 0.5).slice(0, 2))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    try { window.localStorage.setItem('dashboard-hidden-widgets', JSON.stringify(hiddenWidgets)) }
    catch { /* ignore */ }
  }, [hiddenWidgets])

  const normalizedSearchQuery = normalizeSearchText(searchQuery)
  const searchMatches = useMemo(() => {
    if (normalizedSearchQuery.length < 2) return []
    return marketData.watchlist.filter((stock) => {
      const aliases = STOCK_ALIASES[stock.symbol] ?? []
      return [stock.name, stock.symbol, ...aliases].map(normalizeSearchText).join(' ').includes(normalizedSearchQuery)
    })
  }, [marketData.watchlist, normalizedSearchQuery])
  const showSearchSuggestions = searchFocused && normalizedSearchQuery.length >= 2

  const visibleTourSteps = useMemo(
    () => TOUR_STEPS.filter((step) => !step.widgetKey || !hiddenWidgets.includes(step.widgetKey)),
    [hiddenWidgets],
  )
  const safeTourStep = Math.min(tourStep, visibleTourSteps.length - 1)

  const openPropensity = () => { setPropensityStep(0); setPropensityAnswers([]); setPropensityOpen(true) }
  const closePropensity = () => setPropensityOpen(false)

  const pickPropensityAnswer = (index: number) => {
    setPropensityAnswers((current) => { const next = [...current]; next[propensityStep] = index; return next })
  }

  const nextPropensityStep = () => {
    if (propensityStep < propensityAnswers.length - 1) { setPropensityStep((s) => s + 1); return }
    const isLast = propensityStep === 3
    if (!isLast) { setPropensityStep((s) => s + 1); return }
    setPropensityResult(createPropensityResult(propensityAnswers))
    setPropensityOpen(false)
  }

  const toggleDashboardWidget = (key: DashboardWidgetKey) => {
    setHiddenWidgets((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  const refreshKnowledgeCards = () => {
    const currentIds = new Set(knowledgeCards.map((c) => c.id))
    const pool = allKnowledgeCards.filter((c) => !currentIds.has(c.id))
    setKnowledgeCards([...pool].sort(() => Math.random() - 0.5).slice(0, 2))
  }

  const pickDailyQuizAnswer = (answerIndex: number) => {
    const quiz = dailyQuizzes[dailyQuizIndex]
    if (!quiz || selectedDailyAnswer !== null || dailyQuizIndex >= dailyQuizzes.length) return
    setSelectedDailyAnswer(answerIndex)
    if (answerIndex === quiz.answerIndex) setDailyQuizCorrectCount((c) => c + 1)
  }

  const isWholeView = active === 'whole'

  return (
    <div className={`app ${beginner ? 'beginner' : 'pro'}`}>
      {loadingVisible && (
        <div className="loading-overlay">
          <div className="loading-bg" />
          <div className="loading-center">
            <img src="/charcter/대표_문구.png" alt="대표 문구" className="loading-main-img" />
            <img src="/charcter/진입_아이콘.png" alt="진입 아이콘" className="loading-icon" />
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-logo-center">
          <img
            src="/charcter/대표_문구.png"
            alt="투자 한입 로고"
            className="sidebar-logo-img"
          />
        </div>
        <div className="greet">
          <div className="greet-hi">안녕하세요</div>
          <div className="greet-name">민지님 👋</div>
          <div className="greet-meta"><span className="greet-dot" />오늘도 좋은 하루 되세요</div>
        </div>
        <nav className="nav">
          <div className="nav-label">Menu</div>
          {([
            ['home', '대시보드', 'menu-dashboard'],
            ['whole', '전체 종목', 'menu-whole'],
            ['news', '뉴스 & 리포트', 'menu-news'],
          ] as const).map(([key, label, tourKey]) => (
            <button key={key} className={`nav-item ${active === key ? 'active' : ''}`} onClick={() => setActive(key)} data-tour={tourKey}>
              <span className="nav-icon">•</span><span>{label}</span>
            </button>
          ))}
        </nav>
        <nav className="nav">
          <div className="nav-label">Tools</div>
          {active === 'home' && (
            <>
              <button className={`nav-item ${dashboardEditMode ? 'active' : ''}`} onClick={() => setDashboardEditMode((v) => !v)} data-tour="tool-dashboard-edit">
                <span className="nav-icon">🧩</span><span>{dashboardEditMode ? '편집 종료' : '대시보드 편집'}</span>
              </button>
              <button className="nav-item" onClick={openPropensity} data-tour="tool-propensity">
                <span className="nav-icon">✨</span><span>투자성향 분석</span>
              </button>
            </>
          )}
          <button className="nav-item" onClick={() => { setActive('home'); setTourStep(0); setTourActive(true) }} data-tour="tour-btn">
            <span className="nav-icon">🍙</span><span>가이드 투어</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-pick">
            <div className="know-feature-tag">Today's Pick</div>
            <div className="sidebar-pick-title">복리의 마법: 72의 법칙</div>
            <div className="sidebar-pick-desc">72를 연 수익률로 나누면 원금이 두 배가 되는 햇수가 나와요.</div>
          </div>
          <div className="beginner-card">
            <div className="beginner-row">
              <div>
                <div className="beginner-title">Beginner Mode</div>
                <div className="beginner-sub">{beginner ? '쉬운 설명 표시' : '전문가 모드'}</div>
              </div>
              <div className={`toggle ${beginner ? 'on' : ''}`} onClick={() => setBeginner((v) => !v)} role="button" tabIndex={0} data-tour="beginner-toggle">
                <div className="toggle-knob" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <div className="header-title">
              {active === 'home' ? '대시보드' : active === 'whole' ? '전체 종목' : '뉴스 & 리포트'}
            </div>
            <div className="header-date">{marketData.generatedAtLabel}</div>
          </div>
          <div className="search">
            <span className="search-icon">⌕</span>
            <input
              value={searchQuery}
              placeholder="종목명, 티커, 키워드 검색"
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              aria-label="종목 검색"
              aria-expanded={showSearchSuggestions}
            />
            {!searchQuery && <span className="search-kbd">⌘K</span>}
            {showSearchSuggestions && (
              <div className="search-suggestions">
                {searchMatches.length > 0 ? searchMatches.map((stock) => (
                  <button key={stock.symbol} type="button" className="search-suggestion" onMouseDown={(e) => e.preventDefault()}>
                    <span className="search-suggestion-main">
                      <span className="search-suggestion-name">{stock.name}</span>
                      <span className="search-suggestion-symbol">{stock.symbol}</span>
                    </span>
                    <span className={`search-suggestion-change ${stock.up ? 'up' : 'down'}`}>{stock.chg}</span>
                  </button>
                )) : <div className="search-empty">검색 결과 없음</div>}
              </div>
            )}
          </div>
          <button className="header-btn" title="알림">🔔<span className="badge" /></button>
          <button className="header-btn" title="설정">⚙</button>
          <div className="user-chip">
            <div className="user-avatar">민</div>
            <span className="user-name">민지</span>
          </div>
        </header>

        <div className="content">
          <IndicatorsSection
            indicators={marketData.indicators}
            beginner={beginner}
            setHoverHelp={setHoverHelp}
          />

          {active === 'news' && (
            <NewsPage newsData={newsData} onCardClick={setSelectedNewsArticle} />
          )}
          {active !== 'news' && isWholeView && (
            <WholePage
              watchlist={marketData.watchlist}
              selectedSymbol={selectedWatchItem?.symbol ?? null}
              onSelect={setSelectedWatchItem}
            />
          )}
          {active !== 'news' && !isWholeView && (
            <DashboardPage
              marketData={marketData}
              dataSource={dataSource}
              beginner={beginner}
              selectedWatchItem={selectedWatchItem}
              propensityResult={propensityResult}
              hiddenWidgets={hiddenWidgets}
              dashboardEditMode={dashboardEditMode}
              knowledgeCards={knowledgeCards}
              dailyQuizzes={dailyQuizzes}
              dailyQuizIndex={dailyQuizIndex}
              selectedDailyAnswer={selectedDailyAnswer}
              dailyQuizCorrectCount={dailyQuizCorrectCount}
              setHoverHelp={setHoverHelp}
              setSelectedWatchItem={setSelectedWatchItem}
              onNavigateToNews={() => setActive('news')}
              onStartAnalysis={openPropensity}
              onToggleWidget={toggleDashboardWidget}
              onRefreshKnowledge={refreshKnowledgeCards}
              onPickQuizAnswer={pickDailyQuizAnswer}
              onNextQuiz={() => { setDailyQuizIndex((i) => i + 1); setSelectedDailyAnswer(null) }}
              onRestartQuiz={() => { setDailyQuizIndex(0); setSelectedDailyAnswer(null); setDailyQuizCorrectCount(0) }}
            />
          )}
        </div>
      </main>

      {selectedNewsArticle && (
        <NewsDetailModal article={selectedNewsArticle} onClose={() => setSelectedNewsArticle(null)} />
      )}
      <SectionHelpTooltip help={hoverHelp} />
      <TourOverlay
        active={tourActive}
        step={safeTourStep}
        steps={visibleTourSteps}
        onNext={() => {
          if (safeTourStep >= visibleTourSteps.length - 1) { setTourActive(false); return }
          setTourStep((v) => v + 1)
        }}
        onSkip={() => setTourActive(false)}
      />
      <SurveyModal
        open={propensityOpen}
        step={propensityStep}
        answers={propensityAnswers}
        onPick={pickPropensityAnswer}
        onPrev={() => setPropensityStep((s) => Math.max(0, s - 1))}
        onNext={nextPropensityStep}
        onClose={closePropensity}
      />
    </div>
  )
}

export default App
