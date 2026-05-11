import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ChartData, MarketStatus, HoverHelp } from '../../types'
import { STAT_HELP } from '../../constants'
import ChartArea from '../../components/ChartArea'
import { edgeFunctionUrl, edgeFunctionHeaders } from '../../lib/supabase'

export default function ChartSection({
  displayChart,
  marketStatus,
  dataSource,
  beginner,
  setHoverHelp,
}: {
  displayChart: ChartData
  marketStatus: MarketStatus
  dataSource: string
  beginner: boolean
  setHoverHelp: Dispatch<SetStateAction<HoverHelp | null>>
}) {
  const [chartTab, setChartTab] = useState<'1D' | '1W' | '1M' | '전체'>('1D')
  const [whyOpen, setWhyOpen] = useState(false)
  const [chartSeries, setChartSeries] = useState<number[] | null>(null)
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setChartLoading(true)
    const url = new URL(edgeFunctionUrl('get-chart'))
    url.searchParams.set('symbol', displayChart.symbol)
    url.searchParams.set('period', chartTab)
    fetch(url.toString(), {
      headers: edgeFunctionHeaders(),
      signal: controller.signal,
    })
      .then((r) => r.json() as Promise<{ series?: number[] }>)
      .then((data) => { if (data.series && data.series.length > 0) setChartSeries(data.series) })
      .catch(() => {})
      .finally(() => setChartLoading(false))
    return () => controller.abort()
  }, [chartTab, displayChart.symbol])

  const displayedSeries = chartSeries ?? displayChart.series
  const isUpForPeriod = displayedSeries.length > 1 && displayedSeries[displayedSeries.length - 1] > displayedSeries[0]

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

  const [hoveredData, setHoveredData] = useState<{ index: number; price: number; date: string; clientX: number; clientY: number } | null>(null)

  const generateDateLabel = (index: number) => {
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
    return Math.round(price).toLocaleString('ko-KR')
  }

  const handleChartHover = (index: number | null, clientX: number, clientY: number) => {
    if (index !== null) {
      const normalizedValue = displayedSeries[index]
      setHoveredData({
        index,
        price: normalizedValue,
        date: generateDateLabel(index),
        clientX,
        clientY,
      })
    } else {
      setHoveredData(null)
    }
  }

  return (
    <section className="card chart-card" data-tour="chart">
      <div className="card-head">
        <div className="card-head-left">
          <div className="card-num"><span className="card-num-dot">1</span>내가 보고있는 종목</div>
          <div className="card-title">{displayChart.name} 차트 분석</div>
          {beginner && <div className="card-sub">{displayChart.note}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button className="why-btn" onClick={() => setWhyOpen((v) => !v)}>
                <span className="q">?</span> Why?
              </button>
              <div className={`why-pop ${whyOpen ? 'show' : ''}`}>
                <span className="why-pop-tag">왜 올랐을까?</span>
                <div className="why-pop-title">{displayChart.name} {displayChart.percent} 상승</div>
                <div className="why-pop-text">HBM3E 양산 본격화 소식과 외국계 IB의 목표가 상향이 동시에 작용했습니다.</div>
                <div className="why-pop-list">
                  <div className="why-pop-li">HBM3E 12단 적층 양산 발표</div>
                  <div className="why-pop-li">모건스탠리 목표가 95,000원 → 105,000원</div>
                  <div className="why-pop-li">외국인 5거래일 연속 순매수</div>
                </div>
              </div>
            </div>
            <div className="chart-tabs">
              {(['1D', '1W', '1M', '전체'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`chart-tab ${tab === chartTab ? 'active' : ''}`}
                  onClick={() => { setChartLoading(true); setChartTab(tab) }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <span className="quiz-tag">{marketStatus.label}</span>
          <span className="card-action">{dataSource}</span>
        </div>
      </div>
      <div className="chart-stock-row">
        <div>
          <div className="chart-symbol">{displayChart.symbol} · {displayChart.currency === 'KRW' ? 'KOSPI' : 'NASDAQ'}</div>
          <div className="chart-name">{displayChart.name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="chart-price">{displayChart.price} <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>{displayChart.currency}</span></div>
          <div className="chart-delta">{periodChange.change} ({periodChange.percent}) {periodChange.percent.startsWith('-') ? '▼' : '▲'} {getPeriodLabel()}</div>
        </div>
      </div>
      <div className="chart-area" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ position: 'relative', flex: 1, minHeight: 200 }}>
          <ChartArea data={displayedSeries} isUp={isUpForPeriod} onHover={handleChartHover} />
          {hoveredData && (
            <div
              style={{
                position: 'fixed',
                top: `${hoveredData.clientY + 16}px`,
                left: `${hoveredData.clientX + 16}px`,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: 4,
                padding: '8px 12px',
                fontSize: 12,
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                pointerEvents: 'none',
              }}
            >
              <div style={{ color: '#666', marginBottom: 4 }}>{hoveredData.date}</div>
              <div style={{ fontWeight: 600, color: isUpForPeriod ? '#dc2626' : '#1d4ed8' }}>
                ₩{formatPrice(hoveredData.price)}
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
        {displayChart.stats.map((stat) => (
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
    </section>
  )
}
