import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Period = '1D' | '1W' | '1M' | '전체'
const VALID_PERIODS = new Set<string>(['1D', '1W', '1M', '전체'])

function periodConfig(period: Period, now: Date): { interval: string; period1: Date } {
  switch (period) {
    case '1D':   return { interval: '5m',  period1: new Date(now.getTime() - 2  * 86400000) }
    case '1W':   return { interval: '1h',  period1: new Date(now.getTime() - 7  * 86400000) }
    case '1M':   return { interval: '1d',  period1: new Date(now.getTime() - 31 * 86400000) }
    case '전체': return { interval: '1d',  period1: new Date(now.getTime() - 365 * 86400000) }
  }
}

async function fetchYahooChart(symbol: string, period: Period): Promise<number[]> {
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
  const closes: (number | null)[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
  return closes.filter((v): v is number => v !== null && Number.isFinite(v))
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

    const series = await fetchYahooChart(symbol, period as Period)
    return new Response(JSON.stringify({ series }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
