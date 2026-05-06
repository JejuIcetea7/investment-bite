/* Data: indicators, news, watchlist, knowledge cards, quizzes */

const INDICATORS = [
  {
    key: 'kospi', label: 'KOSPI', value: '2,718.43', change: '+18.62', pct: '+0.69%', up: true,
    spark: 'up', desc: '한국 종합주가지수. 코스피 시장에 상장된 모든 보통주의 시가총액 가중 평균.',
    why: '국내 경제와 기업 실적의 종합적 흐름을 보여줍니다. 외국인 매수세와 반도체 업황이 상승의 주요 동인입니다.',
    drivers: ['외국인 8거래일 연속 순매수', '반도체 수출 호조', '환율 안정세']
  },
  {
    key: 'snp', label: 'S&P 500', value: '5,832.91', change: '-12.47', pct: '-0.21%', up: false,
    desc: '미국 대형주 500개 종목으로 구성된 대표 지수. 글로벌 증시의 벤치마크.',
    why: '미국 주식 시장의 전반적 건전성을 나타냅니다. 미 국채 금리 상승이 단기 압력으로 작용 중.',
    drivers: ['미 10년물 금리 상승', '기술주 차익실현', 'CPI 발표 대기']
  },
  {
    key: 'usd', label: 'USD/KRW', value: '1,378.20', change: '+3.40', pct: '+0.25%', up: true,
    desc: '원·달러 환율. 1달러를 사는 데 필요한 원화의 양.',
    why: '환율 상승은 수출주에 우호적이지만 수입 물가를 자극할 수 있습니다. 미·중 무역 이슈가 변동성 확대 원인.',
    drivers: ['달러 인덱스 상승', '위안화 약세 동조', '경상수지 흑자 확대']
  },
  {
    key: 'oil', label: '국제유가 (WTI)', value: '78.42', change: '+0.85', pct: '+1.10%', up: true, unit: '$',
    desc: 'WTI(서부텍사스산 원유) 선물 가격. 글로벌 에너지 가격의 주요 벤치마크.',
    why: '유가 상승은 인플레이션과 소비재 마진에 영향을 줍니다. 중동 지정학 리스크가 단기 수급에 반영.',
    drivers: ['중동 긴장 고조', 'OPEC+ 감산 연장', '겨울철 난방수요']
  },
  {
    key: 'btc', label: 'Bitcoin', value: '92,341', change: '+1,820', pct: '+2.01%', up: true, unit: '$',
    desc: '비트코인 가격(USD). 디지털 자산 시장의 대표 지표.',
    why: 'ETF 자금 유입과 반감기 사이클이 강세 흐름을 만들고 있습니다. 위험자산 선호 회복의 신호.',
    drivers: ['현물 ETF 순유입 지속', '반감기 후 공급 감소', '기관 보유 확대']
  },
  {
    key: 'gold', label: '금 (Gold)', value: '2,648.50', change: '+8.20', pct: '+0.31%', up: true, unit: '$',
    desc: '국제 금 가격(트로이 온스당 USD). 대표적 안전자산.',
    why: '금리 인하 기대와 지정학 리스크가 금 수요를 떠받치고 있습니다. 인플레이션 헤지 수요도 견조.',
    drivers: ['중앙은행 매수세', '실질금리 하락 기대', '지정학 불안']
  },
  {
    key: 'kosdaq', label: 'KOSDAQ', value: '847.23', change: '+5.12', pct: '+0.61%', up: true,
    desc: '코스닥 종합지수. 중소·벤처기업 중심의 시장 지수.',
    why: '바이오·2차전지 등 성장 섹터 비중이 큽니다. IT 업황과 외국인 수급에 민감.',
    drivers: ['2차전지 반등', '바이오 IPO 호조', '개인 매수 유입']
  },
  {
    key: 'nasdaq', label: 'NASDAQ', value: '18,541.62', change: '-44.18', pct: '-0.24%', up: false,
    desc: '미국 기술주 중심의 나스닥 종합지수.',
    why: '빅테크 실적과 금리 흐름에 가장 민감하게 반응합니다. AI·반도체 사이클의 바로미터.',
    drivers: ['엔비디아 차익실현', '미 국채 금리 상승', 'AI 투자 둔화 우려']
  },
  {
    key: 'us10y', label: '美 10년물 금리', value: '4.382', change: '+0.024', pct: '+0.55%', up: true, unit: '%',
    desc: '미국 10년 만기 국채 금리. 글로벌 자금 흐름의 기준.',
    why: '금리 상승은 성장주에 부담, 가치주·금융주에 우호적. 환율과도 밀접.',
    drivers: ['CPI 둔화 지연', '국채 발행 부담', '연준 매파 발언']
  },
  {
    key: 'vix', label: 'VIX (공포지수)', value: '14.82', change: '-0.34', pct: '-2.24%', up: false,
    desc: 'S&P 500의 30일 변동성 지수. 시장의 불안 심리를 수치화.',
    why: '20 미만은 안정, 30 초과는 경계 구간. 현재 위험자산 선호 분위기.',
    drivers: ['실적 시즌 선방', '지정학 단기 안정', 'ETF 자금 유입']
  },
  {
    key: 'eth', label: 'Ethereum', value: '3,284', change: '+96.20', pct: '+3.02%', up: true, unit: '$',
    desc: '이더리움 가격(USD). 스마트 컨트랙트 플랫폼 대표 자산.',
    why: 'L2 활성화와 ETF 자금 유입이 강세 흐름을 만들고 있습니다.',
    drivers: ['현물 ETF 유입', 'L2 거래 증가', '스테이킹 수요 확대']
  },
  {
    key: 'jpy', label: 'JPY/KRW', value: '892.40', change: '-1.20', pct: '-0.13%', up: false,
    desc: '엔·원 환율(100엔 기준). 일본과의 무역·관광 등에 영향.',
    why: '엔화 약세는 일본 수출주에 우호적이지만, 한국 관광·소비재에는 양날의 검.',
    drivers: ['BOJ 금리 동결', '캐리 트레이드 활성화', '일본 무역수지']
  },
  {
    key: 'copper', label: '구리 (Copper)', value: '4.382', change: '+0.052', pct: '+1.20%', up: true, unit: '$',
    desc: '전기동 가격(파운드당 USD). "Dr. Copper"라 불리는 경기 선행 지표.',
    why: '구리 가격은 글로벌 경기와 인프라 투자를 가장 잘 반영하는 지표 중 하나.',
    drivers: ['중국 경기부양 기대', '에너지 전환 수요', '재고 감소']
  }
];

