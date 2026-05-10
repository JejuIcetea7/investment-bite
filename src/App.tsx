import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './App.css'

type KnowledgeCard = {
  id: string
  term: string
  category: string
  description: string
}

type Indicator = {
  label: string
  symbol: string
  value: string
  change: string
  pct: string
  up: boolean
  series: number[]
}

type MarketStat = {
  label: string
  value: string
}

type MarketStatus = {
  signal: 'up' | 'down' | 'sideways' | 'caution' | 'insufficient_data' | 'invalid_data'
  label: string
  reasonText: string
  reasonCodes: string[]
  riskReasons: string[]
  volatilityLevel: 'low' | 'medium' | 'high' | 'unknown'
}

type ChartData = {
  symbol: string
  name: string
  currency: string
  price: string
  change: string
  percent: string
  series: number[]
  stats: MarketStat[]
  note: string
}

type WatchItem = {
  name: string
  symbol: string
  price: string
  chg: string
  up: boolean
  series: number[]
}

type PropensityQuestion = {
  q: string
  opts: string[]
}

type PropensityResult = {
  title: string
  badge: string
  score: number
  summary: string
  note: string
  traits: Array<{ label: string; val: number; point: boolean }>
}

type TourStep = {
  sel: string
  title: string
  text: string
  pos: 'top' | 'bottom' | 'left' | 'right'
  widgetKey?: DashboardWidgetKey
}

type DailyQuiz = {
  id: string
  type: 'ox' | 'multiple_choice'
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

type DailyQuizData = {
  version: number
  updatedAt: string
  title: string
  description: string
  quizzes: DailyQuiz[]
}

type MarketData = {
  generatedAt: string
  generatedAtLabel: string
  marketStatus: MarketStatus
  indicators: Indicator[]
  chart: ChartData
  watchlist: WatchItem[]
}
type HoverHelp = {
  title: string
  text: string
  x: number
  y: number
}

const DASHBOARD_WIDGETS = ['watch', 'propensity', 'know', 'quiz'] as const
type DashboardWidgetKey = (typeof DASHBOARD_WIDGETS)[number]

const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetKey, string> = {
  watch: '관심 종목',
  propensity: '유저 투자성향',
  know: '투자 상식 카드',
  quiz: '투자 기초 퀴즈',
}

const STOCK_ALIASES: Record<string, string[]> = {
  '005930.KS': ['삼성전자', '삼전', 'samsung', 'samsung electronics', '005930'],
  NVDA: ['nvidia', '엔비디아', '엔비', 'nvda'],
  AAPL: ['apple', 'apple inc', '애플', 'aapl'],
  '035720.KS': ['카카오', 'kakao', '035720'],
  '000660.KS': ['sk하이닉스', 'sk hynix', '하이닉스', 'hynix', '000660'],
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s._-]/g, '')
}

