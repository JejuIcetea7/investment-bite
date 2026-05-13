import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YahooFinance from 'yahoo-finance2'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(rootDir, '../public/data/market-data.json')
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] })

const KRW_PRICE_FORMATTER = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 })
const USD_PRICE_FORMATTER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const COMPACT_FORMATTER = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

const indicatorSpecs = [
  { label: 'KOSPI', symbol: '^KS11', currency: 'KRW' },
  { label: 'S&P 500', symbol: '^GSPC', currency: 'USD' },
  { label: 'USD/KRW', symbol: 'USDKRW=X', currency: 'KRW' },
  { label: 'WTI', symbol: 'CL=F', currency: 'USD' },
  { label: 'Bitcoin', symbol: 'BTC-USD', currency: 'USD' },
  { label: 'VIX', symbol: '^VIX', currency: 'USD' },
  { label: 'NASDAQ', symbol: '^IXIC', currency: 'USD' },
  { label: 'KOSDAQ', symbol: '^KQ11', currency: 'KRW' },
  { label: '금', symbol: 'GC=F', currency: 'USD' },
  { label: '닛케이', symbol: '^N225', currency: 'JPY' },
  { label: 'EUR/USD', symbol: 'EURUSD=X', currency: 'USD' },
  { label: '미 국채10Y', symbol: '^TNX', currency: 'USD' },
]

const watchlistSpecs = [
  { name: '삼성전자', symbol: '005930.KS', currency: 'KRW' },
  { name: 'NVIDIA', symbol: 'NVDA', currency: 'USD' },
  { name: 'Apple Inc.', symbol: 'AAPL', currency: 'USD' },
  { name: '카카오', symbol: '035720.KS', currency: 'KRW' },
  { name: 'SK하이닉스', symbol: '000660.KS', currency: 'KRW' },
]

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function pctChange(current, previous) {
  if (!isFiniteNumber(current) || !isFiniteNumber(previous) || previous === 0) return null
  return ((current - previous) / previous) * 100
}

function average(values) {
  const validValues = values.filter(isFiniteNumber)
  if (validValues.length === 0) return null
  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length
}

function sampleStdDev(values) {
  const validValues = values.filter(isFiniteNumber)
  if (validValues.length < 2) return null
  const mean = average(validValues)
  const variance = validValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (validValues.length - 1)
  return Math.sqrt(variance)
}

function formatSignedPrice(value, currency) {
  const formatter = currency === 'KRW' ? KRW_PRICE_FORMATTER : USD_PRICE_FORMATTER
  const prefix = value >= 0 ? '+' : '-'
  return `${prefix}${formatter.format(Math.abs(value))}`
}

function formatPrice(value, currency) {
  const formatter = currency === 'KRW' ? KRW_PRICE_FORMATTER : USD_PRICE_FORMATTER
  return formatter.format(value)
}

