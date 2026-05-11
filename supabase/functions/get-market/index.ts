import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const YF_HEADERS = { 'User-Agent': 'Mozilla/5.0' }

interface Spec { label?: string; name?: string; symbol: string; currency: string }

const INDICATOR_SPECS: Spec[] = [
  { label: 'KOSPI',    symbol: '^KS11',     currency: 'KRW' },
  { label: 'S&P 500',  symbol: '^GSPC',     currency: 'USD' },
  { label: 'USD/KRW',  symbol: 'USDKRW=X',  currency: 'KRW' },
  { label: 'WTI',      symbol: 'CL=F',      currency: 'USD' },
  { label: 'Bitcoin',  symbol: 'BTC-USD',   currency: 'USD' },
  { label: 'VIX',      symbol: '^VIX',      currency: 'USD' },
  { label: 'NASDAQ',   symbol: '^IXIC',     currency: 'USD' },
  { label: 'KOSDAQ',   symbol: '^KQ11',     currency: 'KRW' },
  { label: '금',       symbol: 'GC=F',      currency: 'USD' },
  { label: '닛케이',   symbol: '^N225',     currency: 'JPY' },
  { label: 'EUR/USD',  symbol: 'EURUSD=X',  currency: 'USD' },
  { label: '미 국채10Y', symbol: '^TNX',    currency: 'USD' },
]

const WATCHLIST_SPECS: Spec[] = [
  { name: '삼성전자',   symbol: '005930.KS', currency: 'KRW' },
  { name: 'NVIDIA',    symbol: 'NVDA',      currency: 'USD' },
  { name: 'Apple Inc.', symbol: 'AAPL',     currency: 'USD' },
  { name: '카카오',    symbol: '035720.KS', currency: 'KRW' },
  { name: 'SK하이닉스', symbol: '000660.KS', currency: 'KRW' },
]

const MAIN_CHART_SPEC: Spec = { name: '삼성전자', symbol: '005930.KS', currency: 'KRW' }

// ── 포매터 ──────────────────────────────────────────────────────────────────
const KRW_FMT = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 })
const USD_FMT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const DATE_FMT = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul',
})

function fin(v: unknown): v is number { return typeof v === 'number' && Number.isFinite(v) }
function fmtPrice(v: number, cur: string) { return (cur === 'KRW' ? KRW_FMT : USD_FMT).format(v) }
function fmtSigned(v: number, cur: string) { return `${v >= 0 ? '+' : ''}${fmtPrice(v, cur)}` }
function fmtPct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }
function fmtVol(v: number) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  return String(v)
}
function fmtCap(v: number) {
  if (v >= 1e12) return `${(v / 1e12).toFixed(1)}조`
  if (v >= 1e8)  return `${Math.round(v / 1e8)}억`
  return KRW_FMT.format(v)
}

function makeSeries(changePct: number): number[] {
  const mag = Math.max(0.5, Math.min(Math.abs(changePct), 6))
  const dir = changePct >= 0 ? 1 : -1
  return Array.from({ length: 8 }, (_, i) => 10 + dir * i * (mag / 7) + Math.sin(i / 1.5) * 0.25 * dir)
}

// ── Yahoo Finance API ────────────────────────────────────────────────────────
interface QuoteMeta {
  regularMarketPrice?: number
  previousClose?: number
  chartPreviousClose?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
  regularMarketVolume?: number
  marketCap?: number
  trailingPE?: number
  fiftyTwoWeekLow?: number
  fiftyTwoWeekHigh?: number
}

