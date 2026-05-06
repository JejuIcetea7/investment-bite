import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Indicator = {
  label: string
  value: string
  change: string
  pct: string
  up: boolean
}

const indicators: Indicator[] = [
  { label: 'KOSPI', value: '2,718.43', change: '+18.62', pct: '+0.69%', up: true },
  { label: 'S&P 500', value: '5,832.91', change: '-12.47', pct: '-0.21%', up: false },
  { label: 'USD/KRW', value: '1,378.20', change: '+3.40', pct: '+0.25%', up: true },
  { label: 'WTI', value: '78.42', change: '+0.85', pct: '+1.10%', up: true },
  { label: 'Bitcoin', value: '92,341', change: '+1,820', pct: '+2.01%', up: true },
  { label: 'VIX', value: '14.82', change: '-0.34', pct: '-2.24%', up: false },
]

const news = [
  { tag: '시장', title: '코스피, 외국인 매수에 2,720선 회복… 반도체 강세 지속', meta: '한국경제 · 12분 전' },
  { tag: '종목', title: '삼성전자, HBM3E 양산 본격화 발표… 외국계 목표가 상향', meta: '머니투데이 · 1시간 전' },
  { tag: '경제', title: '미 CPI 둔화 전망… 12월 금리 인하 가능성 60% 반영', meta: '블룸버그 · 2시간 전' },
  { tag: '정책', title: '한국은행 총재 "당분간 통화정책 신중 기조 유지"', meta: '연합뉴스 · 3시간 전' },
]

const watchlist = [
  { name: '삼성전자', symbol: '005930', price: '72,400', chg: '+1.83%', up: true },
  { name: 'NVIDIA', symbol: 'NVDA', price: '$148.20', chg: '+2.41%', up: true },
  { name: 'Apple Inc.', symbol: 'AAPL', price: '$226.45', chg: '-0.62%', up: false },
  { name: '카카오', symbol: '035720', price: '38,150', chg: '+0.92%', up: true },
  { name: 'SK하이닉스', symbol: '000660', price: '195,500', chg: '+3.21%', up: true },
]

const knowCards = [
  { num: '01', title: 'PER이란?' },
  { num: '02', title: '배당주 vs 성장주' },
  { num: '03', title: 'ETF 한눈에' },
  { num: '04', title: '분산 투자란?' },
]

const quiz = {
  question: '월급의 일부를 매달 같은 금액으로 정해진 종목에 투자하는 방식을 무엇이라고 할까요?',
  options: [
    { letter: 'A', text: '몰빵 투자', correct: false },
    { letter: 'B', text: '적립식 투자 (DCA)', correct: true },
    { letter: 'C', text: '레버리지 투자', correct: false },
    { letter: 'D', text: '단타 매매', correct: false },
  ],
}

const chartPoints = Array.from({ length: 60 }, (_, index) => {
  const base = 48 + Math.sin(index / 7) * 7 + Math.cos(index / 4) * 3
  return base + index * 0.22
})