const defaultMarketData: MarketData = {
  generatedAt: '2026-05-05T05:32:00.000Z',
  generatedAtLabel: '2026년 5월 5일 화요일 · 장 마감 14:32',
  marketStatus: {
    signal: 'sideways',
    label: '횡보',
    reasonText: '방향성이 뚜렷하지 않습니다.',
    reasonCodes: ['PRICE_NEAR_MA20'],
    riskReasons: [],
    volatilityLevel: 'medium',
  },
  indicators: [
    { label: 'KOSPI', symbol: '^KS11', value: '2,718.43', change: '+18.62', pct: '+0.69%', up: true, series: [1, 2, 1.5, 2.1, 2, 2.5, 2.3, 2.8] },
    { label: 'S&P 500', symbol: '^GSPC', value: '5,832.91', change: '-12.47', pct: '-0.21%', up: false, series: [2.8, 2.7, 2.6, 2.7, 2.5, 2.4, 2.3, 2.2] },
    { label: 'USD/KRW', symbol: 'USDKRW=X', value: '1,378.20', change: '+3.40', pct: '+0.25%', up: true, series: [1, 1.2, 1.1, 1.3, 1.2, 1.35, 1.4, 1.45] },
    { label: 'WTI', symbol: 'CL=F', value: '78.42', change: '+0.85', pct: '+1.10%', up: true, series: [2, 2.1, 2.2, 2.15, 2.25, 2.3, 2.32, 2.4] },
    { label: 'Bitcoin', symbol: 'BTC-USD', value: '92,341', change: '+1,820', pct: '+2.01%', up: true, series: [3, 3.4, 3.3, 3.6, 3.8, 4, 4.1, 4.3] },
    { label: 'VIX', symbol: '^VIX', value: '14.82', change: '-0.34', pct: '-2.24%', up: false, series: [2.2, 2.1, 2, 1.9, 1.8, 1.7, 1.6, 1.5] },
    { label: 'NASDAQ', symbol: '^IXIC', value: '18,421', change: '-45.12', pct: '-0.24%', up: false, series: [2.8, 2.7, 2.6, 2.5, 2.7, 2.6, 2.4, 2.3] },
    { label: 'KOSDAQ', symbol: '^KQ11', value: '789.24', change: '+5.18', pct: '+0.66%', up: true, series: [1.2, 1.3, 1.2, 1.4, 1.35, 1.45, 1.5, 1.6] },
    { label: '금', symbol: 'GC=F', value: '2,384', change: '+12.30', pct: '+0.52%', up: true, series: [2, 2.1, 2.05, 2.2, 2.15, 2.25, 2.3, 2.4] },
    { label: '닛케이', symbol: '^N225', value: '38,405', change: '-124', pct: '-0.32%', up: false, series: [3, 2.9, 2.8, 2.7, 2.75, 2.65, 2.6, 2.5] },
    { label: 'EUR/USD', symbol: 'EURUSD=X', value: '1.0832', change: '+0.0021', pct: '+0.19%', up: true, series: [1.5, 1.52, 1.51, 1.54, 1.53, 1.55, 1.57, 1.58] },
    { label: '미 국채10Y', symbol: '^TNX', value: '4.421%', change: '-0.032', pct: '-0.72%', up: false, series: [2.5, 2.4, 2.35, 2.3, 2.28, 2.22, 2.2, 2.15] },
  ],
  chart: {
    symbol: '005930.KS',
    name: '삼성전자',
    currency: 'KRW',
    price: '72,400',
    change: '+1,300',
    percent: '+1.83%',
    series: Array.from({ length: 60 }, (_, index) => {
      const base = 48 + Math.sin(index / 7) * 7 + Math.cos(index / 4) * 3
      return base + index * 0.22
    }),
    stats: [
      { label: '거래량', value: '14.2M' },
      { label: '시가총액', value: '432조' },
      { label: 'PER', value: '14.8x' },
      { label: '52주 변동', value: '68,000–86,500' },
    ],
    note: '주가 흐름과 핵심 지표를 같이 볼 수 있어요.',
  },
  watchlist: [
    { name: '삼성전자', symbol: '005930.KS', price: '72,400', chg: '+1.83%', up: true, series: [1, 2, 1, 3, 2, 4, 3, 5] },
    { name: 'NVIDIA', symbol: 'NVDA', price: '$148.20', chg: '+2.41%', up: true, series: [2, 2.2, 2.1, 2.4, 2.5, 2.7, 2.8, 3] },
    { name: 'Apple Inc.', symbol: 'AAPL', price: '$226.45', chg: '-0.62%', up: false, series: [3, 2.9, 2.8, 2.7, 2.6, 2.5, 2.45, 2.4] },
    { name: '카카오', symbol: '035720.KS', price: '38,150', chg: '+0.92%', up: true, series: [1.2, 1.25, 1.22, 1.3, 1.28, 1.34, 1.38, 1.42] },
    { name: 'SK하이닉스', symbol: '000660.KS', price: '195,500', chg: '+3.21%', up: true, series: [1.8, 2, 1.9, 2.2, 2.3, 2.5, 2.7, 3] },
  ],
}
const INDICATOR_HELP: Record<string, { title: string; text: string }> = {
  KOSPI: {
    title: 'KOSPI',
    text: '국내 주식시장의 대표 지수입니다. 전체 한국 증시가 강한지 약한지를 빠르게 보여줍니다.',
  },
  'S&P 500': {
    title: 'S&P 500',
    text: '미국 대형주 500개를 묶은 대표 지수입니다. 글로벌 위험선호 분위기를 확인할 때 자주 봅니다.',
  },
  'USD/KRW': {
    title: 'USD/KRW',
    text: '원화 대비 달러 환율입니다. 수출주, 원자재, 외국인 수급에 영향을 줄 수 있습니다.',
  },
  WTI: {
    title: 'WTI',
    text: '서부텍사스산 원유 가격입니다. 에너지와 물가 흐름을 볼 때 참고합니다.',
  },
  Bitcoin: {
    title: 'Bitcoin',
    text: '가상자산 대표 자산입니다. 위험자산 선호와 유동성 분위기를 가늠할 때 함께 봅니다.',
  },
  VIX: {
    title: 'VIX',
    text: '시장 변동성 지수입니다. 높아질수록 불안 심리가 커졌다고 해석하는 경우가 많습니다.',
  },
  NASDAQ: {
    title: 'NASDAQ',
    text: '미국 기술주 중심 종합 지수입니다. AI·반도체·소프트웨어 섹터의 분위기를 빠르게 확인할 수 있습니다.',
  },
  KOSDAQ: {
    title: 'KOSDAQ',
    text: '국내 중소·벤처 기업 중심 시장입니다. 코스피와 함께 보면 국내 증시의 큰 그림이 보입니다.',
  },
  '금': {
    title: '금 (Gold)',
    text: '대표적인 안전자산입니다. 불확실성이 높아지거나 달러가 약해질 때 강세를 보이는 경향이 있습니다.',
  },
  '닛케이': {
    title: '닛케이 225',
    text: '일본을 대표하는 주가지수입니다. 엔화 흐름과 함께 아시아 증시 전체를 볼 때 참고합니다.',
  },
  'EUR/USD': {
    title: 'EUR/USD',
    text: '유로 대비 달러 환율입니다. 달러의 강약과 유럽 경기 흐름을 함께 읽을 때 봅니다.',
  },
  '미 국채10Y': {
    title: '미국 10년물 국채 수익률',
    text: '시장이 기대하는 장기 금리 수준입니다. 높아질수록 성장주 및 기술주에 부담이 생기는 경향이 있습니다.',
  },
}

const STAT_HELP: Record<string, { title: string; text: string }> = {
  거래량: {
    title: '거래량 (Volume)',
    text: '하루 동안 사고팔린 주식 수입니다. 관심이 집중되면 거래량이 함께 늘어나는 경우가 많습니다.',
  },
  시가총액: {
    title: '시가총액 (Market Cap)',
    text: '주가에 발행 주식 수를 곱한 값입니다. 회사의 규모를 보는 가장 기본적인 지표입니다.',
  },
  PER: {
    title: 'PER (주가수익비율)',
    text: '주가가 연간 이익의 몇 배인지 나타냅니다. 가치평가를 볼 때 자주 사용합니다.',
  },
  '52주 변동': {
    title: '52주 변동폭',
    text: '지난 1년간의 최저가와 최고가 범위입니다. 현재 가격이 어느 위치에 있는지 확인할 수 있습니다.',
  },
}

const news = [
  { tag: '시장', title: '코스피, 외국인 매수에 2,720선 회복… 반도체 강세 지속', meta: '한국경제 · 12분 전' },
  { tag: '종목', title: '삼성전자, HBM3E 양산 본격화 발표… 외국계 목표가 상향', meta: '머니투데이 · 1시간 전' },
  { tag: '경제', title: '미 CPI 둔화 전망… 12월 금리 인하 가능성 60% 반영', meta: '블룸버그 · 2시간 전' },
  { tag: '정책', title: '한국은행 총재 "당분간 통화정책 신중 기조 유지"', meta: '연합뉴스 · 3시간 전' },
]


const PROPENSITY_QUESTIONS: PropensityQuestion[] = [
  {
    q: '투자 기간은 얼마나 생각하시나요?',
    opts: ['1개월 이내', '3~6개월', '1년 이상'],
  },
  {
    q: '주가가 10% 하락하면 어떻게 할까요?',
    opts: ['바로 정리한다', '일단 관망한다', '추가 매수도 고려한다'],
  },
  {
    q: '투자에서 더 중요한 것은 무엇인가요?',
    opts: ['안정성', '균형', '성장성'],
  },
  {
    q: '원하는 투자 스타일에 더 가까운 것은?',
    opts: ['배당 중심', '분산 투자', '고성장 중심'],
  },
]

