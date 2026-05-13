import type { DashboardWidgetKey, PropensityQuestion, TourStep } from '../types'

export const IND_PER_PAGE = 6
export const IND_INTERVAL_MS = 20000

export const DASHBOARD_WIDGETS: DashboardWidgetKey[] = ['news', 'propensity', 'know', 'quiz', 'stockQuiz']

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetKey, string> = {
  news: '주요 뉴스',
  propensity: '유저 투자성향',
  know: '투자 상식 카드',
  quiz: '투자 기초 퀴즈',
  stockQuiz: '내 종목 한입 상식',
}

export const NEWS_SECTORS = ['AI', '반도체', '조선', '에너지', '헬스', '우주', '바이오', '방산'] as const

export const STOCK_ALIASES: Record<string, string[]> = {
  // 기존 관심종목
  '005930.KS': ['삼성전자', '삼전', 'samsung', 'samsung electronics', '005930'],
  NVDA: ['nvidia', '엔비디아', '엔비', 'nvda'],
  AAPL: ['apple', 'apple inc', '애플', 'aapl'],
  '035720.KS': ['카카오', 'kakao', '035720'],
  '000660.KS': ['sk하이닉스', 'sk hynix', '하이닉스', 'hynix', '000660'],
  // AI
  MSFT: ['microsoft', '마이크로소프트', '마소', 'msft'],
  GOOGL: ['alphabet', 'google', '구글', '알파벳', 'googl'],
  AMZN: ['amazon', '아마존', 'amzn'],
  META: ['meta', 'meta platforms', '메타', '페이스북', 'facebook'],
  PLTR: ['palantir', '팔란티어', '팔란', 'pltr'],
  AMD: ['amd', '에이엠디'],
  AVGO: ['broadcom', '브로드컴', 'avgo'],
  ORCL: ['oracle', '오라클', 'orcl'],
  IBM: ['ibm', '아이비엠'],
  // 반도체
  TSM: ['tsmc', '티에스엠씨', '대만반도체', 'tsm'],
  ASML: ['asml', '에이에스엠엘'],
  QCOM: ['qualcomm', '퀄컴', 'qcom'],
  INTC: ['intel', '인텔', 'intc'],
  MU: ['micron', '마이크론', 'mu'],
  TXN: ['texas instruments', '텍사스인스트루먼츠', 'ti', 'txn'],
  AMAT: ['applied materials', '어플라이드머티리얼즈', 'amat'],
  // 에너지
  XOM: ['exxon', 'exxon mobil', '엑슨모빌', '엑슨', 'xom'],
  CVX: ['chevron', '셰브론', 'cvx'],
  COP: ['conocophillips', '코노코필립스', 'cop'],
  SHEL: ['shell', '쉘', 'shel'],
  TTE: ['totalenergies', '토탈에너지', 'tte'],
  BP: ['bp', '비피'],
  NEE: ['nextera', 'nextera energy', '넥스트에라', 'nee'],
  ENPH: ['enphase', '인페이즈', 'enph'],
  FSLR: ['first solar', '퍼스트솔라', 'fslr'],
  SLB: ['schlumberger', '슐럼버거', 'slb'],
  // 헬스
  UNH: ['unitedhealth', 'united health', '유나이티드헬스', 'unh'],
  LLY: ['eli lilly', '일라이릴리', '릴리', 'lly'],
  JNJ: ['johnson', 'johnson & johnson', '존슨앤존슨', '존앤존', 'jnj'],
  MRK: ['merck', '머크', 'mrk'],
  ABBV: ['abbvie', '애브비', 'abbv'],
  PFE: ['pfizer', '화이자', 'pfe'],
  TMO: ['thermo fisher', '써모피셔', 'tmo'],
  ABT: ['abbott', '애보트', 'abt'],
  ISRG: ['intuitive surgical', '인튜이티브서지컬', 'isrg'],
  MDT: ['medtronic', '메드트로닉', 'mdt'],
  // 우주
  RKLB: ['rocket lab', '로켓랩', 'rklb'],
  BA: ['boeing', '보잉', 'ba'],
  LMT: ['lockheed martin', '록히드마틴', '록히드', 'lmt'],
  NOC: ['northrop grumman', '노스롭그루먼', 'noc'],
  RTX: ['rtx', 'raytheon', '레이시온', 'rtx'],
  // 바이오
  AMGN: ['amgen', '암젠', 'amgn'],
  GILD: ['gilead', 'gilead sciences', '길리어드', 'gild'],
  REGN: ['regeneron', '리제네론', 'regn'],
  VRTX: ['vertex', '버텍스', 'vrtx'],
  MRNA: ['moderna', '모더나', 'mrna'],
  BNTX: ['biontech', '바이온텍', 'bntx'],
  BIIB: ['biogen', '바이오젠', 'biib'],
  ILMN: ['illumina', '일루미나', 'ilmn'],
  CRSP: ['crispr', '크리스퍼', 'crsp'],
  ALNY: ['alnylam', '알닐람', 'alny'],
  // 방산
  GD: ['general dynamics', '제너럴다이나믹스', 'gd'],
  LHX: ['l3harris', 'l3 harris', '엘쓰리해리스', 'lhx'],
  HII: ['huntington ingalls', '헌팅턴잉걸스', 'hii'],
  TDG: ['transdigm', '트랜스다임', 'tdg'],
  HEI: ['heico', '헤이코', 'hei'],
  KTOS: ['kratos', '크라토스', 'ktos'],
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

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
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
    widgetKey: 'news',
  },
  {
    sel: '[data-tour="watch"]',
    title: '관심 종목',
    text: '내가 보는 종목의 가격과 추세를 빠르게 확인하세요.',
    pos: 'left',
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
    sel: '[data-tour="stock-quiz"]',
    title: '내 종목 한입 상식',
    text: '관심종목에 들어있는 종목의 짧은 상식 퀴즈만 랜덤으로 보여줘요.',
    pos: 'top',
    widgetKey: 'stockQuiz',
  },
  {
    sel: '[data-tour="beginner-toggle"]',
    title: '초보자 모드',
    text: '언제든지 토글로 쉬운 설명 표시를 켜고 끌 수 있어요.',
    pos: 'right',
  },
]

