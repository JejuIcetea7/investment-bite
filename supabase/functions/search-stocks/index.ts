import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[\s._-]/g, '')
}

// 한글명을 symbol로 변환하는 매핑
const KOREAN_NAME_TO_SYMBOL: Record<string, string> = {
  '현대차': '005380.KS',
  '현대자동차': '005380.KS',
  '현대모터스': '005380.KS',
  '삼성전자': '005930.KS',
  '삼전': '005930.KS',
  'sk하이닉스': '000660.KS',
  '하이닉스': '000660.KS',
  '카카오': '035720.KS',
  '현대엔지니어링': '012330.KS',
  '현대엔지': '012330.KS',
  'lg화학': '051910.KS',
  'lg전자': '066570.KS',
  '고려아연': '010130.KS',
  '한국항공우주': '047810.KS',
}

// 한국 주식 한글 이름 매핑 (Yahoo Finance 검색 결과용)
const KOREAN_STOCK_NAMES: Record<string, string> = {
  '005380.KS': '현대자동차',
  '005930.KS': '삼성전자',
  '000660.KS': 'SK하이닉스',
  '035720.KS': '카카오',
  '012330.KS': '현대엔지니어링',
  '051910.KS': 'LG화학',
  '066570.KS': 'LG전자',
  '010130.KS': '고려아연',
  '047810.KS': '한국항공우주',
}

type YahooSearchQuote = {
  symbol?: string
  shortname?: string
  longname?: string
  quoteType?: string
  exchDisp?: string
}

type YahooMeta = {
  currency?: string
  regularMarketPrice?: number
  chartPreviousClose?: number
  previousClose?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
}

function fin(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function formatPrice(value: number, currency = 'USD') {
  if (currency === 'KRW') return Math.round(value).toLocaleString('ko-KR')
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function formatSigned(value: number, currency = 'USD') {
  const prefix = value >= 0 ? '+' : ''
  if (currency === 'KRW') return `${prefix}${Math.round(value).toLocaleString('ko-KR')}`
  return `${prefix}${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

function formatPct(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

async function fetchChartMeta(symbol: string): Promise<YahooMeta> {
  const now = Math.floor(Date.now() / 1000)
  const period1 = now - 3 * 86400
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${now}&includePrePost=false`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return {}
  const data = await res.json()
  return data?.chart?.result?.[0]?.meta ?? {}
}

function createStockPayload(quote: YahooSearchQuote, meta: YahooMeta) {
  const currency = meta.currency ?? (quote.symbol?.endsWith('.KS') || quote.symbol?.endsWith('.KQ') ? 'KRW' : 'USD')
  const price = meta.regularMarketPrice
  const previous = meta.previousClose ?? meta.chartPreviousClose
  const change = fin(price) && fin(previous) ? price - previous : meta.regularMarketChange
  const changePercent = fin(price) && fin(previous) && previous !== 0
    ? ((price - previous) / previous) * 100
    : meta.regularMarketChangePercent

  const isKoreanStock = quote.symbol?.endsWith('.KS') || quote.symbol?.endsWith('.KQ')
  const displayName = isKoreanStock && quote.symbol && KOREAN_STOCK_NAMES[quote.symbol]
    ? KOREAN_STOCK_NAMES[quote.symbol]
    : (quote.longname ?? quote.shortname ?? quote.symbol!)

  return {
    name: displayName,
    symbol: quote.symbol!,
    exchange: quote.exchDisp ?? '',
    price: fin(price) ? formatPrice(price, currency) : 'N/A',
    change: fin(change) ? formatSigned(change, currency) : 'N/A',
    changePercent: fin(changePercent) ? formatPct(changePercent) : 'N/A',
    up: fin(change) ? change >= 0 : true,
    currency,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const url = new URL(req.url)
    let query = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    if (query.length < 2) {
      return new Response(JSON.stringify({ stocks: [] }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // 한글 검색어를 symbol로 변환 시도
    const symbolFromKorean = KOREAN_NAME_TO_SYMBOL[normalizeSearchText(query)]
    if (symbolFromKorean) {
      const meta = await fetchChartMeta(symbolFromKorean)
      const stock = createStockPayload({
        symbol: symbolFromKorean,
        shortname: KOREAN_STOCK_NAMES[symbolFromKorean] ?? symbolFromKorean,
        longname: KOREAN_STOCK_NAMES[symbolFromKorean] ?? symbolFromKorean,
        quoteType: 'EQUITY',
        exchDisp: 'KSE',
      }, meta)

      return new Response(JSON.stringify({ stocks: [stock] }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`
    const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!searchRes.ok) throw new Error(`Yahoo search ${searchRes.status}`)
    const searchData = await searchRes.json()
    const quotes: YahooSearchQuote[] = searchData?.quotes ?? []
    const candidates = quotes
      .filter((quote) => quote.symbol && ['EQUITY', 'ETF'].includes(quote.quoteType ?? ''))
      .slice(0, 8)

    const metas = await Promise.all(candidates.map((quote) => fetchChartMeta(quote.symbol!)))
    const stocks = candidates.map((quote, index) => createStockPayload(quote, metas[index] ?? {}))

    return new Response(JSON.stringify({ stocks }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message, stocks: [] }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
