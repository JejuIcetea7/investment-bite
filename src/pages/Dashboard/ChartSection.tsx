import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ChartData, MarketStatus, HoverHelp } from '../../types'
import { STAT_HELP } from '../../constants'
import ChartArea from '../../components/ChartArea'

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
    fetch(`/api/chart/${encodeURIComponent(displayChart.symbol)}/${encodeURIComponent(chartTab)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json() as Promise<{ series?: number[] }>)
      .then((data) => { if (data.series && data.series.length > 0) setChartSeries(data.series) })
      .catch(() => {})
      .finally(() => setChartLoading(false))
    return () => controller.abort()
  }, [chartTab, displayChart.symbol])

  const displayedSeries = chartSeries ?? displayChart.series

  return (
    <section className="card chart-card" data-tour="chart">
      <div className="card-head">
        <div className="card-head-left">
          <div className="card-num"><span className="card-num-dot">2</span> 내가 보고있는 종목</div>
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
          <div className="chart-delta">{displayChart.change} ({displayChart.percent}) {displayChart.percent.startsWith('-') ? '▼' : '▲'} 오늘</div>
        </div>
      </div>
      <div className="chart-area" style={{ position: 'relative' }}>
        <ChartArea data={displayedSeries} />
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