export const WHOLE_TOUR_STEPS: TourStep[] = [
  {
    sel: '[data-tour="whole-sector-tabs"]',
    title: '섹터 필터',
    text: 'AI, 반도체, 조선처럼 보고 싶은 섹터만 골라 종목을 좁혀볼 수 있어요.',
    pos: 'bottom',
  },
  {
    sel: '[data-tour="whole-stock-summary"]',
    title: '한 줄 평가',
    text: '초보자도 흐름을 이해하기 쉽도록 종목별 상태를 짧은 문장으로 풀어 보여줘요.',
    pos: 'bottom',
  },
  {
    sel: '[data-tour="whole-watch-toggle"]',
    title: '관심 리스트 추가',
    text: '하트를 누르면 해당 종목이 대시보드 관심 종목 리스트에 저장돼요.',
    pos: 'left',
  },
  {
    sel: '[data-tour="whole-alert-button"]',
    title: '목표금액 알림',
    text: '원하는 가격 조건을 등록하면 목표가에 도달했을 때 상단 알림창에서 확인할 수 있어요.',
    pos: 'left',
  },
]

export const NEWS_TOUR_STEPS: TourStep[] = [
  {
    sel: '[data-tour="news-top"]',
    title: '주요 뉴스',
    text: '오늘 시장에 영향을 줄 수 있는 핵심 뉴스를 먼저 모아 보여줘요.',
    pos: 'bottom',
  },
  {
    sel: '[data-tour="news-sector-tabs"]',
    title: '섹터별 필터',
    text: '관심 있는 섹터를 선택해 관련 뉴스만 빠르게 확인할 수 있어요.',
    pos: 'bottom',
  },
  {
    sel: '[data-tour="news-sector-list"]',
    title: '섹터 뉴스 목록',
    text: '선택한 섹터의 기사 요약, 키워드, 시장 영향을 카드로 살펴볼 수 있어요.',
    pos: 'top',
  },
]

export const TOUR_STEPS_BY_PAGE = {
  home: DASHBOARD_TOUR_STEPS,
  whole: WHOLE_TOUR_STEPS,
  news: NEWS_TOUR_STEPS,
} as const

export const DASHBOARD_NEWS_ITEMS = [
  { tag: '시장', title: '코스피, 외국인 매수에 2,720선 회복… 반도체 강세 지속', meta: '한국경제 · 12분 전' },
  { tag: '종목', title: '삼성전자, HBM3E 양산 본격화 발표… 외국계 목표가 상향', meta: '머니투데이 · 1시간 전' },
  { tag: '경제', title: '미 CPI 둔화 전망… 12월 금리 인하 가능성 60% 반영', meta: '블룸버그 · 2시간 전' },
  { tag: '정책', title: '한국은행 총재 "당분간 통화정책 신중 기조 유지"', meta: '연합뉴스 · 3시간 전' },
]
