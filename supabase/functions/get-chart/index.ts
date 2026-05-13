import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Period = '1D' | '1W' | '1M' | '전체'
const VALID_PERIODS = new Set<string>(['1D', '1W', '1M', '전체'])
const KRW_FMT = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 })
const USD_FMT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

type ChartStat = {
  label: string
  value: string
}

type ChartPayload = {
  series: number[]
  labels: string[]
  stats: ChartStat[]
  sessionLabel?: string
}

type YahooMeta = {
  currency?: string
  exchangeTimezoneName?: string
  regularMarketVolume?: number
  marketCap?: number
  trailingPE?: number
  fiftyTwoWeekLow?: number
  fiftyTwoWeekHigh?: number
}

type YahooPageStats = {
  volume?: string
  marketCap?: string
  trailingPE?: string
}

function fin(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function fmtVol(value: number) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return Math.round(value).toLocaleString('ko-KR')
}

function fmtCap(value: number, currency = '') {
  if (currency === 'KRW') {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}조`
    if (value >= 1e8) return `${Math.round(value / 1e8).toLocaleString('ko-KR')}억`
    return KRW_FMT.format(value)
  }
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  return `$${USD_FMT.format(value)}`
}

function fmtPrice(value: number, currency = '') {
  if (currency === 'KRW') return KRW_FMT.format(value)
  if (currency === 'USD') return `$${USD_FMT.format(value)}`
  return USD_FMT.format(value)
}

function normalizePe(value?: string) {
  if (!value || value === 'N/A') return undefined
  return value.endsWith('x') ? value : `${value}x`
}

function normalizeKoreanMarketCap(raw?: string) {
  if (!raw) return undefined
  const eok = Number(raw.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(eok) || eok <= 0) return undefined
  if (eok >= 10000) return `${(eok / 10000).toFixed(1)}조`
  return `${Math.round(eok).toLocaleString('ko-KR')}억`
}

function readFinStreamerValue(html: string, field: string) {
  const fieldIndex = html.indexOf(`data-field="${field}"`)
  if (fieldIndex < 0) return undefined
  const tagStart = html.lastIndexOf('<fin-streamer', fieldIndex)
  const tagEnd = html.indexOf('>', fieldIndex)
  if (tagStart < 0 || tagEnd < 0) return undefined
  const tag = html.slice(tagStart, tagEnd)
  const match = tag.match(/data-value="([^"]+)"/)
  return match?.[1]?.trim()
}

async function fetchYahooPageStats(symbol: string): Promise<YahooPageStats> {
  const url = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return {}
  const html = await res.text()
  return {
    volume: readFinStreamerValue(html, 'regularMarketVolume'),
    marketCap: readFinStreamerValue(html, 'marketCap'),
    trailingPE: readFinStreamerValue(html, 'trailingPE'),
  }
}

async function fetchNaverPageStats(symbol: string): Promise<YahooPageStats> {
  const match = symbol.match(/^(\d{6})\.(KS|KQ)$/)
  if (!match) return {}
  const url = `https://finance.naver.com/item/main.naver?code=${match[1]}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return {}
  const html = await res.text()
  const marketCapRaw = html.match(/시가총액\(억\)<\/span><\/th>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/)?.[1]
  const peRaw = html.match(/PER\(배\)<\/strong><\/th>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/)?.[1]
  const volumeRaw = html.match(/<dd>거래량\s*([\d,]+)<\/dd>/)?.[1]
  return {
    volume: volumeRaw?.trim(),
    marketCap: normalizeKoreanMarketCap(marketCapRaw),
    trailingPE: peRaw?.trim(),
  }
}

async function fetchPageStats(symbol: string): Promise<YahooPageStats> {
  const naverStats = await fetchNaverPageStats(symbol)
  if (naverStats.marketCap || naverStats.trailingPE || naverStats.volume) return naverStats
  return fetchYahooPageStats(symbol)
}

