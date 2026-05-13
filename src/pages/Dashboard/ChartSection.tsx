import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ChartData, MarketStatus, HoverHelp, MarketStat } from '../../types'
import { STAT_HELP } from '../../constants'
import ChartArea from '../../components/ChartArea'
import { edgeFunctionUrl, edgeFunctionHeaders, hasSupabaseConfig } from '../../lib/supabase'

export default function ChartSection({
  displayChart,
  marketStatus,
  usdKrwRate,
  beginner,
  setHoverHelp,
}: {
  displayChart: ChartData
  marketStatus: MarketStatus
  usdKrwRate: number | null
  beginner: boolean
  setHoverHelp: Dispatch<SetStateAction<HoverHelp | null>>
}) {
  const [chartTab, setChartTab] = useState<'1D' | '1W' | '1M' | '전체'>('1D')
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)
  const [whyData, setWhyData] = useState<{ tag: string; title: string; summary: string; bullets: string[] } | null>(null)
  const [whyLoading, setWhyLoading] = useState(false)
  const [chartSeries, setChartSeries] = useState<number[] | null>(null)
  const [chartLabels, setChartLabels] = useState<string[] | null>(null)
  const [chartSessionLabel, setChartSessionLabel] = useState<string | null>(null)
  const [chartStats, setChartStats] = useState<MarketStat[] | null>(null)
  const [chartLoading, setChartLoading] = useState(false)
  const [showKrw, setShowKrw] = useState(false)
  const whyCacheSymbol = useRef<string | null>(null)

  const handleWhyClick = async () => {
    const next = !whyOpen
    setWhyOpen(next)
    if (!next) return
    if (whyCacheSymbol.current === displayChart.symbol && whyData) return
    if (!hasSupabaseConfig) return

    setWhyLoading(true)
    try {
      const url = new URL(edgeFunctionUrl('llm-why'))
      url.searchParams.set('symbol', displayChart.symbol)
      url.searchParams.set('name', displayChart.name)
      url.searchParams.set('percent', displayChart.percent)
      const res = await fetch(url.toString(), { headers: edgeFunctionHeaders() })
      const data = await res.json()
      if (!data.error) {
        setWhyData(data)
        whyCacheSymbol.current = displayChart.symbol
      }
    } catch {
      // 실패해도 팝업은 열린 채로 유지
    } finally {
      setWhyLoading(false)
    }
  }

  const handleAnalysisClick = () => {
    setAnalysisOpen((value) => !value)
  }

  useEffect(() => {
    setAnalysisOpen(false)
    setWhyOpen(false)
  }, [displayChart.symbol])

  useEffect(() => {
    const controller = new AbortController()
    if (!hasSupabaseConfig) {
      setChartSeries(null)
      setChartLabels(null)
      setChartSessionLabel(null)
      setChartLoading(false)
      return () => controller.abort()
    }

    setChartLoading(true)
    setChartStats(null)
    setChartLabels(null)
    setChartSessionLabel(null)
    const url = new URL(edgeFunctionUrl('get-chart-v2'))
    url.searchParams.set('symbol', displayChart.symbol)
    url.searchParams.set('period', chartTab)
    fetch(url.toString(), {
      headers: edgeFunctionHeaders(),
      signal: controller.signal,
    })
      .then((r) => r.json() as Promise<{ series?: number[]; labels?: string[]; stats?: MarketStat[]; sessionLabel?: string }>)
      .then((data) => {
        if (data.series && data.series.length > 0) setChartSeries(data.series)
        if (data.labels && data.labels.length > 0) setChartLabels(data.labels)
        setChartSessionLabel(data.sessionLabel ?? null)
        if (data.stats && data.stats.length > 0) setChartStats(data.stats)
      })
      .catch(() => {})
      .finally(() => setChartLoading(false))
    return () => controller.abort()
  }, [chartTab, displayChart.symbol])

  const displayedSeries = chartSeries ?? displayChart.series
  const displayedLabels = chartLabels ?? []
  const displayedStats = chartStats ?? displayChart.stats
  const isUpForPeriod = displayedSeries.length > 1 && displayedSeries[displayedSeries.length - 1] > displayedSeries[0]
  const canConvertToKrw = displayChart.currency === 'USD' && usdKrwRate !== null

  useEffect(() => {
    if (!canConvertToKrw) setShowKrw(false)
  }, [canConvertToKrw, displayChart.symbol])

  // 필터 기간 기준 변화율 계산
  const calculatePeriodChange = () => {
    if (displayedSeries.length < 2) {
      return { change: displayChart.change, percent: displayChart.percent }
    }
    const firstPrice = displayedSeries[0]
    const lastPrice = displayedSeries[displayedSeries.length - 1]
    const changeDiff = lastPrice - firstPrice
    const changePercent = ((changeDiff / firstPrice) * 100).toFixed(2)
    const changeStr = changeDiff >= 0 ? `+${changeDiff.toFixed(0)}` : `${changeDiff.toFixed(0)}`
    const percentStr = changeDiff >= 0 ? `+${changePercent}%` : `${changePercent}%`
    return { change: changeStr, percent: percentStr }
  }

  const periodChange = calculatePeriodChange()
  const displayCurrency = showKrw && canConvertToKrw ? 'KRW' : displayChart.currency
  const priceNumber = parseNumericValue(displayChart.price)
  const changeNumber = parseNumericValue(periodChange.change)
  const convertedPrice = showKrw && canConvertToKrw && priceNumber !== null ? priceNumber * usdKrwRate : null
  const convertedChange = showKrw && canConvertToKrw && changeNumber !== null ? changeNumber * usdKrwRate : null
  const displayPrice = convertedPrice !== null ? formatKrwValue(convertedPrice) : displayChart.price
  const displayChange = convertedChange !== null ? formatSignedKrwValue(convertedChange) : periodChange.change
  const coreMetrics = useMemo(() => calculateCoreMetrics(displayedSeries), [displayedSeries])

  const getPeriodLabel = () => {
    switch (chartTab) {
      case '1D':
        return '오늘'
      case '1W':
        return '1주'
      case '1M':
        return '1개월'
      case '전체':
        return '전체'
      default:
        return ''
    }
  }

  const [hoveredData, setHoveredData] = useState<{ index: number; price: number; date: string; xRatio: number; yRatio: number } | null>(null)

  const generateDateLabel = (index: number) => {
    if (displayedLabels[index]) return displayedLabels[index]
    const now = new Date()
    let date: Date

    switch (chartTab) {
      case '1D':
        date = new Date(now.getTime() - (displayedSeries.length - 1 - index) * 24 * 60 * 1000)
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      case '1W':
        date = new Date(now.getTime() - (displayedSeries.length - 1 - index) * 2.4 * 60 * 60 * 1000)
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}시`
      case '1M':
        date = new Date(now.getTime() - (displayedSeries.length - 1 - index) * 2 * 24 * 60 * 60 * 1000)
        return `${date.getMonth() + 1}/${date.getDate()}`
      case '전체':
        date = new Date(now.getTime() - (displayedSeries.length - 1 - index) * 30 * 24 * 60 * 60 * 1000)
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
      default:
        return ''
    }
  }

  const formatPrice = (price: number) => {
    if (showKrw && canConvertToKrw) return formatKrwValue(price * usdKrwRate)
    return displayChart.currency === 'USD'
      ? price.toLocaleString('en-US', { maximumFractionDigits: 2 })
      : Math.round(price).toLocaleString('ko-KR')
  }

  const handleChartHover = (index: number | null, xRatio: number, yRatio: number) => {
    if (index !== null) {
      const normalizedValue = displayedSeries[index]
      setHoveredData({
        index,
        price: normalizedValue,
        date: generateDateLabel(index),
        xRatio,
        yRatio,
      })
    } else {
      setHoveredData(null)
    }
  }

  return (
    <section className={`card chart-card chart-flip-card ${analysisOpen ? 'flipped' : ''}`} data-tour="chart">
      <div className="chart-flip-inner">
        <div className="chart-face chart-face-front">
          <div className="card-head">
            <div className="card-head-left">
              <div className="card-num"><span className="card-num-dot">1</span>내가 보고있는 종목</div>
              {beginner && <div className="card-sub">{displayChart.note}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <button className="why-btn" onClick={handleWhyClick}>
                      <span className="q">?</span> Why?
                    </button>
                    <div className={`why-pop ${whyOpen ? 'show' : ''}`}>
                      {whyLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div className="why-skeleton-line" style={{ width: 64, height: 18, borderRadius: 99 }} />
                          <div className="why-skeleton-line" style={{ width: '80%', height: 16 }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                            <div className="why-skeleton-line" style={{ width: '100%', height: 13 }} />
                            <div className="why-skeleton-line" style={{ width: '90%', height: 13 }} />
                            <div className="why-skeleton-line" style={{ width: '70%', height: 13 }} />
                          </div>
                        </div>
                      ) : whyData ? (
                        <>
                          <span className="why-pop-tag">{whyData.tag}</span>
                          <div className="why-pop-title">{whyData.title}</div>
                          <div className="why-pop-text">{whyData.summary}</div>
                          {whyData.bullets.length > 0 && (
                            <div className="why-pop-list">
                              {whyData.bullets.map((b) => (
                                <div key={b} className="why-pop-li">{b}</div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>데이터를 불러올 수 없습니다.</div>
                      )}
                    </div>
                  </div>
                  <div className="chart-tabs">
                    {(['1D', '1W', '1M', '전체'] as const).map((tab) => (
                      <button
                        key={tab}
                        className={`chart-tab ${tab === chartTab ? 'active' : ''}`}
                        onClick={() => {
                          if (tab === chartTab) return
                          setChartLoading(true)
                          setChartTab(tab)
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button className="chart-analysis-btn" type="button" onClick={handleAnalysisClick}>
            {displayChart.name} 차트분석
          </button>
      <div className="chart-stock-row">
        <div>
          <div className="chart-symbol">{displayChart.symbol} · {displayChart.currency === 'KRW' ? 'KOSPI' : 'NASDAQ'}</div>
          <div className="chart-name">{displayChart.name}</div>
          {canConvertToKrw && (
            <button
              className={`currency-toggle ${showKrw ? 'active' : ''}`}
              type="button"
              onClick={() => setShowKrw((value) => !value)}
            >
              원화로 보기
            </button>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="chart-price">{displayPrice} <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>{displayCurrency}</span></div>
          <div className="chart-delta">{displayChange} ({periodChange.percent}) {periodChange.percent.startsWith('-') ? '▼' : '▲'} {getPeriodLabel()}</div>
          {showKrw && canConvertToKrw && <div className="currency-rate">환율 {usdKrwRate.toLocaleString('ko-KR')}원 기준</div>}
        </div>
      </div>
      {chartSessionLabel && <div className="chart-session-label">{chartSessionLabel}</div>}
      <div className="chart-area" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ position: 'relative', flex: 1, minHeight: 200 }}>
          <ChartArea data={displayedSeries} isUp={isUpForPeriod} onHover={handleChartHover} />
          {hoveredData && (
            <div
              style={{
                position: 'absolute',
                top: `${hoveredData.yRatio * 100}%`,
                left: `${hoveredData.xRatio * 100}%`,
                transform: 'translate(-50%, calc(-100% - 10px))',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: 4,
                padding: '8px 12px',
                fontSize: 12,
                zIndex: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                pointerEvents: 'none',
              }}
            >
              <div style={{ color: '#666', marginBottom: 4 }}>{hoveredData.date}</div>
              <div style={{ fontWeight: 600, color: isUpForPeriod ? '#dc2626' : '#1d4ed8' }}>
                {showKrw && canConvertToKrw ? '₩' : displayChart.currency === 'USD' ? '$' : '₩'}{formatPrice(hoveredData.price)}
              </div>
            </div>
          )}
        </div>
        {/* 시간 축 라벨 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 6px 0 6px',
            fontSize: 11,
            color: '#999',
            minHeight: 24,
          }}
        >
          {[0, Math.floor(displayedSeries.length / 3), Math.floor((displayedSeries.length * 2) / 3), displayedSeries.length - 1].map((idx) => (
            <span key={idx}>{generateDateLabel(idx)}</span>
          ))}
        </div>
        {chartLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>불러오는 중…</span>
          </div>
        )}
      </div>
      <div className="chart-stats">
        {displayedStats.map((stat) => (
          <div
            key={stat.label}
            className={`chart-stat ${beginner && STAT_HELP[stat.label] ? 'has-help' : ''}`}
            onMouseEnter={beginner && STAT_HELP[stat.label] ? (e) => setHoverHelp({ title: STAT_HELP[stat.label].title, text: STAT_HELP[stat.label].text, x: e.clientX + 16, y: e.clientY + 16 }) : undefined}
            onMouseMove={beginner && STAT_HELP[stat.label] ? (e) => setHoverHelp((prev) => prev ? { ...prev, x: e.clientX + 16, y: e.clientY + 16 } : prev) : undefined}
            onMouseLeave={beginner && STAT_HELP[stat.label] ? () => setHoverHelp(null) : undefined}
            style={{ cursor: beginner && STAT_HELP[stat.label] ? 'help' : 'default' }}
          >
            <div className="chart-stat-label">
              {stat.label}
              {beginner && STAT_HELP[stat.label] && <span className="stat-info-dot">i</span>}
            </div>
            <div className="chart-stat-value">{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="glossary-mini">
        {marketStatus.reasonText}
        {marketStatus.riskReasons.length > 0 ? ` · ${marketStatus.riskReasons.join(' / ')}` : ''}
      </div>
        </div>
        <div className="chart-face chart-face-back">
          <div className="analysis-back-head">
            <div>
              <div className="card-num"><span className="card-num-dot">M</span>핵심 지표</div>
              <div className="analysis-back-title">{displayChart.name} 차트분석</div>
            </div>
            <button className="analysis-close-btn" type="button" onClick={() => setAnalysisOpen(false)}>돌아가기</button>
          </div>
          <div className="analysis-result">
            <div className="analysis-headline">{coreMetrics.headline}</div>
            <div className="analysis-summary">{coreMetrics.summary}</div>
            <div className="analysis-metric-grid">
              {coreMetrics.rows.map((row) => (
                <div key={row.label} className="analysis-metric">
                  <div className="analysis-metric-label">{row.label}</div>
                  <div className={`analysis-metric-value ${row.tone ?? ''}`}>{row.value}</div>
                  <div className="analysis-metric-note">{row.note}</div>
                </div>
              ))}
            </div>
            {coreMetrics.missing.length > 0 && (
              <div className="analysis-limit">
                계산 제한: {coreMetrics.missing.join(', ')}은 현재 차트 데이터 길이로 계산하지 않습니다.
              </div>
            )}
            <div className="analysis-disclaimer">이 분석은 차트에 표시된 가격 시계열만 기준으로 계산한 참고 정보입니다.</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function parseNumericValue(value: string): number | null {
  const normalized = value.replace(/[^\d.-]/g, '')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function formatKrwValue(value: number) {
  return Math.round(value).toLocaleString('ko-KR')
}

function formatSignedKrwValue(value: number) {
  const prefix = value >= 0 ? '+' : '-'
  return `${prefix}${formatKrwValue(Math.abs(value))}`
}

function calculateCoreMetrics(series: number[]) {
  const values = series.filter((value) => Number.isFinite(value) && value > 0)
  const current = values.at(-1) ?? null
  const previous = values.at(-2) ?? null
  const missing: string[] = []
  const percent = (now: number | null, before: number | null) => {
    if (now === null || before === null || before === 0) return null
    return ((now - before) / before) * 100
  }
  const average = (slice: number[]) => slice.reduce((sum, value) => sum + value, 0) / slice.length
  const formatPct = (value: number | null) => value === null ? '계산 불가' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  const formatNumber = (value: number | null) => value === null ? '계산 불가' : value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
  const tone = (value: number | null) => value === null ? 'muted' : value > 0 ? 'up' : value < 0 ? 'down' : 'muted'

  const dailyReturn = percent(current, previous)
  const weeklyReturn = values.length >= 8 ? percent(current, values.at(-8) ?? null) : null
  const monthlyReturn = values.length >= 31 ? percent(current, values.at(-31) ?? null) : null
  const cumulativeReturn = values.length >= 2 ? percent(current, values[0]) : null
  const ma5 = values.length >= 5 ? average(values.slice(-5)) : null
  const ma20 = values.length >= 20 ? average(values.slice(-20)) : null
  const ma60 = values.length >= 60 ? average(values.slice(-60)) : null
  const priceVsMa20 = ma20 !== null ? percent(current, ma20) : null
  const ma5VsMa20 = ma5 !== null && ma20 !== null ? percent(ma5, ma20) : null

  const returns20 = values.length >= 21
    ? values.slice(-21).map((value, index, array) => index === 0 ? null : percent(value, array[index - 1])).filter((value): value is number => value !== null)
    : []
  const volatility20 = returns20.length >= 20
    ? Math.sqrt(returns20.reduce((sum, value) => {
      const mean = average(returns20)
      return sum + (value - mean) ** 2
    }, 0) / (returns20.length - 1))
    : null

  if (weeklyReturn === null) missing.push('주간 수익률')
  if (monthlyReturn === null) missing.push('월간 수익률')
  if (ma20 === null) missing.push('20기간 이동평균')
  if (ma60 === null) missing.push('60기간 이동평균')
  if (volatility20 === null) missing.push('20기간 변동성')

  const direction = cumulativeReturn === null ? '데이터 확인 중' : cumulativeReturn > 0 ? '누적 상승 흐름' : cumulativeReturn < 0 ? '누적 하락 흐름' : '보합권'
  const summary = priceVsMa20 !== null
    ? `현재 가격은 20기간 평균보다 약 ${Math.abs(priceVsMa20).toFixed(1)}% ${priceVsMa20 >= 0 ? '높은' : '낮은'} 수준입니다.`
    : '현재 차트 데이터만으로는 20기간 평균선 비교가 제한됩니다.'

  return {
    headline: direction,
    summary,
    missing,
    rows: [
      { label: '현재 가격', value: formatNumber(current), note: '지금 차트에서 가장 마지막에 찍힌 가격이에요.', tone: 'muted' },
      { label: '1기간 수익률', value: formatPct(dailyReturn), note: '바로 전 가격보다 얼마나 올랐거나 내렸는지 보여줘요.', tone: tone(dailyReturn) },
      { label: '7기간 수익률', value: formatPct(weeklyReturn), note: '최근 일주일 정도의 짧은 흐름을 볼 때 참고해요.', tone: tone(weeklyReturn) },
      { label: '30기간 수익률', value: formatPct(monthlyReturn), note: '최근 한 달 정도의 방향을 크게 확인할 때 써요.', tone: tone(monthlyReturn) },
      { label: '누적 수익률', value: formatPct(cumulativeReturn), note: '선택한 기간 처음부터 지금까지의 전체 변화예요.', tone: tone(cumulativeReturn) },
      { label: '5기간 평균', value: formatNumber(ma5), note: '최근 가격 몇 개를 평균낸 값이라 짧은 분위기를 보여줘요.', tone: 'muted' },
      { label: '20기간 평균', value: formatNumber(ma20), note: '조금 더 긴 흐름의 기준선처럼 볼 수 있어요.', tone: 'muted' },
      { label: '현재가 vs 20평균', value: formatPct(priceVsMa20), note: '현재 가격이 기준선보다 위인지 아래인지 알려줘요.', tone: tone(priceVsMa20) },
      { label: '5평균 vs 20평균', value: formatPct(ma5VsMa20), note: '짧은 흐름이 긴 흐름보다 강한지 비교해요.', tone: tone(ma5VsMa20) },
      { label: '20기간 변동성', value: formatPct(volatility20), note: '값이 높을수록 가격이 더 크게 흔들렸다는 뜻이에요.', tone: volatility20 === null ? 'muted' : volatility20 >= 25 ? 'down' : volatility20 >= 10 ? 'warn' : 'up' },
    ],
  }
}