const TOUR_STEPS: TourStep[] = [
  {
    sel: '[data-tour="market-summary"]',
    title: '시장 요약',
    text: '6개의 핵심 지표를 한눈에 보세요. 카드 위에 마우스를 올리면 설명이 떠요.',
    pos: 'bottom',
  },
  {
    sel: '[data-tour="chart"]',
    title: '내 종목 차트',
    text: '관심 종목의 흐름을 차트로 보고, 핵심 지표도 함께 확인할 수 있어요.',
    pos: 'right',
  },
  {
    sel: '[data-tour="news"]',
    title: '시장 핵심 뉴스',
    text: '오늘 시장에 영향을 주는 뉴스만 모아 보여줍니다.',
    pos: 'left',
  },
  {
    sel: '[data-tour="watch"]',
    title: '관심 종목',
    text: '내가 보는 종목의 가격과 추세를 빠르게 확인하세요.',
    pos: 'left',
    widgetKey: 'watch',
  },
  {
    sel: '[data-tour="propensity"]',
    title: '투자성향 분석',
    text: '설문과 관심 종목을 바탕으로 나만의 투자 성향을 보여줍니다.',
    pos: 'top',
    widgetKey: 'propensity',
  },
  {
    sel: '[data-tour="know"]',
    title: '투자 상식 카드',
    text: '짧은 카드로 자주 나오는 투자 개념을 익혀보세요.',
    pos: 'top',
    widgetKey: 'know',
  },
  {
    sel: '[data-tour="quiz"]',
    title: '데일리 퀴즈',
    text: '짧은 퀴즈로 경제 상식을 늘려보세요.',
    pos: 'top',
    widgetKey: 'quiz',
  },
  {
    sel: '[data-tour="beginner-toggle"]',
    title: '초보자 모드',
    text: '언제든지 토글로 쉬운 설명 표시를 켜고 끌 수 있어요.',
    pos: 'right',
  },
]

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