const NEWS = [
  { tag: '시장', tagClass: 'tag-market', emoji: '📈', title: '코스피, 외국인 매수에 2,720선 회복… 반도체 강세 지속', meta: '한국경제 · 12분 전' },
  { tag: '종목', tagClass: 'tag-stock', emoji: '💎', title: '삼성전자, HBM3E 양산 본격화 발표… 외국계 목표가 상향', meta: '머니투데이 · 1시간 전' },
  { tag: '경제', tagClass: 'tag-econ', emoji: '🌐', title: '미 10월 CPI 둔화 전망… 12월 금리 인하 가능성 60% 반영', meta: '블룸버그 · 2시간 전' },
  { tag: '정책', tagClass: 'tag-policy', emoji: '🏛️', title: '한국은행 총재 "당분간 통화정책 신중 기조 유지할 것"', meta: '연합뉴스 · 3시간 전' },
];

const WATCHLIST = [
  { name: '삼성전자', symbol: '005930', price: '72,400', chg: '+1.83%', up: true, sparkSeed: 7 },
  { name: 'NVIDIA', symbol: 'NVDA', price: '$148.20', chg: '+2.41%', up: true, sparkSeed: 14 },
  { name: 'Apple Inc.', symbol: 'AAPL', price: '$226.45', chg: '-0.62%', up: false, sparkSeed: 21 },
  { name: '카카오', symbol: '035720', price: '38,150', chg: '+0.92%', up: true, sparkSeed: 33 },
  { name: 'Tesla', symbol: 'TSLA', price: '$248.91', chg: '-1.15%', up: false, sparkSeed: 41 },
  { name: 'SK하이닉스', symbol: '000660', price: '195,500', chg: '+3.21%', up: true, sparkSeed: 53 },
];

const KNOW_CARDS = [
  { num: '01', title: 'PER이란?', tone: 'k1' },
  { num: '02', title: '배당주 vs 성장주', tone: 'k2' },
  { num: '03', title: 'ETF 한눈에', tone: 'k3' },
  { num: '04', title: '분산 투자란?', tone: 'k4' },
];

const QUIZ = {
  question: '월급의 일부를 매달 같은 금액으로 정해진 종목에 투자하는 방식을 무엇이라고 할까요?',
  options: [
    { letter: 'A', text: '몰빵 투자', correct: false },
    { letter: 'B', text: '적립식 투자 (DCA)', correct: true },
    { letter: 'C', text: '레버리지 투자', correct: false },
    { letter: 'D', text: '단타 매매', correct: false },
  ],
  explain: '정답: B. 적립식 투자는 가격 변동 위험을 분산시키는 가장 기본적이고 안전한 전략입니다.',
  progress: 3, total: 5,
};

const SURVEY = [
  {
    q: '예상치 못한 손실이 발생했을 때, 나는 어떻게 행동할까요?',
    opts: ['바로 손절매한다', '추이를 지켜본다', '추가 매수한다', '시장을 다시 공부한다']
  },
  {
    q: '투자 자금의 사용 목적과 기간은?',
    opts: ['1년 이내, 단기 자금', '1~3년, 중기 목표', '3년 이상, 장기 자산형성', '은퇴 자금 등 매우 장기']
  },
  {
    q: '관심 있는 투자 분야를 모두 골라주세요',
    multi: true,
    opts: ['국내 주식', '미국 주식', 'ETF / 인덱스', '배당주', '채권', '암호화폐', 'REITs', '원자재']
  },
];

Object.assign(window, { INDICATORS, NEWS, WATCHLIST, KNOW_CARDS, QUIZ, SURVEY });
