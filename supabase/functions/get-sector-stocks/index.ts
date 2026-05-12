import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type SectorKey = 'AI' | '반도체' | '조선' | '에너지' | '헬스' | '우주' | '바이오' | '방산'

type StockSpec = {
  name: string
  symbol: string
  currency: string
}

type SectorSpec = {
  key: SectorKey
  label: string
  stocks: StockSpec[]
}

type YahooQuote = {
  regularMarketPrice?: number
  previousClose?: number
  chartPreviousClose?: number
  currency?: string
}

type StockHistory = {
  meta: YahooQuote
  closes: number[]
}

type StockStatus = {
  status: 'up' | 'down' | 'sideways' | 'caution' | 'insufficient_data' | 'invalid_data'
  label: string
  summary: string
  reasonCodes: string[]
  volatilityLevel: 'low' | 'medium' | 'high' | 'unknown'
}

type DataQuality = {
  status: 'normal' | 'partial' | 'price_error' | 'analysis_unavailable'
  label: string
  summary: string
}

const SECTORS: SectorSpec[] = [
  {
    key: 'AI',
    label: 'AI',
    stocks: [
      { name: 'NVIDIA', symbol: 'NVDA', currency: 'USD' },
      { name: 'Microsoft', symbol: 'MSFT', currency: 'USD' },
      { name: 'Alphabet', symbol: 'GOOGL', currency: 'USD' },
      { name: 'Amazon', symbol: 'AMZN', currency: 'USD' },
      { name: 'Meta Platforms', symbol: 'META', currency: 'USD' },
      { name: 'Palantir', symbol: 'PLTR', currency: 'USD' },
      { name: 'AMD', symbol: 'AMD', currency: 'USD' },
      { name: 'Broadcom', symbol: 'AVGO', currency: 'USD' },
      { name: 'Oracle', symbol: 'ORCL', currency: 'USD' },
      { name: 'IBM', symbol: 'IBM', currency: 'USD' },
    ],
  },
  {
    key: '반도체',
    label: '반도체',
    stocks: [
      { name: 'NVIDIA', symbol: 'NVDA', currency: 'USD' },
      { name: 'TSMC', symbol: 'TSM', currency: 'USD' },
      { name: 'Broadcom', symbol: 'AVGO', currency: 'USD' },
      { name: 'ASML', symbol: 'ASML', currency: 'USD' },
      { name: 'AMD', symbol: 'AMD', currency: 'USD' },
      { name: 'Qualcomm', symbol: 'QCOM', currency: 'USD' },
      { name: 'Intel', symbol: 'INTC', currency: 'USD' },
      { name: 'Micron', symbol: 'MU', currency: 'USD' },
      { name: 'Texas Instruments', symbol: 'TXN', currency: 'USD' },
      { name: 'Applied Materials', symbol: 'AMAT', currency: 'USD' },
    ],
  },
  {
    key: '조선',
    label: '조선',
    stocks: [
      { name: 'HD현대중공업', symbol: '329180.KS', currency: 'KRW' },
      { name: '한화오션', symbol: '042660.KS', currency: 'KRW' },
      { name: '삼성중공업', symbol: '010140.KS', currency: 'KRW' },
      { name: 'HD한국조선해양', symbol: '009540.KS', currency: 'KRW' },
      { name: '현대미포조선', symbol: '010620.KS', currency: 'KRW' },
      { name: 'HJ중공업', symbol: '097230.KS', currency: 'KRW' },
      { name: 'HD현대마린엔진', symbol: '071970.KS', currency: 'KRW' },
      { name: 'STX엔진', symbol: '077970.KS', currency: 'KRW' },
      { name: 'HD현대', symbol: '267250.KS', currency: 'KRW' },
      { name: 'HMM', symbol: '011200.KS', currency: 'KRW' },
    ],
  },
  {
    key: '에너지',
    label: '에너지',
    stocks: [
      { name: 'Exxon Mobil', symbol: 'XOM', currency: 'USD' },
      { name: 'Chevron', symbol: 'CVX', currency: 'USD' },
      { name: 'ConocoPhillips', symbol: 'COP', currency: 'USD' },
      { name: 'Shell', symbol: 'SHEL', currency: 'USD' },
      { name: 'TotalEnergies', symbol: 'TTE', currency: 'USD' },
      { name: 'BP', symbol: 'BP', currency: 'USD' },
      { name: 'Schlumberger', symbol: 'SLB', currency: 'USD' },
      { name: 'NextEra Energy', symbol: 'NEE', currency: 'USD' },
      { name: 'Enphase Energy', symbol: 'ENPH', currency: 'USD' },
      { name: 'First Solar', symbol: 'FSLR', currency: 'USD' },
    ],
  },
  {
    key: '헬스',
    label: '헬스',
    stocks: [
      { name: 'UnitedHealth', symbol: 'UNH', currency: 'USD' },
      { name: 'Eli Lilly', symbol: 'LLY', currency: 'USD' },
      { name: 'Johnson & Johnson', symbol: 'JNJ', currency: 'USD' },
      { name: 'Merck', symbol: 'MRK', currency: 'USD' },
      { name: 'AbbVie', symbol: 'ABBV', currency: 'USD' },
      { name: 'Pfizer', symbol: 'PFE', currency: 'USD' },
      { name: 'Thermo Fisher', symbol: 'TMO', currency: 'USD' },
      { name: 'Abbott', symbol: 'ABT', currency: 'USD' },
      { name: 'Intuitive Surgical', symbol: 'ISRG', currency: 'USD' },
      { name: 'Medtronic', symbol: 'MDT', currency: 'USD' },
    ],
  },
  {
    key: '우주',
    label: '우주',
    stocks: [
      { name: 'Rocket Lab', symbol: 'RKLB', currency: 'USD' },
      { name: 'Intuitive Machines', symbol: 'LUNR', currency: 'USD' },
      { name: 'AST SpaceMobile', symbol: 'ASTS', currency: 'USD' },
      { name: 'Virgin Galactic', symbol: 'SPCE', currency: 'USD' },
      { name: 'Boeing', symbol: 'BA', currency: 'USD' },
      { name: 'Lockheed Martin', symbol: 'LMT', currency: 'USD' },
      { name: 'Northrop Grumman', symbol: 'NOC', currency: 'USD' },
      { name: 'RTX', symbol: 'RTX', currency: 'USD' },
      { name: 'Iridium', symbol: 'IRDM', currency: 'USD' },
      { name: 'EchoStar', symbol: 'SATS', currency: 'USD' },
    ],
  },
  {
    key: '바이오',
    label: '바이오',
    stocks: [
      { name: 'Amgen', symbol: 'AMGN', currency: 'USD' },
      { name: 'Gilead Sciences', symbol: 'GILD', currency: 'USD' },
      { name: 'Regeneron', symbol: 'REGN', currency: 'USD' },
      { name: 'Vertex', symbol: 'VRTX', currency: 'USD' },
      { name: 'Moderna', symbol: 'MRNA', currency: 'USD' },
      { name: 'BioNTech', symbol: 'BNTX', currency: 'USD' },
      { name: 'Biogen', symbol: 'BIIB', currency: 'USD' },
      { name: 'Illumina', symbol: 'ILMN', currency: 'USD' },
      { name: 'CRISPR Therapeutics', symbol: 'CRSP', currency: 'USD' },
      { name: 'Alnylam', symbol: 'ALNY', currency: 'USD' },
    ],
  },
  {
    key: '방산',
    label: '방산',
    stocks: [
      { name: 'Lockheed Martin', symbol: 'LMT', currency: 'USD' },
      { name: 'RTX', symbol: 'RTX', currency: 'USD' },
      { name: 'Northrop Grumman', symbol: 'NOC', currency: 'USD' },
      { name: 'General Dynamics', symbol: 'GD', currency: 'USD' },
      { name: 'Boeing', symbol: 'BA', currency: 'USD' },
      { name: 'L3Harris', symbol: 'LHX', currency: 'USD' },
      { name: 'Huntington Ingalls', symbol: 'HII', currency: 'USD' },
      { name: 'TransDigm', symbol: 'TDG', currency: 'USD' },
      { name: 'HEICO', symbol: 'HEI', currency: 'USD' },
      { name: 'Kratos Defense', symbol: 'KTOS', currency: 'USD' },
    ],
  },
]

