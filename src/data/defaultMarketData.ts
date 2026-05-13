import type { MarketData } from '../types'

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

export default defaultMarketData