function makeStats(meta: YahooMeta, pageStats: YahooPageStats): ChartStat[] {
  const currency = meta.currency ?? ''
  const volume = meta.regularMarketVolume
  const marketCap = meta.marketCap
  const pe = meta.trailingPE
  const low52 = meta.fiftyTwoWeekLow
  const high52 = meta.fiftyTwoWeekHigh

  return [
    { label: '거래량', value: fin(volume) ? fmtVol(volume) : pageStats.volume ?? 'N/A' },
    { label: '시가총액', value: fin(marketCap) ? fmtCap(marketCap, currency) : pageStats.marketCap ?? 'N/A' },
    { label: 'PER', value: fin(pe) ? `${pe.toFixed(1)}x` : normalizePe(pageStats.trailingPE) ?? 'N/A' },
    { label: '52주 변동', value: fin(low52) && fin(high52) ? `${fmtPrice(low52, currency)}–${fmtPrice(high52, currency)}` : 'N/A' },
  ]
}

function timeZoneDateKey(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp * 1000))
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
  const month = parts.find((part) => part.type === 'month')?.value ?? '00'
  const day = parts.find((part) => part.type === 'day')?.value ?? '00'
  return `${year}-${month}-${day}`
}

function formatSeoulLabel(timestamp: number, period: Period) {
  const date = new Date(timestamp * 1000)
  if (period === '1D' || period === '1W') {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  }
  if (period === '1M') {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'numeric',
      day: 'numeric',
    }).format(date)
  }
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'short',
  }).format(date)
}

function formatSessionLabel(points: Array<{ timestamp: number }>, meta: YahooMeta) {
  const first = points[0]?.timestamp
  const last = points.at(-1)?.timestamp
  if (!first || !last) return undefined
  const range = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const market = meta.currency === 'KRW' ? '한국장' : '미국장'
  return `${market} · 한국시간 ${range.format(new Date(first * 1000))}–${range.format(new Date(last * 1000))}`
}

function periodConfig(period: Period, now: Date): { interval: string; period1: Date } {
  switch (period) {
    case '1D':   return { interval: '5m',  period1: new Date(now.getTime() - 2  * 86400000) }
    case '1W':   return { interval: '1h',  period1: new Date(now.getTime() - 7  * 86400000) }
    case '1M':   return { interval: '1d',  period1: new Date(now.getTime() - 31 * 86400000) }
    case '전체': return { interval: '1d',  period1: new Date(now.getTime() - 365 * 86400000) }
  }
}

async function fetchYahooChart(symbol: string, period: Period): Promise<ChartPayload> {
  const now = new Date()
  const { interval, period1 } = periodConfig(period, now)

  const params = new URLSearchParams({
    interval,
    period1: String(Math.floor(period1.getTime() / 1000)),
    period2: String(Math.floor(now.getTime() / 1000)),
    includePrePost: 'false',
  })

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })

  if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`)

  const data = await res.json()
  const result = data?.chart?.result?.[0]
  const meta: YahooMeta = result?.meta ?? {}
  const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? []
  const timestamps: number[] = result?.timestamp ?? []
  let points = closes
    .map((close, index) => ({ value: close, timestamp: timestamps[index] }))
    .filter((point): point is { value: number; timestamp: number } => (
      fin(point.value) && fin(point.timestamp)
    ))

  if (period === '1D' && points.length > 0) {
    const exchangeTimeZone = meta.exchangeTimezoneName ?? (meta.currency === 'KRW' ? 'Asia/Seoul' : 'America/New_York')
    const latestMarketDate = timeZoneDateKey(points.at(-1)!.timestamp, exchangeTimeZone)
    points = points.filter((point) => timeZoneDateKey(point.timestamp, exchangeTimeZone) === latestMarketDate)
  }

  const pageStats = await fetchPageStats(symbol).catch(() => ({}))
  return {
    series: points.map((point) => point.value),
    labels: points.map((point) => formatSeoulLabel(point.timestamp, period)),
    stats: makeStats(meta, pageStats),
    sessionLabel: period === '1D' ? formatSessionLabel(points, meta) : undefined,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const url = new URL(req.url)
    const symbol = url.searchParams.get('symbol') ?? ''
    const period = url.searchParams.get('period') ?? '1D'

    if (!symbol) {
      return new Response(JSON.stringify({ error: 'symbol 파라미터가 필요합니다' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
    if (!VALID_PERIODS.has(period)) {
      return new Response(JSON.stringify({ error: `알 수 없는 period: ${period}` }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const payload = await fetchYahooChart(symbol, period as Period)
    return new Response(JSON.stringify(payload), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