const DATE_FMT = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'Asia/Seoul',
})
const KRW_FMT = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 })
const USD_FMT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

function fin(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function formatPrice(value: number, currency: string) {
  if (currency === 'KRW') return `${KRW_FMT.format(value)}원`
  return `$${USD_FMT.format(value)}`
}

function formatSigned(value: number, currency: string) {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${currency === 'KRW' ? `${KRW_FMT.format(value)}원` : `$${USD_FMT.format(value)}`}`
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function detectDataQuality(price: unknown, prevClose: unknown, closes: number[]): DataQuality {
  if (!fin(price) || price <= 0) {
    return {
      status: 'price_error',
      label: '가격 데이터 오류',
      summary: '현재가가 없거나 유효하지 않아 가격 표시를 확인해야 해요.',
    }
  }
  if (!fin(prevClose) || prevClose <= 0) {
    return {
      status: 'partial',
      label: '일부 지표 부족',
      summary: '이전 종가가 없어 등락률 계산 일부가 제한돼요.',
    }
  }
  if (closes.length < 8) {
    return {
      status: 'analysis_unavailable',
      label: '분석 불가',
      summary: '최근 시계열이 너무 적어 흐름 분석은 제한돼요.',
    }
  }
  if (closes.length < 20) {
    return {
      status: 'partial',
      label: '일부 지표 부족',
      summary: '핵심 가격은 정상이나 20일 평균 분석은 제한돼요.',
    }
  }
  return {
    status: 'normal',
    label: '데이터 정상',
    summary: '현재가와 최근 시계열이 정상적으로 확인됐어요.',
  }
}

function avg(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function pctChange(current: number | null, previous: number | null) {
  if (!fin(current) || !fin(previous) || previous === 0) return null
  return ((current - previous) / previous) * 100
}

function volatility20(closes: number[]) {
  if (closes.length < 21) return null
  const returns = closes.slice(-21).map((value, index, array) => {
    if (index === 0) return null
    return pctChange(value, array[index - 1])
  }).filter(fin)
  if (returns.length < 20) return null
  const mean = avg(returns)
  return Math.sqrt(returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1))
}

function detectStockStatus(closes: number[], symbol: string): StockStatus {
  const current = closes.at(-1) ?? null
  const previous = closes.at(-2) ?? null
  if (!fin(current) || current <= 0) {
    return {
      status: 'invalid_data',
      label: '데이터 오류',
      summary: `${symbol}은 현재 가격 데이터가 유효하지 않아 분석할 수 없어요.`,
      reasonCodes: ['INVALID_INPUT'],
      volatilityLevel: 'unknown',
    }
  }

  const dailyReturn = pctChange(current, previous)
  const weeklyReturn = closes.length >= 8 ? pctChange(current, closes.at(-8) ?? null) : null
  const ma5 = closes.length >= 5 ? avg(closes.slice(-5)) : null
  const ma20 = closes.length >= 20 ? avg(closes.slice(-20)) : null
  const priceVsMa20 = fin(ma20) ? pctChange(current, ma20) : null
  const ma5VsMa20 = fin(ma5) && fin(ma20) ? pctChange(ma5, ma20) : null
  const vol20 = volatility20(closes)
  const volatilityLevel = !fin(vol20) ? 'unknown' : vol20 < 10 ? 'low' : vol20 < 25 ? 'medium' : 'high'
  const missingCore = [weeklyReturn, priceVsMa20, vol20].filter((value) => value === null).length

  if (missingCore >= 2 || dailyReturn === null) {
    return {
      status: 'insufficient_data',
      label: '데이터 부족',
      summary: `${symbol}은 아직 추세를 판단할 만큼 최근 데이터가 충분하지 않아요.`,
      reasonCodes: ['INSUFFICIENT_METRICS'],
      volatilityLevel,
    }
  }

  const riskReasons: string[] = []
  if (fin(dailyReturn) && dailyReturn <= -3) riskReasons.push('SHARP_DAILY_DROP')
  if (fin(weeklyReturn) && weeklyReturn <= -7) riskReasons.push('SHARP_WEEKLY_DROP')
  if (fin(vol20) && vol20 >= 25) riskReasons.push('HIGH_VOLATILITY')
  if (fin(priceVsMa20) && priceVsMa20 <= -5) riskReasons.push('PRICE_WELL_BELOW_MA20')
  if (riskReasons.length > 0) {
    return {
      status: 'caution',
      label: '주의',
      summary: `${symbol}은 하락폭이나 변동성이 커서 단기 판단에 주의가 필요해요.`,
      reasonCodes: riskReasons,
      volatilityLevel,
    }
  }

  let upScore = 0
  let downScore = 0
  let sidewaysScore = 0
  const upCodes: string[] = []
  const downCodes: string[] = []
  const sideCodes: string[] = []

  if (fin(priceVsMa20)) {
    if (priceVsMa20 > 0) { upScore += 1; upCodes.push('PRICE_ABOVE_MA20') }
    if (priceVsMa20 < 0) { downScore += 1; downCodes.push('PRICE_BELOW_MA20') }
    if (Math.abs(priceVsMa20) < 0.5) { sidewaysScore += 1; sideCodes.push('PRICE_NEAR_MA20') }
  }
  if (fin(ma5VsMa20)) {
    if (ma5VsMa20 > 0) { upScore += 1; upCodes.push('MA5_ABOVE_MA20') }
    if (ma5VsMa20 < 0) { downScore += 1; downCodes.push('MA5_BELOW_MA20') }
    if (Math.abs(ma5VsMa20) < 0.5) { sidewaysScore += 1; sideCodes.push('MA5_NEAR_MA20') }
  }
  if (fin(weeklyReturn)) {
    if (weeklyReturn > 0) { upScore += 1; upCodes.push('WEEKLY_RETURN_POSITIVE') }
    if (weeklyReturn < 0) { downScore += 1; downCodes.push('WEEKLY_RETURN_NEGATIVE') }
    if (Math.abs(weeklyReturn) < 3) { sidewaysScore += 1; sideCodes.push('WEEKLY_RETURN_NEUTRAL') }
  }
  if (fin(dailyReturn)) {
    if (dailyReturn > 0) { upScore += 1; upCodes.push('DAILY_RETURN_POSITIVE') }
    if (dailyReturn < 0) { downScore += 1; downCodes.push('DAILY_RETURN_NEGATIVE') }
  }

  if (upScore >= 3 && upScore > downScore && upScore > sidewaysScore) {
    return {
      status: 'up',
      label: '상승',
      summary: `${symbol}은 최근 가격이 평균선 위에 있고 단기 흐름도 상승 쪽으로 기울어 있어요.`,
      reasonCodes: upCodes,
      volatilityLevel,
    }
  }

  if (downScore >= 3 && downScore > upScore && downScore > sidewaysScore) {
    return {
      status: 'down',
      label: '하락',
      summary: `${symbol}은 최근 가격이 평균선 아래에 있고 단기 흐름도 약한 편이에요.`,
      reasonCodes: downCodes,
      volatilityLevel,
    }
  }

  return {
    status: 'sideways',
    label: '횡보',
    summary: `${symbol}은 상승과 하락 근거가 섞여 있어 방향성이 아직 뚜렷하지 않아요.`,
    reasonCodes: sideCodes.length > 0 ? sideCodes : ['WEEKLY_RETURN_NEUTRAL'],
    volatilityLevel,
  }
}

async function fetchYahooQuote(symbol: string): Promise<StockHistory> {
  const now = Math.floor(Date.now() / 1000)
  const period1 = now - 45 * 86400
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${now}`
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!response.ok) throw new Error(`Yahoo chart ${response.status} (${symbol})`)
  const data = await response.json()
  const result = data?.chart?.result?.[0]
  const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? []
  return {
    meta: result?.meta ?? {},
    closes: closes.filter((value): value is number => value !== null && Number.isFinite(value)),
  }
}