async function fetchChartMeta(symbol: string, days = 2): Promise<{ meta: QuoteMeta; closes: number[] }> {
  const now = Math.floor(Date.now() / 1000)
  const period1 = now - days * 86400
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${now}`
  const res = await fetch(url, { headers: YF_HEADERS })
  if (!res.ok) throw new Error(`Yahoo chart ${res.status} (${symbol})`)
  const data = await res.json()
  const result = data?.chart?.result?.[0]
  const meta: QuoteMeta = result?.meta ?? {}
  const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? []
  return { meta, closes: closes.filter((v): v is number => v !== null && Number.isFinite(v)) }
}

async function fetchQuotes(symbols: string[]): Promise<Map<string, QuoteMeta>> {
  const results = await Promise.allSettled(symbols.map(s => fetchChartMeta(s, 2)))
  const map = new Map<string, QuoteMeta>()
  symbols.forEach((sym, i) => {
    const r = results[i]
    map.set(sym, r.status === 'fulfilled' ? r.value.meta : {})
  })
  return map
}

async function fetchHistory(symbol: string, days: number): Promise<number[]> {
  const { closes } = await fetchChartMeta(symbol, days)
  return closes
}

// ── 시장 상태 감지 (기존 로직 그대로) ─────────────────────────────────────
function avg(arr: number[]) { return arr.reduce((s, v) => s + v, 0) / arr.length }
function stdDev(arr: number[]) {
  if (arr.length < 2) return null
  const m = avg(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1))
}
function pctChg(cur: number | null, prev: number | null) {
  if (!fin(cur) || !fin(prev) || prev === 0) return null
  return ((cur - prev) / prev) * 100
}

function detectMarketStatus(closes: number[]) {
  const cur = closes.at(-1) ?? null
  const prev = closes.at(-2) ?? null
  const week = closes.length >= 8 ? closes.at(-8) ?? null : null
  const ma20closes = closes.length >= 20 ? closes.slice(-20) : null
  const ma5closes  = closes.length >= 5  ? closes.slice(-5)  : null
  const ma20 = ma20closes ? avg(ma20closes) : null
  const ma5  = ma5closes  ? avg(ma5closes)  : null

  const returns = closes.slice(-21).map((v, i, a) => i === 0 ? null : pctChg(v, a[i - 1])).filter(fin)
  const vol20 = returns.length >= 20 ? stdDev(returns.slice(-20)) : null

  const dailyRet   = pctChg(cur, prev)
  const weeklyRet  = pctChg(cur, week)
  const pvMa20     = fin(cur) && fin(ma20) && ma20 !== 0 ? pctChg(cur, ma20) : null
  const m5vMa20    = fin(ma5) && fin(ma20) && ma20 !== 0 ? pctChg(ma5, ma20) : null

  const volLevel = !fin(vol20) ? 'unknown' : vol20 < 10 ? 'low' : vol20 < 25 ? 'medium' : 'high'

  if (!fin(cur) || cur <= 0) return { signal: 'invalid_data', label: '데이터 오류', reasonText: '유효하지 않은 가격 데이터입니다.', reasonCodes: ['INVALID_INPUT'], riskReasons: [], volatilityLevel: 'unknown' }

  const riskReasons: string[] = []
  const riskCodes: string[] = []
  if (fin(dailyRet)  && dailyRet  <= -3) { riskReasons.push('일간 낙폭이 큽니다.'); riskCodes.push('SHARP_DAILY_DROP') }
  if (fin(weeklyRet) && weeklyRet <= -7) { riskReasons.push('주간 하락폭이 큽니다.'); riskCodes.push('SHARP_WEEKLY_DROP') }
  if (fin(vol20)     && vol20     >= 25) { riskReasons.push('20일 변동성이 높습니다.'); riskCodes.push('HIGH_VOLATILITY') }
  if (fin(pvMa20)    && pvMa20    <= -5) { riskReasons.push('현재가가 20일 이동평균을 크게 밑돕니다.'); riskCodes.push('PRICE_WELL_BELOW_MA20') }
  if (riskReasons.length > 0) return { signal: 'caution', label: '주의', reasonText: '위험 신호가 감지되었습니다.', reasonCodes: riskCodes, riskReasons, volatilityLevel: volLevel }

  let up = 0, down = 0, side = 0
  const upCodes: string[] = [], downCodes: string[] = [], sideCodes: string[] = []
  if (fin(pvMa20)) { pvMa20 > 0 ? (up++, upCodes.push('PRICE_ABOVE_MA20')) : (down++, downCodes.push('PRICE_BELOW_MA20')) }
  if (fin(m5vMa20)) { m5vMa20 > 0 ? (up++, upCodes.push('MA5_ABOVE_MA20')) : (down++, downCodes.push('MA5_BELOW_MA20')) }
  if (fin(weeklyRet)) { weeklyRet > 0 ? (up++, upCodes.push('WEEKLY_RETURN_POSITIVE')) : (down++, downCodes.push('WEEKLY_RETURN_NEGATIVE')) }
  if (fin(dailyRet)) { dailyRet > 0 ? (up++, upCodes.push('DAILY_RETURN_POSITIVE')) : (down++, downCodes.push('DAILY_RETURN_NEGATIVE')) }
  if (fin(pvMa20) && Math.abs(pvMa20) < 0.5) { side++; sideCodes.push('PRICE_NEAR_MA20') }
  if (fin(m5vMa20) && Math.abs(m5vMa20) < 0.5) { side++; sideCodes.push('MA5_NEAR_MA20') }
  if (fin(weeklyRet) && Math.abs(weeklyRet) < 3) { side++; sideCodes.push('WEEKLY_RETURN_NEUTRAL') }

  if (up >= 3 && up > down && up > side) return { signal: 'up', label: '상승', reasonText: '단기와 중기 흐름이 모두 상승 우위입니다.', reasonCodes: upCodes, riskReasons: [], volatilityLevel: volLevel }
  if (down >= 3 && down > up && down > side) return { signal: 'down', label: '하락', reasonText: '단기와 중기 흐름이 모두 하락 우위입니다.', reasonCodes: downCodes, riskReasons: [], volatilityLevel: volLevel }
  return { signal: 'sideways', label: '횡보', reasonText: side >= 2 ? '이동평균과 주간 흐름이 엇갈려 횡보로 봤습니다.' : '방향성이 뚜렷하지 않습니다.', reasonCodes: sideCodes, riskReasons: [], volatilityLevel: volLevel }
}

// ── 메인 핸들러 ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const allSymbols = [...INDICATOR_SPECS, ...WATCHLIST_SPECS].map(s => s.symbol)
    const [quoteMap, chartCloses] = await Promise.all([
      fetchQuotes(allSymbols),
      fetchHistory(MAIN_CHART_SPEC.symbol, 120),
    ])

    const marketStatus = detectMarketStatus(chartCloses)

    const indicators = INDICATOR_SPECS.map(spec => {
      const q = quoteMap.get(spec.symbol) ?? {}
      const price = Number(q.regularMarketPrice)
      const prevClose = Number(q.previousClose ?? q.chartPreviousClose)
      const change = fin(price) && fin(prevClose) ? price - prevClose : Number(q.regularMarketChange)
      const changePct = fin(price) && fin(prevClose) && prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : Number(q.regularMarketChangePercent)
      return {
        label: spec.label!,
        symbol: spec.symbol,
        value:  fin(price)     ? fmtPrice(price, spec.currency)        : 'N/A',
        change: fin(change)    ? fmtSigned(change, spec.currency)      : 'N/A',
        pct:    fin(changePct) ? fmtPct(changePct)                     : 'N/A',
        up:     fin(change) ? change >= 0 : true,
        series: makeSeries(fin(changePct) ? changePct : 0),
      }
    })

    const watchlist = WATCHLIST_SPECS.map(spec => {
      const q = quoteMap.get(spec.symbol) ?? {}
      const price    = Number(q.regularMarketPrice)
      const prevClose = Number(q.previousClose ?? q.chartPreviousClose)
      const change    = fin(price) && fin(prevClose) ? price - prevClose : Number(q.regularMarketChange)
      const changePct = fin(price) && fin(prevClose) && prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : Number(q.regularMarketChangePercent)
      return {
        name:   spec.name!,
        symbol: spec.symbol,
        price:  fin(price)     ? fmtPrice(price, spec.currency) : 'N/A',
        chg:    fin(changePct) ? fmtPct(changePct)              : 'N/A',
        up:     fin(change) ? change >= 0 : true,
        series: makeSeries(fin(changePct) ? changePct : 0),
      }
    })

    const mainQ      = quoteMap.get(MAIN_CHART_SPEC.symbol) ?? {}
    const mainPrice  = Number(mainQ.regularMarketPrice)
    const mainChange = Number(mainQ.regularMarketChange)
    const mainPct    = Number(mainQ.regularMarketChangePercent)
    const volume     = Number(mainQ.regularMarketVolume)
    const marketCap  = Number(mainQ.marketCap)
    const pe         = Number(mainQ.trailingPE)
    const low52      = Number(mainQ.fiftyTwoWeekLow)
    const high52     = Number(mainQ.fiftyTwoWeekHigh)

    const payload = {
      generatedAt: new Date().toISOString(),
      generatedAtLabel: DATE_FMT.format(new Date()),
      marketStatus,
      indicators,
      chart: {
        symbol:   MAIN_CHART_SPEC.symbol,
        name:     MAIN_CHART_SPEC.name!,
        currency: MAIN_CHART_SPEC.currency,
        price:    fin(mainPrice)  ? fmtPrice(mainPrice, MAIN_CHART_SPEC.currency)         : 'N/A',
        change:   fin(mainChange) ? fmtSigned(mainChange, MAIN_CHART_SPEC.currency)       : 'N/A',
        percent:  fin(mainPct)    ? fmtPct(mainPct)                                       : 'N/A',
        series:   chartCloses,
        stats: [
          { label: '거래량',   value: fin(volume)    ? fmtVol(volume)                                   : 'N/A' },
          { label: '시가총액', value: fin(marketCap) ? fmtCap(marketCap)                                : 'N/A' },
          { label: 'PER',     value: fin(pe)         ? `${pe.toFixed(1)}x`                              : 'N/A' },
          { label: '52주 변동', value: fin(low52) && fin(high52) ? `${fmtPrice(low52, 'KRW')}–${fmtPrice(high52, 'KRW')}` : 'N/A' },
        ],
        note: marketStatus.reasonText,
      },
      watchlist,
    }

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
