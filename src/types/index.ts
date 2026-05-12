export type KnowledgeCard = {
  id: string
  term: string
  category: string
  description: string
}

export type Indicator = {
  label: string
  symbol: string
  value: string
  change: string
  pct: string
  up: boolean
  series: number[]
}

export type MarketStat = {
  label: string
  value: string
}

export type MarketStatus = {
  signal: 'up' | 'down' | 'sideways' | 'caution' | 'insufficient_data' | 'invalid_data'
  label: string
  reasonText: string
  reasonCodes: string[]
  riskReasons: string[]
  volatilityLevel: 'low' | 'medium' | 'high' | 'unknown'
}

export type DataQualityStatus = 'normal' | 'partial' | 'price_error' | 'analysis_unavailable'

export type ChartData = {
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

export type WatchItem = {
  name: string
  symbol: string
  price: string
  chg: string
  up: boolean
  series: number[]
}

export type SectorStock = {
  name: string
  symbol: string
  price: string
  krwPrice?: string
  change: string
  changePercent: string
  up: boolean
  currency: string
  status?: MarketStatus['signal']
  statusLabel?: string
  statusSummary?: string
  reasonCodes?: string[]
  volatilityLevel?: MarketStatus['volatilityLevel']
  dataQuality?: DataQualityStatus
  dataQualityLabel?: string
  dataQualitySummary?: string
}

export type PriceAlertDirection = 'above' | 'below'

export type PriceAlert = {
  id: string
  name: string
  symbol: string
  targetPrice: number
  direction: PriceAlertDirection
  currency: string
  active: boolean
  createdAt: string
  triggeredAt?: string
  triggeredPrice?: string
}

export type SectorStockGroup = {
  key: NewsSectorKey
  label: string
  stocks: SectorStock[]
}

export type SectorStocksData = {
  generatedAt: string
  generatedAtLabel: string
  usdKrwRate?: number | null
  sectors: SectorStockGroup[]
}

export type PropensityQuestion = {
  q: string
  opts: string[]
}

export type PropensityResult = {
  title: string
  badge: string
  score: number
  summary: string
  note: string
  characterImage: string
  characterAlt: string
  llmSummary?: string
  strengths?: string[]
  cautions?: string[]
  recommendation?: string
  analysisSource?: 'llm' | 'rule'
  traits: Array<{ label: string; val: number; point: boolean }>
}

export type DashboardWidgetKey = 'news' | 'propensity' | 'know' | 'quiz'

export type TourStep = {
  sel: string
  title: string
  text: string
  pos: 'top' | 'bottom' | 'left' | 'right'
  widgetKey?: DashboardWidgetKey
}

export type DailyQuiz = {
  id: string
  type: 'ox' | 'multiple_choice'
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export type DailyQuizData = {
  version: number
  updatedAt: string
  title: string
  description: string
  quizzes: DailyQuiz[]
}

export type MarketData = {
  generatedAt: string
  generatedAtLabel: string
  marketStatus: MarketStatus
  indicators: Indicator[]
  chart: ChartData
  watchlist: WatchItem[]
}

export type HoverHelp = {
  title: string
  text: string
  x: number
  y: number
}

export type NewsArticle = {
  title: string
  description: string
  link: string
  source: string
  date: string
  aiSummary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  keywords: string[]
  stocks: string[]
}

export type NewsData = {
  generatedAt: string
  topNews: NewsArticle[]
  sectorNews: Record<string, NewsArticle[]>
}

export type NewsSectorKey = 'AI' | '반도체' | '조선' | '에너지' | '헬스' | '우주' | '바이오' | '방산'
