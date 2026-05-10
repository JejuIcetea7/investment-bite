import type { DashboardWidgetKey, PropensityQuestion, TourStep } from '../types'

export const IND_PER_PAGE = 6
export const IND_INTERVAL_MS = 20000

export const DASHBOARD_WIDGETS: DashboardWidgetKey[] = ['watch', 'propensity', 'know', 'quiz']

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetKey, string> = {
  watch: '관심 종목',
  propensity: '유저 투자성향',
  know: '투자 상식 카드',
  quiz: '투자 기초 퀴즈',
}

export const NEWS_SECTORS = ['AI', '반도체', '조선', '에너지', '헬스', '우주', '바이오', '방산'] as const

export const STOCK_ALIASES: Record<string, string[]> = {
  '005930.KS': ['삼성전자', '삼전', 'samsung', 'samsung electronics', '005930'],
  NVDA: ['nvidia', '엔비디아', '엔비', 'nvda'],
  AAPL: ['apple', 'apple inc', '애플', 'aapl'],
  '035720.KS': ['카카오', 'kakao', '035720'],
  '000660.KS': ['sk하이닉스', 'sk hynix', '하이닉스', 'hynix', '000660'],
}

export const SENTIMENT_CONFIG = {
  positive: { label: '긍정', cls: 'sentiment-pos' },
  neutral: { label: '중립', cls: 'sentiment-neu' },
  negative: { label: '부정', cls: 'sentiment-neg' },
} as const

export const INDICATOR_HELP: Record<string, { title: string; text: string }> = {
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

export const STAT_HELP: Record<string, { title: string; text: string }> = {
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

export const PROPENSITY_QUESTIONS: PropensityQuestion[] = [
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

export const TOUR_STEPS: TourStep[] = [
  {
    sel: '[data-tour="menu-dashboard"]',
    title: '대시보드',
    text: '시장 요약, 차트, 관심 종목처럼 오늘 확인할 정보를 한 화면에서 볼 수 있어요.',
    pos: 'right',
  },
  {
    sel: '[data-tour="menu-whole"]',
    title: '전체 종목',
    text: '등록된 종목을 넓게 둘러보고 원하는 종목을 빠르게 찾아볼 수 있는 메뉴예요.',
    pos: 'right',
  },
  {
    sel: '[data-tour="menu-news"]',
    title: '뉴스 & 리포트',
    text: '시장 뉴스와 리포트를 모아 확인하고 투자 판단에 필요한 흐름을 살펴볼 수 있어요.',
    pos: 'right',
  },
  {
    sel: '[data-tour="tool-dashboard-edit"]',
    title: '대시보드 편집',
    text: '대시보드 카드 구성을 내 관심사에 맞게 켜고 끌 수 있어요.',
    pos: 'right',
  },
  {
    sel: '[data-tour="tool-propensity"]',
    title: '투자 성향 분석',
    text: '짧은 설문으로 나에게 맞는 투자 성향과 참고 포인트를 확인할 수 있어요.',
    pos: 'right',
  },
  {
    sel: '[data-tour="tour-btn"]',
    title: '가이드 투어',
    text: '이 버튼으로 언제든 주요 화면과 기능 설명을 다시 볼 수 있어요.',
    pos: 'right',
  },
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

export const DASHBOARD_NEWS_ITEMS = [
  { tag: '시장', title: '코스피, 외국인 매수에 2,720선 회복… 반도체 강세 지속', meta: '한국경제 · 12분 전' },
  { tag: '종목', title: '삼성전자, HBM3E 양산 본격화 발표… 외국계 목표가 상향', meta: '머니투데이 · 1시간 전' },
  { tag: '경제', title: '미 CPI 둔화 전망… 12월 금리 인하 가능성 60% 반영', meta: '블룸버그 · 2시간 전' },
  { tag: '정책', title: '한국은행 총재 "당분간 통화정책 신중 기조 유지"', meta: '연합뉴스 · 3시간 전' },
]