function Sparkline({ data }: { data: number[] }) {
  const width = 92
  const height = 34
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const path = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="spark-line" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChartArea() {
  const W = 720
  const H = 220
  const PAD = 6
  const min = Math.min(...chartPoints)
  const max = Math.max(...chartPoints)
  const range = max - min || 1

  const points = chartPoints.map((value, index) => {
    const x = PAD + (index / (chartPoints.length - 1)) * (W - PAD * 2)
    const y = PAD + (1 - (value - min) / range) * (H - PAD * 2)
    return [x, y] as const
  })

  const d = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const fillD = `${d} L${W - PAD},${H - PAD} L${PAD},${H - PAD} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#facc18" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#facc18" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((fraction) => (
        <line key={fraction} x1={PAD} x2={W - PAD} y1={H * fraction} y2={H * fraction} stroke="#ece9e2" strokeDasharray="3 4" />
      ))}
      <path d={fillD} fill="url(#chartGrad)" />
      <path d={d} stroke="#3a2204" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="5" fill="#facc18" stroke="#3a2204" strokeWidth="2" />
    </svg>
  )
}

function App() {
  const [beginner, setBeginner] = useState(true)
  const [active, setActive] = useState('home')
  const [picked, setPicked] = useState<number | null>(null)

  useEffect(() => {
    document.title = '투자 한입 대시보드'
  }, [])

  const whySummary = useMemo(
    () => [
      '관심 종목과 시황을 요약한 초보자용 대시보드입니다.',
      '토글을 끄면 더 간결한 전문가 모드처럼 보입니다.',
    ],
    [],
  )

  return (
    <div className={`app ${beginner ? 'beginner' : 'pro'}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">투</div>
          <div>
            <div className="brand-name">투자 한입</div>
            <div className="brand-sub">Investing, bite-sized</div>
          </div>
        </div>

        <div className="greet">
          <div className="greet-hi">안녕하세요</div>
          <div className="greet-name">민지님 👋</div>
          <div className="greet-meta">
            <span className="greet-dot" />
            오늘도 좋은 하루 되세요
          </div>
        </div>

        <nav className="nav">
          <div className="nav-label">Menu</div>
          {[
            ['home', '대시보드'],
            ['portfolio', '포트폴리오'],
            ['watch', '관심 종목'],
            ['news', '뉴스 & 리포트'],
          ].map(([key, label]) => (
            <button key={key} className={`nav-item ${active === key ? 'active' : ''}`} onClick={() => setActive(key)}>
              <span className="nav-icon">•</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="beginner-card">
            <div className="beginner-row">
              <div>
                <div className="beginner-title">Beginner Mode</div>
                <div className="beginner-sub">{beginner ? '쉬운 설명 표시' : '전문가 모드'}</div>
              </div>
              <div className={`toggle ${beginner ? 'on' : ''}`} onClick={() => setBeginner((value) => !value)} role="button" tabIndex={0}>
                <div className="toggle-knob" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <div className="header-title">대시보드</div>
            <div className="header-date">2026년 5월 5일 화요일 · 장 마감 14:32</div>
          </div>
          <div className="search">
            <span className="search-icon">⌕</span>
            <input placeholder="종목명, 티커, 키워드 검색" />
            <span className="search-kbd">⌘K</span>
          </div>
          <button className="header-btn" title="알림">🔔<span className="badge" /></button>
          <button className="header-btn" title="설정">⚙</button>
          <div className="user-chip">
            <div className="user-avatar">민</div>
            <span className="user-name">민지</span>
          </div>
        </header>

        <div className="content">
          <section className="indicators">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">1</span> 시장 요약</div>
                <div className="card-title">오늘의 경제 지수 현황</div>
                {beginner && <div className="card-sub">주요 지수와 환율, 위험지표를 한눈에 볼 수 있어요.</div>}
              </div>
              <div className="ind-pager-controls">
                <button className="ind-arrow">›</button>
                <button className="ind-arrow">›</button>
              </div>
            </div>
            <div className="indicators-page">
              {indicators.map((indicator) => (
                <div key={indicator.label} className="indicator">
                  <div className="indicator-label">{indicator.label}</div>
                  <div className="indicator-value">{indicator.value}</div>
                  <div className={`indicator-change ${indicator.up ? 'up' : 'down'}`}>
                    {indicator.change} ({indicator.pct})
                  </div>
                  <div className="indicator-spark">
                    <Sparkline data={[1, 3, 2, 4, 3, 5, 4, 6]} />
                  </div>
                </div>
              ))}
            </div>
            <div className="ind-pager-foot">
              <div className="ind-page-count">
                <span className="ind-page-num">01</span>
                <span className="ind-page-sep">/</span>
                <span className="ind-page-total">01</span>
                <span className="ind-page-label">페이지</span>
              </div>
              <div className="ind-dots">
                <button className="ind-dot active" />
              </div>
            </div>
          </section>

          <section className="card chart-card">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">2</span> 내가 보고있는 종목</div>
                <div className="card-title">삼성전자 차트 분석</div>
                {beginner && <div className="card-sub">주가 흐름과 핵심 지표를 같이 볼 수 있어요.</div>}
              </div>
              <div className="chart-tabs">
                {['1D', '1W', '1M'].map((tab) => (
                  <button key={tab} className={`chart-tab ${tab === '1D' ? 'active' : ''}`}>{tab}</button>
                ))}
              </div>
            </div>
            <div className="chart-stock-row">
              <div>
                <div className="chart-symbol">005930 · KOSPI</div>
                <div className="chart-name">삼성전자</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="chart-price">72,400 <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>KRW</span></div>
                <div className="chart-delta">+1,300 (+1.83%) ▲ 오늘</div>
              </div>
            </div>
            <div className="chart-area"><ChartArea /></div>
            <div className="chart-stats">
              <div>
                <div className="chart-stat-label">거래량</div>
                <div className="chart-stat-value">14.2M</div>
              </div>
              <div>
                <div className="chart-stat-label">시가총액</div>
                <div className="chart-stat-value">432조</div>
              </div>
              <div>
                <div className="chart-stat-label">PER</div>
                <div className="chart-stat-value">14.8x</div>
              </div>
              <div>
                <div className="chart-stat-label">52주 변동</div>
                <div className="chart-stat-value">68,000–86,500</div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">3</span> 주요 뉴스</div>
                <div className="card-title">시장 핵심 뉴스</div>
                {beginner && <div className="card-sub">시장에 영향을 주는 뉴스만 요약했어요.</div>}
              </div>
            </div>
            <div className="news-list">
              {news.map((item) => (
                <div key={item.title} className="news-item">
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

          <section className="card">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">4</span> 관심 종목</div>
                <div className="card-title">My Watchlist</div>
                {beginner && <div className="card-sub">내가 보는 종목의 가격과 변화율을 모아봤어요.</div>}
              </div>
            </div>
            <div className="watch-list">
              {watchlist.map((item) => (
                <div key={item.symbol} className="watch-item">
                  <div className="watch-icon">{item.symbol.slice(0, 2)}</div>
                  <div className="watch-info">
                    <div className="watch-name">{item.name}</div>
                    <div className="watch-symbol">{item.symbol}</div>
                  </div>
                  <div className="watch-spark">
                    <Sparkline data={[1, 2, 1, 3, 2, 4, 3, 5]} />
                  </div>
                  <div className="watch-price">
                    <div className="watch-price-val">{item.price}</div>
                    <div className={`watch-price-chg ${item.up ? 'up' : 'down'}`}>{item.chg}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">5</span> 유저 투자성향</div>
                <div className="card-title">나의 투자 DNA</div>
                {beginner && <div className="card-sub">간단한 설문과 관심 종목을 바탕으로 보여줘요.</div>}
              </div>
            </div>
            <div className="propensity">
              <div className="donut-wrap">
                <svg viewBox="0 0 120 120" width="130" height="130">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#f7f6f4" strokeWidth="14" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="#facc18"
                    strokeWidth="14"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={`${2 * Math.PI * 48 * (1 - 0.72)}`}
                    transform="rotate(-90 60 60)"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="donut-center">
                  <div className="donut-type">안정 성장형</div>
                  <div className="donut-score">스코어 72</div>
                </div>
              </div>
              <div className="propensity-list">
                {['안정 추구', '장기 투자', '리스크 감내', '학습 의지'].map((label, index) => (
                  <div key={label} className="propensity-row">
                    <div className="propensity-label">{label}</div>
                    <div className="propensity-bar">
                      <div className={`propensity-bar-fill ${index % 2 === 0 ? 'point' : ''}`} style={{ width: `${78 - index * 12}%` }} />
                    </div>
                    <div className="propensity-val">{78 - index * 12}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">6</span> 투자 상식 카드</div>
                <div className="card-title">오늘의 한 입 지식</div>
                {beginner && <div className="card-sub">매일 바뀌는 짧은 투자 상식이에요.</div>}
              </div>
            </div>
            <div className="know-cards">
              {knowCards.map((card, index) => (
                <div key={card.num} className={`know-mini k${index + 1}`}>
                  <div className="know-mini-num">{card.num}</div>
                  <div className="know-mini-title">{card.title}</div>
                </div>
              ))}
            </div>
            <div className="know-feature">
              <div className="know-feature-tag">Today's Pick</div>
              <div className="know-feature-title">복리의 마법: 72의 법칙</div>
              <div className="know-feature-desc">72를 연 수익률로 나누면 원금이 두 배가 되는 햇수가 나와요. 7%면 약 10년!</div>
            </div>
            <div className="glossary-mini">{whySummary[0]}</div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">7</span> 투자 기초 퀴즈</div>
                <div className="card-title">데일리 챌린지</div>
                {beginner && <div className="card-sub">짧은 퀴즈로 경제 지식을 늘려보세요.</div>}
              </div>
              <span className="quiz-tag">Day 3</span>
            </div>
            <div className="quiz-q">{quiz.question}</div>
            <div className="quiz-options">
              {quiz.options.map((option, index) => {
                let className = 'quiz-opt'
                if (picked !== null) {
                  if (option.correct) className += ' correct'
                  else if (picked === index) className += ' wrong'
                }

                return (
                  <button key={option.letter} className={className} onClick={() => setPicked(index)}>
                    <span className="quiz-opt-letter">{option.letter}</span>
                    {option.text}
                  </button>
                )
              })}
            </div>
            <div className="quiz-progress">
              <span>오늘 진행</span>
              <div className="quiz-progress-track">
                <div className="quiz-progress-fill" style={{ width: '60%' }} />
              </div>
              <span>3/5</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App