async function fetchYahooQuotes(symbols: string[]) {
  const results = await Promise.allSettled(symbols.map((symbol) => fetchYahooQuote(symbol)))
  const map = new Map<string, StockHistory>()
  symbols.forEach((symbol, index) => {
    const result = results[index]
    map.set(symbol, result.status === 'fulfilled' ? result.value : { meta: {}, closes: [] })
  })
  return map
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const uniqueSymbols = [...new Set(SECTORS.flatMap((sector) => sector.stocks.map((stock) => stock.symbol)))]
    const quoteMap = await fetchYahooQuotes([...uniqueSymbols, 'USDKRW=X'])
    const usdKrwPrice = quoteMap.get('USDKRW=X')?.meta.regularMarketPrice
    const usdKrwRate = fin(usdKrwPrice) ? usdKrwPrice : null

    const payload = {
      generatedAt: new Date().toISOString(),
      generatedAtLabel: DATE_FMT.format(new Date()),
      usdKrwRate,
      sectors: SECTORS.map((sector) => ({
        key: sector.key,
        label: sector.label,
        stocks: sector.stocks.map((stock) => {
          const history = quoteMap.get(stock.symbol)
          const quote = history?.meta
          const price = quote?.regularMarketPrice
          const prevClose = quote?.previousClose ?? quote?.chartPreviousClose
          const change = fin(price) && fin(prevClose) ? price - prevClose : null
          const changePercent = fin(change) && fin(prevClose) && prevClose !== 0 ? (change / prevClose) * 100 : null
          const currency = quote?.currency ?? stock.currency
          const status = detectStockStatus(history?.closes ?? [], stock.symbol)
          const dataQuality = detectDataQuality(price, prevClose, history?.closes ?? [])

          return {
            name: stock.name,
            symbol: stock.symbol,
            price: fin(price) ? formatPrice(price, currency) : 'N/A',
            krwPrice: fin(price) && currency === 'USD' && fin(usdKrwRate) ? formatPrice(price * usdKrwRate, 'KRW') : undefined,
            change: fin(change) ? formatSigned(change, currency) : 'N/A',
            changePercent: fin(changePercent) ? formatPercent(changePercent) : 'N/A',
            up: fin(change) ? change >= 0 : true,
            currency,
            status: status.status,
            statusLabel: status.label,
            statusSummary: status.summary,
            reasonCodes: status.reasonCodes,
            volatilityLevel: status.volatilityLevel,
            dataQuality: dataQuality.status,
            dataQualityLabel: dataQuality.label,
            dataQualitySummary: dataQuality.summary,
          }
        }),
      })),
    }

    return new Response(JSON.stringify(payload), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