function formatPercent(value) {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${value.toFixed(2)}%`
}

function formatCompact(value) {
  return COMPACT_FORMATTER.format(value)
}

function formatKoreanMarketCap(value) {
  if (!isFiniteNumber(value)) return 'N/A'
  if (value >= 1e12) return `${(value / 1e12).toFixed(1).replace(/\.0$/, '')}조`
  if (value >= 1e8) return `${Math.round(value / 1e8)}억`
  return KRW_PRICE_FORMATTER.format(value)
}

function formatRange(low, high, currency) {
  if (!isFiniteNumber(low) || !isFiniteNumber(high)) return 'N/A'
  return `${formatPrice(low, currency)}–${formatPrice(high, currency)}`
}

function formatVolume(value) {
  if (!isFiniteNumber(value)) return 'N/A'
  return formatCompact(value)
}

function makeSeriesFromMovement(changePercent) {
  const magnitude = Math.max(0.5, Math.min(Math.abs(changePercent) || 0, 6))
  const direction = changePercent >= 0 ? 1 : -1
  return Array.from({ length: 8 }, (_, index) => {
    const drift = direction * index * (magnitude / 7)
    const wobble = Math.sin(index / 1.5) * 0.25 * direction
    return 10 + drift + wobble
  })
}

function sanitizeQuotes(quotes) {
  return quotes
    .map((quote) => ({
      date: quote.date instanceof Date ? quote.date : new Date(quote.date),
      open: Number(quote.open),
      high: Number(quote.high),
      low: Number(quote.low),
      close: Number(quote.close),
      volume: Number(quote.volume),
    }))
    .filter((quote) => isFiniteNumber(quote.close))
    .sort((left, right) => left.date - right.date)
}

function calculateCoreMetrics(quotes) {
  const closes = quotes.map((quote) => quote.close)
  const volumes = quotes.map((quote) => quote.volume)

  const currentClose = closes.at(-1) ?? null
  const previousClose = closes.at(-2) ?? null
  const weeklyClose = closes.length >= 8 ? closes.at(-8) ?? null : null
  const monthlyClose = closes.length >= 31 ? closes.at(-31) ?? null : null
  const ma5 = closes.length >= 5 ? average(closes.slice(-5)) : null
  const ma20 = closes.length >= 20 ? average(closes.slice(-20)) : null
  const ma60 = closes.length >= 60 ? average(closes.slice(-60)) : null
  const recentReturns = closes.slice(-21).map((close, index, arr) => {
    if (index === 0) return null
    return pctChange(close, arr[index - 1])
  }).filter((value) => value !== null)
  const volatility20d = recentReturns.length >= 20 ? sampleStdDev(recentReturns.slice(-20)) : null
  const volumeChangeRate = volumes.length >= 2 ? pctChange(volumes.at(-1), volumes.at(-2)) : null
  const priceVsMa20Pct = isFiniteNumber(currentClose) && isFiniteNumber(ma20) && ma20 !== 0 ? pctChange(currentClose, ma20) : null
  const ma5VsMa20Pct = isFiniteNumber(ma5) && isFiniteNumber(ma20) && ma20 !== 0 ? pctChange(ma5, ma20) : null

  return {
    current_close: currentClose,
    daily_return: pctChange(currentClose, previousClose),
    weekly_return: pctChange(currentClose, weeklyClose),
    monthly_return: pctChange(currentClose, monthlyClose),
    cumulative_return: closes.length >= 2 ? pctChange(currentClose, closes[0]) : null,
    ma5,
    ma20,
    ma60,
    volatility_20d: volatility20d,
    volume_change_rate: volumeChangeRate,
    price_vs_ma20_pct: priceVsMa20Pct,
    ma5_vs_ma20_pct: ma5VsMa20Pct,
  }
}

function detectMarketStatus(metrics) {
  const currentClose = metrics.current_close
  const directionalInputs = [metrics.weekly_return, metrics.price_vs_ma20_pct, metrics.volatility_20d]
  const missingDirectionalCount = directionalInputs.filter((value) => value === null).length

  if (!isFiniteNumber(currentClose) || currentClose <= 0) {
    return {
      signal: 'invalid_data',
      label: '데이터 오류',
      reasonText: '유효하지 않은 가격 데이터입니다.',
      reasonCodes: ['INVALID_INPUT'],
      riskReasons: [],
      volatilityLevel: 'unknown',
    }
  }

  if (missingDirectionalCount >= 2 || (metrics.daily_return !== null && missingDirectionalCount === 3)) {
    return {
      signal: 'insufficient_data',
      label: '데이터 부족',
      reasonText: '상태 판정에 필요한 시계열 지표가 부족합니다.',
      reasonCodes: ['INSUFFICIENT_METRICS'],
      riskReasons: [],
      volatilityLevel: metrics.volatility_20d === null ? 'unknown' : metrics.volatility_20d < 10 ? 'low' : metrics.volatility_20d < 25 ? 'medium' : 'high',
    }
  }

  const riskReasons = []
  const reasonCodes = []
  const dailyReturn = metrics.daily_return
  const weeklyReturn = metrics.weekly_return
  const volatility20d = metrics.volatility_20d
  const priceVsMa20Pct = metrics.price_vs_ma20_pct
  const volumeChangeRate = metrics.volume_change_rate

  if (isFiniteNumber(dailyReturn) && dailyReturn <= -3) {
    riskReasons.push('일간 낙폭이 큽니다.')
    reasonCodes.push('SHARP_DAILY_DROP')
  }
  if (isFiniteNumber(weeklyReturn) && weeklyReturn <= -7) {
    riskReasons.push('주간 하락폭이 큽니다.')
    reasonCodes.push('SHARP_WEEKLY_DROP')
  }
  if (isFiniteNumber(volatility20d) && volatility20d >= 25) {
    riskReasons.push('20일 변동성이 높습니다.')
    reasonCodes.push('HIGH_VOLATILITY')
  }
  if (isFiniteNumber(priceVsMa20Pct) && priceVsMa20Pct <= -5) {
    riskReasons.push('현재가가 20일 이동평균을 크게 밑돕니다.')
    reasonCodes.push('PRICE_WELL_BELOW_MA20')
  }
  if (isFiniteNumber(volumeChangeRate) && volumeChangeRate >= 50 && isFiniteNumber(dailyReturn) && Math.abs(dailyReturn) >= 2) {
    riskReasons.push('거래량 급증과 가격 변동이 함께 나타납니다.')
    reasonCodes.push('VOLUME_SPIKE_WITH_PRICE_SWING')
  }

  if (riskReasons.length > 0) {
    return {
      signal: 'caution',
      label: '주의',
      reasonText: '위험 신호가 감지되었습니다.',
      reasonCodes,
      riskReasons,
      volatilityLevel: volatility20d === null ? 'unknown' : volatility20d < 10 ? 'low' : volatility20d < 25 ? 'medium' : 'high',
    }
  }

  const upReasonCodes = []
  const downReasonCodes = []
  const sidewaysReasonCodes = []
  let upScore = 0
  let downScore = 0
  let sidewaysScore = 0

  if (isFiniteNumber(priceVsMa20Pct) && priceVsMa20Pct > 0) {
    upScore += 1
    upReasonCodes.push('PRICE_ABOVE_MA20')
  }
  if (isFiniteNumber(metrics.ma5_vs_ma20_pct) && metrics.ma5_vs_ma20_pct > 0) {
    upScore += 1
    upReasonCodes.push('MA5_ABOVE_MA20')
  }
  if (isFiniteNumber(weeklyReturn) && weeklyReturn > 0) {
    upScore += 1
    upReasonCodes.push('WEEKLY_RETURN_POSITIVE')
  }
  if (isFiniteNumber(dailyReturn) && dailyReturn > 0) {
    upScore += 1
    upReasonCodes.push('DAILY_RETURN_POSITIVE')
  }

  if (isFiniteNumber(priceVsMa20Pct) && priceVsMa20Pct < 0) {
    downScore += 1
    downReasonCodes.push('PRICE_BELOW_MA20')
  }
  if (isFiniteNumber(metrics.ma5_vs_ma20_pct) && metrics.ma5_vs_ma20_pct < 0) {
    downScore += 1
    downReasonCodes.push('MA5_BELOW_MA20')
  }
  if (isFiniteNumber(weeklyReturn) && weeklyReturn < 0) {
    downScore += 1
    downReasonCodes.push('WEEKLY_RETURN_NEGATIVE')
  }
  if (isFiniteNumber(dailyReturn) && dailyReturn < 0) {
    downScore += 1
    downReasonCodes.push('DAILY_RETURN_NEGATIVE')
  }

  if (isFiniteNumber(priceVsMa20Pct) && Math.abs(priceVsMa20Pct) < 0.5) {
    sidewaysScore += 1
    sidewaysReasonCodes.push('PRICE_NEAR_MA20')
  }
  if (isFiniteNumber(metrics.ma5_vs_ma20_pct) && Math.abs(metrics.ma5_vs_ma20_pct) < 0.5) {
    sidewaysScore += 1
    sidewaysReasonCodes.push('MA5_NEAR_MA20')
  }
  if (isFiniteNumber(weeklyReturn) && Math.abs(weeklyReturn) < 3) {
    sidewaysScore += 1
    sidewaysReasonCodes.push('WEEKLY_RETURN_NEUTRAL')
  }

  if (upScore >= 3 && upScore > downScore && upScore > sidewaysScore) {
    return {
      signal: 'up',
      label: '상승',
      reasonText: '단기와 중기 흐름이 모두 상승 우위입니다.',
      reasonCodes: upReasonCodes,
      riskReasons: [],
      volatilityLevel: volatility20d === null ? 'unknown' : volatility20d < 10 ? 'low' : volatility20d < 25 ? 'medium' : 'high',
    }
  }

  if (downScore >= 3 && downScore > upScore && downScore > sidewaysScore) {
    return {
      signal: 'down',
      label: '하락',
      reasonText: '단기와 중기 흐름이 모두 하락 우위입니다.',
      reasonCodes: downReasonCodes,
      riskReasons: [],
      volatilityLevel: volatility20d === null ? 'unknown' : volatility20d < 10 ? 'low' : volatility20d < 25 ? 'medium' : 'high',
    }
  }

  if (sidewaysScore >= 2) {
    return {
      signal: 'sideways',
      label: '횡보',
      reasonText: '이동평균과 주간 흐름이 엇갈려 횡보로 봤습니다.',
      reasonCodes: sidewaysReasonCodes,
      riskReasons: [],
      volatilityLevel: volatility20d === null ? 'unknown' : volatility20d < 10 ? 'low' : volatility20d < 25 ? 'medium' : 'high',
    }
  }

  return {
    signal: 'sideways',
    label: '횡보',
    reasonText: '방향성이 뚜렷하지 않습니다.',
    reasonCodes: sidewaysReasonCodes,
    riskReasons: [],
    volatilityLevel: volatility20d === null ? 'unknown' : volatility20d < 10 ? 'low' : volatility20d < 25 ? 'medium' : 'high',
  }
}

function createIndicatorPayload(spec, quote) {
  const change = Number(quote.regularMarketChange)
  const changePercent = Number(quote.regularMarketChangePercent)
  const price = Number(quote.regularMarketPrice)

  return {
    label: spec.label,
    symbol: spec.symbol,
    value: isFiniteNumber(price) ? formatPrice(price, spec.currency) : 'N/A',
    change: isFiniteNumber(change) ? formatSignedPrice(change, spec.currency) : 'N/A',
    pct: isFiniteNumber(changePercent) ? formatPercent(changePercent) : 'N/A',
    up: isFiniteNumber(change) ? change >= 0 : true,
    series: makeSeriesFromMovement(isFiniteNumber(changePercent) ? changePercent : 0),
  }
}

function createWatchItemPayload(spec, quote) {
  const change = Number(quote.regularMarketChange)
  const changePercent = Number(quote.regularMarketChangePercent)
  const price = Number(quote.regularMarketPrice)

  return {
    name: spec.name,
    symbol: spec.symbol,
    price: isFiniteNumber(price) ? formatPrice(price, spec.currency) : 'N/A',
    chg: isFiniteNumber(changePercent) ? formatPercent(changePercent) : 'N/A',
    up: isFiniteNumber(change) ? change >= 0 : true,
    series: makeSeriesFromMovement(isFiniteNumber(changePercent) ? changePercent : 0),
  }
}

async function fetchQuote(spec) {
  const quote = await yf.quote(spec.symbol)
  return { spec, quote }
}

async function main() {
  const mainChartSpec = { name: '삼성전자', symbol: '005930.KS', currency: 'KRW' }
  const indicatorQuotes = await Promise.all(indicatorSpecs.map(fetchQuote))
  const watchlistQuotes = await Promise.all(watchlistSpecs.map(fetchQuote))
  const chartQuotes = sanitizeQuotes(
    await yf.historical(mainChartSpec.symbol, {
      period1: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      period2: new Date(),
      interval: '1d',
    }),
  )
  const mainQuote = await yf.quote(mainChartSpec.symbol)

  const metrics = calculateCoreMetrics(chartQuotes)
  const marketStatus = detectMarketStatus(metrics)

  const currentClose = Number(mainQuote.regularMarketPrice)
  const regularChange = Number(mainQuote.regularMarketChange)
  const regularChangePercent = Number(mainQuote.regularMarketChangePercent)
  const volume = Number(mainQuote.regularMarketVolume ?? chartQuotes.at(-1)?.volume)
  const marketCap = Number(mainQuote.marketCap)
  const trailingPE = Number(mainQuote.trailingPE)
  const weekRangeLow = Number(mainQuote.fiftyTwoWeekLow ?? mainQuote.fiftyTwoWeekRange?.low)
  const weekRangeHigh = Number(mainQuote.fiftyTwoWeekHigh ?? mainQuote.fiftyTwoWeekRange?.high)

  const payload = {
    generatedAt: new Date().toISOString(),
    generatedAtLabel: DATE_FORMATTER.format(new Date()),
    marketStatus,
    indicators: indicatorQuotes.map(({ spec, quote }) => createIndicatorPayload(spec, quote)),
    chart: {
      symbol: mainChartSpec.symbol,
      name: mainChartSpec.name,
      currency: mainChartSpec.currency,
      price: isFiniteNumber(currentClose) ? formatPrice(currentClose, mainChartSpec.currency) : 'N/A',
      change: isFiniteNumber(regularChange) ? formatSignedPrice(regularChange, mainChartSpec.currency) : 'N/A',
      percent: isFiniteNumber(regularChangePercent) ? formatPercent(regularChangePercent) : 'N/A',
      series: chartQuotes.map((quote) => quote.close),
      stats: [
        { label: '거래량', value: isFiniteNumber(volume) ? formatVolume(volume) : 'N/A' },
        { label: '시가총액', value: isFiniteNumber(marketCap) ? formatKoreanMarketCap(marketCap) : 'N/A' },
        { label: 'PER', value: isFiniteNumber(trailingPE) ? `${trailingPE.toFixed(1)}x` : 'N/A' },
        { label: '52주 변동', value: formatRange(weekRangeLow, weekRangeHigh, mainChartSpec.currency) },
      ],
      note: marketStatus.reasonText,
      metrics,
    },
    watchlist: watchlistQuotes.map(({ spec, quote }) => createWatchItemPayload(spec, quote)),
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