function ChartArea({ data }: { data: number[] }) {
  const width = 720
  const height = 220
  const padding = 6
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (value - min) / range) * (height - padding * 2)
    return [x, y] as const
  })

  const path = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const fillPath = `${path} L${width - padding},${height - padding} L${padding},${height - padding} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#facc18" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#facc18" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((fraction) => (
        <line key={fraction} x1={padding} x2={width - padding} y1={height * fraction} y2={height * fraction} stroke="#ece9e2" strokeDasharray="3 4" />
      ))}
      <path d={fillPath} fill="url(#chartGrad)" />
      <path d={path} stroke="#3a2204" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="5" fill="#facc18" stroke="#3a2204" strokeWidth="2" />
    </svg>
  )
}

function createPropensityResult(answers: number[]): PropensityResult {
  const score = answers.reduce((total, answer, index) => {
    const bonusByQuestion = [12, 14, 13, 11]
    return total + bonusByQuestion[index] * answer
  }, 40)

  let profile: Pick<PropensityResult, 'title' | 'badge' | 'summary' | 'note'>

  if (score < 48) {
    profile = {
      title: '안정형',
      badge: '리스크 관리 우선',
      summary: '손실을 줄이고 흐름을 천천히 확인하는 성향입니다.',
      note: '배당, 대형주, 분산처럼 흔들림이 적은 선택이 잘 맞습니다.',
    }
  } else if (score < 68) {
    profile = {
      title: '균형형',
      badge: '안정과 성장의 중간',
      summary: '안정성과 성장성을 함께 보는 편입니다.',
      note: '대형 우량주와 일부 성장주를 섞는 방식이 어울립니다.',
    }
  } else if (score < 84) {
    profile = {
      title: '성장형',
      badge: '성장 잠재력 중시',
      summary: '조금 더 큰 변동을 감수하고 성장 가능성을 보는 편입니다.',
      note: '실적 개선, 산업 성장성, 중장기 모멘텀을 중요하게 봅니다.',
    }
  } else {
    profile = {
      title: '공격형',
      badge: '높은 변동성 감내',
      summary: '변동성을 감수하더라도 높은 수익 기회를 적극적으로 찾는 성향입니다.',
      note: '변동성이 큰 종목을 다루더라도 비중 관리가 중요합니다.',
    }
  }

  const traits = [
    { label: '안정 추구', val: Math.max(18, 92 - answers[0] * 18 - answers[2] * 10), point: true },
    { label: '장기 투자', val: Math.max(20, 40 + answers[0] * 20 + answers[3] * 10), point: false },
    { label: '리스크 감내', val: Math.max(14, 26 + answers[1] * 24 + answers[2] * 10), point: false },
    { label: '학습 의지', val: Math.max(30, 58 + answers[3] * 12), point: true },
  ]

  return {
    title: profile.title,
    badge: profile.badge,
    score,
    summary: profile.summary,
    note: profile.note,
    traits,
  }
}

function SurveyModal({
  open,
  step,
  answers,
  onPick,
  onPrev,
  onNext,
  onClose,
}: {
  open: boolean
  step: number
  answers: number[]
  onPick: (index: number) => void
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}) {
  const question = PROPENSITY_QUESTIONS[step]
  const canNext = answers[step] !== undefined

  if (!open) return null

  return (
    <>
      <div className="overlay show" onClick={onClose} />
      <div className="modal show">
        <div className="modal-head">
          <div>
            <div className="survey-step">투자 성향 분석 · {step + 1}/{PROPENSITY_QUESTIONS.length}</div>
            <div className="modal-title" style={{ marginTop: 6 }}>나에게 맞는 투자 스타일을 찾아볼게요</div>
            <div className="modal-sub">짧은 질문 4개로 성향을 계산합니다</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="survey-q">{question.q}</div>

        <div className="survey-opts">
          {question.opts.map((option, index) => (
            <button
              key={option}
              className={`survey-opt ${answers[step] === index ? 'selected' : ''}`}
              onClick={() => onPick(index)}
            >
              <span className="survey-opt-radio" />
              {option}
            </button>
          ))}
        </div>

        <div className="modal-foot">
          <div className="step-dots">
            {PROPENSITY_QUESTIONS.map((_, index) => (
              <div key={index} className={`step-dot ${index === step ? 'active' : ''}`} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && <button className="btn-ghost" onClick={onPrev}>이전</button>}
            <button className="btn-primary" onClick={onNext} disabled={!canNext} style={{ opacity: canNext ? 1 : 0.5, cursor: canNext ? 'pointer' : 'not-allowed' }}>
              {step === PROPENSITY_QUESTIONS.length - 1 ? '분석하기' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function TourOverlay({
  active,
  step,
  steps,
  onNext,
  onSkip,
}: {
  active: boolean
  step: number
  steps: TourStep[]
  onNext: () => void
  onSkip: () => void
}) {
  const [box, setBox] = useState<null | (TourStep & { x: number; y: number; w: number; h: number })>(null)

  const CHAR_MAP: Record<string, string> = {
    '[data-tour="propensity"]': '/charcter/투자성향_분석_아이콘png.png',
    '[data-tour="know"]': '/charcter/공부하는_아이콘.png',
    '[data-tour="quiz"]': '/charcter/투자_상식_카드_아이콘.png',
    '[data-tour="news"]': '/charcter/뉴스_아이콘.png',
  }

  useEffect(() => {
    if (!active) {
      return
    }

    if (!steps[step]) {
      return
    }

    const update = () => {
      const target = steps[step]
      const element = document.querySelector(target.sel)
      if (!element) {
        setBox(null)
        return
      }

      const rect = element.getBoundingClientRect()
      setBox({
        ...target,
        x: rect.left - 8,
        y: rect.top - 8,
        w: rect.width + 16,
        h: rect.height + 16,
      })
    }

    update()
    const element = document.querySelector(steps[step].sel)
    if (element && 'scrollIntoView' in element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [active, step, steps])

  if (!active || !box || !steps[step]) return null

  const cardWidth = 320
  const cardHeight = 180
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = box.x + box.w + 12
  let top = box.y + box.h / 2 - cardHeight / 2

  if (box.pos === 'bottom') {
    left = box.x + box.w / 2 - cardWidth / 2
    top = box.y + box.h + 12
  } else if (box.pos === 'top') {
    left = box.x + box.w / 2 - cardWidth / 2
    top = box.y - cardHeight - 12
  } else if (box.pos === 'left') {
    left = box.x - cardWidth - 12
    top = box.y + box.h / 2 - cardHeight / 2
  }

  left = Math.max(16, Math.min(left, viewportWidth - cardWidth - 16))
  top = Math.max(16, Math.min(top, viewportHeight - cardHeight - 16))

  // compute character position outside the card (to the left when possible)
  const charSrc = CHAR_MAP[box.sel]
  const CHAR_SIZE = 140
  const charLeft = Math.max(12, left - CHAR_SIZE - 12)
  const charTop = top + 8

  return (
    <div className="tour-overlay show">
      <div className="tour-spot" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />
      {charSrc && (
        <img src={charSrc} className="tour-char-outside" style={{ left: charLeft, top: charTop, width: CHAR_SIZE, height: CHAR_SIZE }} alt="가이드 캐릭터" />
      )}
      <div className="tour-card" style={{ left, top }}>
        <span className="tour-step-label">STEP {step + 1} / {TOUR_STEPS.length}</span>
        <div className="tour-title">{box.title}</div>
        <div className="tour-text">{box.text}</div>
        <div className="tour-foot">
          <button className="tour-skip" onClick={onSkip}>건너뛰기</button>
          <button className="btn-primary" onClick={onNext}>
            {step === steps.length - 1 ? '시작하기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionHelpTooltip({ help }: { help: HoverHelp | null }) {
  if (!help) return null

  return createPortal(
    <div className="tooltip-fixed show" style={{ left: help.x, top: help.y, zIndex: 999 }}>
      <div className="tooltip-label">What it is</div>
      <div className="tooltip-title">{help.title}</div>
      <div>{help.text}</div>
    </div>,
    document.body,
  )
}

function EditableWidgetShell({
  widgetKey,
  visible,
  editMode,
  onToggle,
  children,
}: {
  widgetKey: DashboardWidgetKey
  visible: boolean
  editMode: boolean
  onToggle: () => void
  children: ReactNode
}) {
  if (!editMode && !visible) return null

  return (
    <div className={`editable-widget-shell ${editMode ? 'edit-mode' : ''} ${visible ? 'is-visible' : 'is-hidden'}`} data-widget={widgetKey}>
      {editMode && (
        <button type="button" className="editable-widget-toggle" onClick={onToggle} aria-pressed={visible}>
          {visible ? '숨기기' : '보이기'}
        </button>
      )}
      {visible ? children : (
        <div className="editable-widget-placeholder card">
          <div className="editable-widget-placeholder-title">{DASHBOARD_WIDGET_LABELS[widgetKey]}</div>
          <div className="editable-widget-placeholder-sub">편집 모드에서 다시 표시할 수 있어요.</div>
        </div>
      )}
    </div>
  )
}

const IND_PER_PAGE = 6
const IND_INTERVAL_MS = 10000

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
  const [hoverHelp, setHoverHelp] = useState<HoverHelp | null>(null)
  const [whyOpen, setWhyOpen] = useState(false)
  const [whyPropOpen, setWhyPropOpen] = useState(false)
  const [chartTab, setChartTab] = useState<'1D' | '1W' | '1M' | '전체'>('1D')
  const [selectedWatchItem, setSelectedWatchItem] = useState<WatchItem | null>(null)
  const [chartSeries, setChartSeries] = useState<number[] | null>(null)
  const [chartLoading, setChartLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [indPage, setIndPage] = useState(0)
  const [indPlaying, setIndPlaying] = useState(true)
  const [indResetKey, setIndResetKey] = useState(0)
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
  const isWholeView = active === 'whole'
  const [loadingVisible, setLoadingVisible] = useState(true)
  const [allKnowledgeCards, setAllKnowledgeCards] = useState<KnowledgeCard[]>([])
  const [knowledgeCards, setKnowledgeCards] = useState<KnowledgeCard[]>([])

  useEffect(() => {
    document.title = '투자 한입 대시보드 · Yahoo Finance'

    let ignore = false

    fetch('/data/market-data.json', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load market data: ${response.status}`)
        }
        return response.json() as Promise<MarketData>
      })
      .then((payload) => {
        if (ignore) return
        setMarketData(payload)
        setDataSource('Yahoo Finance')
      })
      .catch(() => {
        if (ignore) return
        setDataSource('기본 데이터')
      })
      .finally(() => {
        if (ignore) return
        // keep loading screen visible a short while for smoothness
        setTimeout(() => setLoadingVisible(false), 350)
      })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    fetch('/data/daily-quiz.json', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load daily quiz: ${response.status}`)
        }
        return response.json() as Promise<DailyQuizData>
      })
      .then((payload) => {
        if (ignore) return
        setDailyQuizzes(payload.quizzes)
      })
      .catch(() => {
        if (ignore) return
        setDailyQuizzes([])
      })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    fetch('/data/knowledge-cards.json')
      .then((r) => r.json() as Promise<{ cards: KnowledgeCard[] }>)
      .then(({ cards }) => {
        setAllKnowledgeCards(cards)
        const shuffled = [...cards].sort(() => Math.random() - 0.5)
        setKnowledgeCards(shuffled.slice(0, 2))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('dashboard-hidden-widgets', JSON.stringify(hiddenWidgets))
    } catch {
      // Ignore storage failures and keep the UI usable.
    }
  }, [hiddenWidgets])

  const displayChart = useMemo(() => {
    if (!selectedWatchItem) return marketData.chart
    return {
      symbol: selectedWatchItem.symbol,
      name: selectedWatchItem.name,
      currency: selectedWatchItem.symbol.endsWith('.KS') ? 'KRW' : 'USD',
      price: selectedWatchItem.price,
      change: selectedWatchItem.chg,
      percent: selectedWatchItem.chg,
      series: selectedWatchItem.series,
      stats: marketData.chart.stats,
      note: marketData.chart.note,
    }
  }, [selectedWatchItem, marketData.chart])

  useEffect(() => {
    const symbol = selectedWatchItem?.symbol ?? marketData.chart.symbol
    const controller = new AbortController()

    fetch(`/api/chart/${encodeURIComponent(symbol)}/${encodeURIComponent(chartTab)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json() as Promise<{ series?: number[] }>)
      .then((data) => {
        if (data.series && data.series.length > 0) setChartSeries(data.series)
      })
      .catch(() => { /* API unavailable — falls back to static data */ })
      .finally(() => setChartLoading(false))

    return () => controller.abort()
  }, [chartTab, selectedWatchItem, marketData.chart.symbol])

  const displayedSeries = chartSeries ?? displayChart.series
  const currentDailyQuiz = dailyQuizzes[dailyQuizIndex] ?? null
  const isDailyQuizComplete = dailyQuizzes.length > 0 && dailyQuizIndex >= dailyQuizzes.length
  const isDailyQuizAnswered = selectedDailyAnswer !== null
  const dailyQuizSolvedCount = Math.min(dailyQuizIndex + (isDailyQuizAnswered ? 1 : 0), dailyQuizzes.length)
  const dailyQuizProgress = dailyQuizzes.length > 0 ? (dailyQuizSolvedCount / dailyQuizzes.length) * 100 : 0
  const normalizedSearchQuery = normalizeSearchText(searchQuery)
  const searchMatches = useMemo(() => {
    if (normalizedSearchQuery.length < 2) return []

    return marketData.watchlist.filter((stock) => {
      const aliases = STOCK_ALIASES[stock.symbol] ?? []
      const searchableText = [
        stock.name,
        stock.symbol,
        ...aliases,
      ].map(normalizeSearchText).join(' ')

      return searchableText.includes(normalizedSearchQuery)
    })
  }, [marketData.watchlist, normalizedSearchQuery])
  const showSearchSuggestions = searchFocused && normalizedSearchQuery.length >= 2
  const indTotalPages = Math.max(1, Math.ceil(marketData.indicators.length / IND_PER_PAGE))
  const safeIndPage = Math.min(indPage, indTotalPages - 1)
  const visibleTourSteps = useMemo(
    () => TOUR_STEPS.filter((step) => !step.widgetKey || !hiddenWidgets.includes(step.widgetKey)),
    [hiddenWidgets],
  )
  const safeTourStep = Math.min(tourStep, visibleTourSteps.length - 1)

  useEffect(() => {
    if (!indPlaying) return
    const id = setInterval(() => {
      setIndPage((p) => (p + 1) % indTotalPages)
    }, IND_INTERVAL_MS)
    return () => clearInterval(id)
  }, [indPlaying, indResetKey, indTotalPages])

  const goPrevIndicatorPage = () => {
    setIndPage((p) => (p - 1 + indTotalPages) % indTotalPages)
    setIndResetKey((v) => v + 1)
  }

  const goNextIndicatorPage = () => {
    setIndPage((p) => (p + 1) % indTotalPages)
    setIndResetKey((v) => v + 1)
  }

  const startTour = () => {
    setTourStep(0)
    setTourActive(true)
  }

  const nextTourStep = () => {
    if (safeTourStep >= visibleTourSteps.length - 1) {
      setTourActive(false)
      return
    }

    setTourStep((value) => value + 1)
  }

  const skipTour = () => {
    setTourActive(false)
  }

  const showHoverHelp = (title: string, text: string) => (event: React.MouseEvent<HTMLElement>) => {
    setHoverHelp({
      title,
      text,
      x: event.clientX + 16,
      y: event.clientY + 16,
    })
  }

  const moveHoverHelp = (event: React.MouseEvent<HTMLElement>) => {
    setHoverHelp((current) => {
      if (!current) return current
      return {
        ...current,
        x: event.clientX + 16,
        y: event.clientY + 16,
      }
    })
  }

  const openPropensity = () => {
    setPropensityStep(0)
    setPropensityAnswers([])
    setPropensityOpen(true)
  }

  const toggleDashboardWidget = (widgetKey: DashboardWidgetKey) => {
    setHiddenWidgets((current) => (
      current.includes(widgetKey)
        ? current.filter((item) => item !== widgetKey)
        : [...current, widgetKey]
    ))
  }

  const refreshKnowledgeCards = () => {
    const currentIds = new Set(knowledgeCards.map((c) => c.id))
    const pool = allKnowledgeCards.filter((c) => !currentIds.has(c.id))
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    setKnowledgeCards(shuffled.slice(0, 2))
  }

  const closePropensity = () => {
    setPropensityOpen(false)
  }

  const pickPropensityAnswer = (index: number) => {
    setPropensityAnswers((current) => {
      const next = [...current]
      next[propensityStep] = index
      return next
    })
  }

  const nextPropensityStep = () => {
    const isLast = propensityStep === PROPENSITY_QUESTIONS.length - 1

    if (!isLast) {
      setPropensityStep((current) => current + 1)
      return
    }

    const result = createPropensityResult(propensityAnswers)
    setPropensityResult(result)
    setPropensityOpen(false)
  }

  const prevPropensityStep = () => {
    setPropensityStep((current) => Math.max(0, current - 1))
  }

  const pickDailyQuizAnswer = (answerIndex: number) => {
    if (!currentDailyQuiz || isDailyQuizAnswered || isDailyQuizComplete) return

    setSelectedDailyAnswer(answerIndex)
    if (answerIndex === currentDailyQuiz.answerIndex) {
      setDailyQuizCorrectCount((count) => count + 1)
    }
  }

  const goNextDailyQuiz = () => {
    setDailyQuizIndex((index) => index + 1)
    setSelectedDailyAnswer(null)
  }

  const restartDailyQuiz = () => {
    setDailyQuizIndex(0)
    setSelectedDailyAnswer(null)
    setDailyQuizCorrectCount(0)
  }

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
            ['whole', '전체 종목'],
            ['news', '뉴스 & 리포트'],
          ].map(([key, label]) => (
            <button key={key} className={`nav-item ${active === key ? 'active' : ''}`} onClick={() => setActive(key)}>
              <span className="nav-icon">•</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <nav className="nav">
          <div className="nav-label">Tools</div>
          <button className={`nav-item ${dashboardEditMode ? 'active' : ''}`} onClick={() => setDashboardEditMode((value) => !value)}>
            <span className="nav-icon">🧩</span>
            <span>{dashboardEditMode ? '편집 종료' : '대시보드 편집'}</span>
          </button>
          <button className="nav-item" onClick={openPropensity}>
            <span className="nav-icon">✨</span>
            <span>투자성향 분석</span>
          </button>
          <button className="nav-item" onClick={startTour} data-tour="tour-btn">
            <span className="nav-icon">🧭</span>
            <span>가이드 투어</span>
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
              <div className={`toggle ${beginner ? 'on' : ''}`} onClick={() => setBeginner((value) => !value)} role="button" tabIndex={0} data-tour="beginner-toggle">
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
            <div className="header-date">{marketData.generatedAtLabel}</div>
          </div>
          <div className="search">
            <span className="search-icon">⌕</span>
            <input
              value={searchQuery}
              placeholder="종목명, 티커, 키워드 검색"
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              aria-label="종목 검색"
              aria-expanded={showSearchSuggestions}
            />
            {!searchQuery && <span className="search-kbd">⌘K</span>}
            {showSearchSuggestions && (
              <div className="search-suggestions">
                {searchMatches.length > 0 ? (
                  searchMatches.map((stock) => (
                    <button
                      key={stock.symbol}
                      type="button"
                      className="search-suggestion"
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      <span className="search-suggestion-main">
                        <span className="search-suggestion-name">{stock.name}</span>
                        <span className="search-suggestion-symbol">{stock.symbol}</span>
                      </span>
                      <span className={`search-suggestion-change ${stock.up ? 'up' : 'down'}`}>
                        {stock.chg}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="search-empty">검색 결과 없음</div>
                )}
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
          <section className="indicators" data-tour="market-summary">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">1</span> 시장 요약</div>
                <div className="card-title">오늘의 경제 지수 현황</div>
                {beginner && <div className="card-sub">주요 지수와 환율, 위험지표를 한눈에 볼 수 있어요.</div>}
              </div>
              <div className="ind-pager-controls">
                <button
                  className="ind-arrow"
                  onClick={goPrevIndicatorPage}
                  aria-label="이전"
                >‹</button>
                <button
                  className="ind-play"
                  onClick={() => { setIndPlaying((v) => !v); setIndResetKey((v) => v + 1) }}
                  aria-label={indPlaying ? '일시정지' : '재생'}
                >{indPlaying ? '⏸' : '▶'}</button>
                <button
                  className="ind-arrow"
                  onClick={goNextIndicatorPage}
                  aria-label="다음"
                >›</button>
              </div>
            </div>
            <div className="indicators-page">
              {marketData.indicators.slice(indPage * IND_PER_PAGE, (indPage + 1) * IND_PER_PAGE).map((indicator) => (
                <div
                  key={indicator.label}
                  className="indicator"
                  onMouseEnter={beginner ? showHoverHelp(
                    INDICATOR_HELP[indicator.label]?.title ?? indicator.label,
                    INDICATOR_HELP[indicator.label]?.text ?? '이 지표에 대한 설명이 아직 준비되지 않았습니다.',
                  ) : undefined}
                  onMouseMove={beginner ? moveHoverHelp : undefined}
                  onMouseLeave={beginner ? () => setHoverHelp(null) : undefined}
                  style={{ cursor: beginner ? 'help' : 'default' }}
                >
                  <div className="indicator-label">
                    {indicator.label}
                    {beginner && <span className="indicator-info">i</span>}
                  </div>
                  <div className="indicator-value">{indicator.value}</div>
                  <div className={`indicator-change ${indicator.up ? 'up' : 'down'}`}>
                    {indicator.change} ({indicator.pct})
                  </div>
                  <div className="indicator-spark">
                    <Sparkline data={indicator.series} />
                  </div>
                </div>
              ))}
            </div>
            <div className="ind-progress-bar">
              {indPlaying && (
                <div
                  key={indPage}
                  className="ind-progress-bar-fill"
                  style={{ '--ind-dur': `${IND_INTERVAL_MS}ms` } as React.CSSProperties}
                />
              )}
            </div>
            <div className="ind-pager-foot">
              <div className="ind-page-count">
                <span className="ind-page-num">{String(safeIndPage + 1).padStart(2, '0')}</span>
                <span className="ind-page-sep">/</span>
                <span className="ind-page-total">{String(indTotalPages).padStart(2, '0')}</span>
                <span className="ind-page-label">페이지</span>
              </div>
              <div className="ind-dots">
                {Array.from({ length: indTotalPages }).map((_, p) => (
                  <button
                    key={p}
                    className={`ind-dot ${p === safeIndPage ? 'active' : ''}`}
                    onClick={() => { setIndPage(p); setIndResetKey((v) => v + 1) }}
                    aria-label={`페이지 ${p + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>

          {isWholeView && (
            <section className="whole-panel card" data-tour="whole-page">
              <div className="whole-panel-head">
                <div>
                  <div className="card-num"><span className="card-num-dot">0</span> 전체 종목</div>
                  <div className="whole-panel-title">Yahoo Finance 종목 차트 페이지</div>
                  <div className="whole-panel-sub">실시간 갱신된 Yahoo Finance 시세를 바탕으로 여러 종목의 흐름을 비교해 볼 수 있어요.</div>
                </div>
                <div className="whole-panel-badge">{marketData.watchlist.length} stocks · live snapshot</div>
              </div>
              <div className="whole-panel-grid">
                {marketData.watchlist.map((item) => {
                  const isSelected = selectedWatchItem?.symbol === item.symbol
                  return (
                    <button
                      key={item.symbol}
                      className={`whole-stock-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setChartLoading(true)
                        setSelectedWatchItem(isSelected ? null : item)
                      }}
                    >
                      <div className="whole-stock-top">
                        <div>
                          <div className="whole-stock-name">{item.name}</div>
                          <div className="whole-stock-symbol">{item.symbol}</div>
                        </div>
                        <div className={`whole-stock-chip ${item.up ? 'up' : 'down'}`}>
                          {item.up ? '▲' : '▼'} {item.chg}
                        </div>
                      </div>
                      <div className="whole-stock-price-row">
                        <div className="whole-stock-price">{item.price}</div>
                        <div className="whole-stock-label">Yahoo Finance chart</div>
                      </div>
                      <div className="whole-stock-chart">
                        <Sparkline data={item.series} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {!isWholeView && (
            <>
          <section className="card chart-card" data-tour="chart">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">2</span> 내가 보고있는 종목</div>
                <div className="card-title">{displayChart.name} 차트 분석</div>
                {beginner && <div className="card-sub">{displayChart.note}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <button className="why-btn" onClick={() => setWhyOpen((v) => !v)}>
                      <span className="q">?</span> Why?
                    </button>
                    <div className={`why-pop ${whyOpen ? 'show' : ''}`}>
                      <span className="why-pop-tag">왜 올랐을까?</span>
                      <div className="why-pop-title">{displayChart.name} {displayChart.percent} 상승</div>
                      <div className="why-pop-text">HBM3E 양산 본격화 소식과 외국계 IB의 목표가 상향이 동시에 작용했습니다.</div>
                      <div className="why-pop-list">
                        <div className="why-pop-li">HBM3E 12단 적층 양산 발표</div>
                        <div className="why-pop-li">모건스탠리 목표가 95,000원 → 105,000원</div>
                        <div className="why-pop-li">외국인 5거래일 연속 순매수</div>
                      </div>
                    </div>
                  </div>
                  <div className="chart-tabs">
                    {(['1D', '1W', '1M', '전체'] as const).map((tab) => (
                      <button
                        key={tab}
                        className={`chart-tab ${tab === chartTab ? 'active' : ''}`}
                        onClick={() => {
                          setChartLoading(true)
                          setChartTab(tab)
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="quiz-tag">{marketData.marketStatus.label}</span>
                <span className="card-action">{dataSource}</span>
              </div>
            </div>
            <div className="chart-stock-row">
              <div>
                <div className="chart-symbol">{displayChart.symbol} · {displayChart.currency === 'KRW' ? 'KOSPI' : 'NASDAQ'}</div>
                <div className="chart-name">{displayChart.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="chart-price">{displayChart.price} <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>{displayChart.currency}</span></div>
                <div className="chart-delta">{displayChart.change} ({displayChart.percent}) {displayChart.percent.startsWith('-') ? '▼' : '▲'} 오늘</div>
              </div>
            </div>
            <div className="chart-area" style={{ position: 'relative' }}>
              <ChartArea data={displayedSeries} />
              {chartLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>불러오는 중…</span>
                </div>
              )}
            </div>
            <div className="chart-stats">
              {displayChart.stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`chart-stat ${beginner && STAT_HELP[stat.label] ? 'has-help' : ''}`}
                  onMouseEnter={beginner && STAT_HELP[stat.label] ? showHoverHelp(
                    STAT_HELP[stat.label].title,
                    STAT_HELP[stat.label].text,
                  ) : undefined}
                  onMouseMove={beginner && STAT_HELP[stat.label] ? moveHoverHelp : undefined}
                  onMouseLeave={beginner && STAT_HELP[stat.label] ? () => setHoverHelp(null) : undefined}
                  style={{ cursor: beginner && STAT_HELP[stat.label] ? 'help' : 'default' }}
                >
                  <div className="chart-stat-label">
                    {stat.label}
                    {beginner && STAT_HELP[stat.label] && <span className="stat-info-dot">i</span>}
                  </div>
                  <div className="chart-stat-value">{stat.value}</div>
                </div>
              ))}
            </div>
            <div className="glossary-mini">
              {marketData.marketStatus.reasonText}
              {marketData.marketStatus.riskReasons.length > 0 ? ` · ${marketData.marketStatus.riskReasons.join(' / ')}` : ''}
            </div>
          </section>

          <section className="card" data-tour="news">
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

          <EditableWidgetShell widgetKey="watch" visible={!hiddenWidgets.includes('watch')} editMode={dashboardEditMode} onToggle={() => toggleDashboardWidget('watch')}>
          <section className="card" data-tour="watch">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">4</span> 관심 종목</div>
                <div className="card-title">My Watchlist</div>
                {beginner && <div className="card-sub">내가 보는 종목의 가격과 변화율을 모아봤어요.</div>}
              </div>
            </div>
            <div className="watch-list">
              {marketData.watchlist.map((item) => {
                const isSelected = selectedWatchItem?.symbol === item.symbol
                return (
                  <div
                    key={item.symbol}
                    className={`watch-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setChartLoading(true)
                      setSelectedWatchItem(isSelected ? null : item)
                    }}
                  >
                    <div className="watch-icon">{item.name.slice(0, 2).toUpperCase()}</div>
                    <div className="watch-info">
                      <div className="watch-name">{item.name}</div>
                      <div className="watch-symbol">{item.symbol}</div>
                    </div>
                    <div className="watch-spark">
                      <Sparkline data={item.series} />
                    </div>
                    <div className="watch-price">
                      <div className="watch-price-val">{item.price}</div>
                      <div className={`watch-price-chg ${item.up ? 'up' : 'down'}`}>{item.chg}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
          </EditableWidgetShell>

          <EditableWidgetShell widgetKey="propensity" visible={!hiddenWidgets.includes('propensity')} editMode={dashboardEditMode} onToggle={() => toggleDashboardWidget('propensity')}>
          <section className="card" data-tour="propensity">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">5</span> 유저 투자성향</div>
                <div className="card-title">나의 투자 DNA</div>
                {beginner && <div className="card-sub">간단한 설문과 관심 종목을 바탕으로 보여줘요.</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <button className="why-btn" onClick={() => setWhyPropOpen((v) => !v)}>
                    <span className="q">?</span> Why?
                  </button>
                  <div className={`why-pop ${whyPropOpen ? 'show' : ''}`}>
                    <span className="why-pop-tag">왜 이 성향일까?</span>
                    <div className="why-pop-title">나의 투자 DNA 분석</div>
                    <div className="why-pop-text">설문 답변과 관심 종목의 변동성을 바탕으로 성향을 계산합니다.</div>
                    <div className="why-pop-list">
                      <div className="why-pop-li">손실 감내 수준 · 투자 기간 반영</div>
                      <div className="why-pop-li">관심 종목 리스크 프로파일 분석</div>
                      <div className="why-pop-li">4개 질문 → 안정형~공격형 분류</div>
                    </div>
                  </div>
                </div>
                <button className="card-action" onClick={openPropensity}>성향 분석 시작</button>
              </div>
            </div>
            {propensityResult ? (
              <>
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
                        strokeDashoffset={`${2 * Math.PI * 48 * (1 - propensityResult.score / 100)}`}
                        transform="rotate(-90 60 60)"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="donut-center">
                      <div className="donut-type">{propensityResult.title}</div>
                      <div className="donut-score">스코어 {propensityResult.score}</div>
                    </div>
                  </div>
                  <div className="propensity-list">
                    {propensityResult.traits.map((trait) => (
                      <div key={trait.label} className="propensity-row">
                        <div className="propensity-label">{trait.label}</div>
                        <div className="propensity-bar">
                          <div className={`propensity-bar-fill ${trait.point ? 'point' : ''}`} style={{ width: `${trait.val}%` }} />
                        </div>
                        <div className="propensity-val">{trait.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glossary-mini" style={{ marginTop: 12 }}>
                  {propensityResult.badge} · {propensityResult.summary} {beginner ? ` ${propensityResult.note}` : ''}
                </div>
                <button className="btn-ghost propensity-cta" onClick={openPropensity}>
                  다시 분석하기
                </button>
              </>
            ) : (
              <div style={{ display: 'grid', gap: 12, alignItems: 'start' }}>
                <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
                  4개의 질문으로 투자 성향을 분석하고, 내 성향에 맞는 해석을 보여드려요.
                </div>
                <button className="btn-primary propensity-cta" onClick={openPropensity}>
                  성향 분석 시작하기
                </button>
                <div className="glossary-mini">분석을 완료하면 안정형, 균형형, 성장형, 공격형 중 하나로 정리됩니다.</div>
              </div>
            )}
          </section>
          </EditableWidgetShell>

          <EditableWidgetShell widgetKey="know" visible={!hiddenWidgets.includes('know')} editMode={dashboardEditMode} onToggle={() => toggleDashboardWidget('know')}>
          <section className="card" data-tour="know">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">6</span> 투자 상식 카드</div>
                <div className="card-title">오늘의 한 입 지식</div>
                {beginner && <div className="card-sub">매일 바뀌는 짧은 투자 상식이에요.</div>}
              </div>
              <button className="know-refresh-btn" onClick={refreshKnowledgeCards}>↻ 다른 카드 보기</button>
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

          <EditableWidgetShell widgetKey="quiz" visible={!hiddenWidgets.includes('quiz')} editMode={dashboardEditMode} onToggle={() => toggleDashboardWidget('quiz')}>
          <section className="card" data-tour="quiz">
            <div className="card-head">
              <div className="card-head-left">
                <div className="card-num"><span className="card-num-dot">7</span> 투자 기초 퀴즈</div>
                <div className="card-title">데일리 챌린지</div>
                {beginner && <div className="card-sub">짧은 퀴즈로 경제 지식을 늘려보세요.</div>}
              </div>
              <span className="quiz-tag">
                {dailyQuizzes.length > 0 ? `${dailyQuizSolvedCount}/${dailyQuizzes.length}` : 'Loading'}
              </span>
            </div>
            {isDailyQuizComplete ? (
              <div className="quiz-complete">
                <div className="quiz-complete-label">데일리 챌린지 완료</div>
                <div className="quiz-complete-score">
                  {dailyQuizCorrectCount}/{dailyQuizzes.length}
                </div>
                <div className="quiz-feedback-text">
                  오늘의 투자 상식 퀴즈를 모두 풀었어요!
                </div>
                <button className="btn-primary quiz-next-btn" onClick={restartDailyQuiz}>
                  다시 풀기
                </button>
              </div>
            ) : currentDailyQuiz ? (
              <>
                <div className="quiz-meta">
                  <span>{currentDailyQuiz.category}</span>
                  <span>{currentDailyQuiz.type === 'ox' ? 'O/X' : '3지선다'}</span>
                </div>
                <div className="quiz-q">{currentDailyQuiz.question}</div>
                <div className="quiz-options">
                  {currentDailyQuiz.options.map((option, index) => {
                    const isCorrectAnswer = index === currentDailyQuiz.answerIndex
                    const isSelectedWrong = selectedDailyAnswer === index && !isCorrectAnswer
                    const optionLetter = currentDailyQuiz.type === 'ox' ? option : String.fromCharCode(65 + index)
                    let className = 'quiz-opt'

                    if (isDailyQuizAnswered && isCorrectAnswer) className += ' correct'
                    if (isDailyQuizAnswered && isSelectedWrong) className += ' wrong'

                    return (
                      <button
                        key={`${currentDailyQuiz.id}-${option}`}
                        className={className}
                        onClick={() => pickDailyQuizAnswer(index)}
                        disabled={isDailyQuizAnswered}
                      >
                        <span className="quiz-opt-letter">{optionLetter}</span>
                        {option}
                      </button>
                    )
                  })}
                </div>
                {isDailyQuizAnswered && (
                  <div className={`quiz-feedback ${selectedDailyAnswer === currentDailyQuiz.answerIndex ? 'correct' : 'wrong'}`}>
                    <div className="quiz-feedback-title">
                      {selectedDailyAnswer === currentDailyQuiz.answerIndex ? '정답입니다' : '오답입니다'}
                    </div>
                    <div className="quiz-feedback-text">{currentDailyQuiz.explanation}</div>
                    <button className="btn-primary quiz-next-btn" onClick={goNextDailyQuiz}>
                      다음 문제
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="quiz-feedback">
                <div className="quiz-feedback-title">퀴즈를 불러오는 중입니다</div>
                <div className="quiz-feedback-text">잠시 후 다시 확인해주세요.</div>
              </div>
            )}
            <div className="quiz-progress">
              <span>오늘 진행</span>
              <div className="quiz-progress-track">
                <div className="quiz-progress-fill" style={{ width: `${dailyQuizProgress}%` }} />
              </div>
              <span>{dailyQuizSolvedCount}/{dailyQuizzes.length || 10}</span>
            </div>
          </section>
          </EditableWidgetShell>
            </>
          )}
        </div>
      </main>

      <SectionHelpTooltip help={hoverHelp} />
      <TourOverlay active={tourActive} step={safeTourStep} steps={visibleTourSteps} onNext={nextTourStep} onSkip={skipTour} />
      <SurveyModal
        open={propensityOpen}
        step={propensityStep}
        answers={propensityAnswers}
        onPick={pickPropensityAnswer}
        onPrev={prevPropensityStep}
        onNext={nextPropensityStep}
        onClose={closePropensity}
      />
    </div>
  )
}

export default App
