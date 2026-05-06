import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

// Lazy singleton — instantiated once on first request
let _yf: Awaited<ReturnType<typeof createYF>> | null = null

async function createYF() {
  const { default: YahooFinance } = await import('yahoo-finance2')
  return new (YahooFinance as new (opts: object) => {
    chart: (symbol: string, opts: object) => Promise<{ quotes: Array<{ close: number | null }> }>
  })({ suppressNotices: ['yahooSurvey', 'ripHistorical'] })
}

async function getYF() {
  if (!_yf) _yf = await createYF()
  return _yf
}

type Period = '1D' | '1W' | '1M' | '전체'

function periodConfig(period: Period, now: Date): { interval: string; period1: Date } {
  switch (period) {
    case '1D':
      return { interval: '5m', period1: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }
    case '1W':
      return { interval: '1h', period1: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
    case '1M':
      return { interval: '1d', period1: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000) }
    case '전체':
      return { interval: '1d', period1: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
    default: {
      const _: never = period
      throw new Error(`Unknown period: ${_}`)
    }
  }
}

const VALID_PERIODS = new Set<string>(['1D', '1W', '1M', '전체'])

function yahooChartApiPlugin(): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ?? ''
    if (!url.startsWith('/api/chart/')) return next()

    const parts = url.slice('/api/chart/'.length).split('?')[0].split('/')
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Usage: /api/chart/:symbol/:period' }))
      return
    }

    const symbol = decodeURIComponent(parts[0])
    const period = decodeURIComponent(parts[1])

    if (!VALID_PERIODS.has(period)) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: `Unknown period: ${period}` }))
      return
    }

    try {
      const yf = await getYF()
      const now = new Date()
      const { interval, period1 } = periodConfig(period as Period, now)

      const result = await yf.chart(symbol, { period1, period2: now, interval })

      const series = result.quotes
        .filter((q) => q.close != null && Number.isFinite(q.close))
        .map((q) => q.close as number)

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ series }))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[yahoo-chart-api]', message)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: message }))
    }
  }

  return {
    name: 'yahoo-chart-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => { void handler(req, res, next) })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => { void handler(req, res, next) })
    },
  }
}

export default defineConfig({
  plugins: [react(), yahooChartApiPlugin()],
})
