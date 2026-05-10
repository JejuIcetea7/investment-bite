import type { WatchItem } from '../types'
import Sparkline from '../components/Sparkline'

export default function WholePage({
  watchlist,
  selectedSymbol,
  onSelect,
}: {
  watchlist: WatchItem[]
  selectedSymbol: string | null
  onSelect: (item: WatchItem | null) => void
}) {
  return (
    <section className="whole-panel card" data-tour="whole-page">
      <div className="whole-panel-head">
        <div>
          <div className="card-num"><span className="card-num-dot">1</span> 전체 종목</div>
          <div className="whole-panel-title">Yahoo Finance 종목 차트 페이지</div>
          <div className="whole-panel-sub">실시간 갱신된 Yahoo Finance 시세를 바탕으로 여러 종목의 흐름을 비교해 볼 수 있어요.</div>
        </div>
        <div className="whole-panel-badge">{watchlist.length} stocks · live snapshot</div>
      </div>
      <div className="whole-panel-grid">
        {watchlist.map((item) => {
          const isSelected = selectedSymbol === item.symbol
          return (
            <button
              key={item.symbol}
              className={`whole-stock-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(isSelected ? null : item)}
            >
              <div className="whole-stock-top">
                <div>
                  <div className="whole-stock-name">{item.name}</div>
                  <div className="whole-stock-symbol">{item.symbol}</div>
                </div>
                <div className={`whole-stock-chip ${item.up ? 'up' : 'down'}`}>
                  {item.up ? '▲' : '▼'} {item.chg}
                </div>
              </div>
              <div className="whole-stock-price-row">
                <div className="whole-stock-price">{item.price}</div>
                <div className="whole-stock-label">Yahoo Finance chart</div>
              </div>
              <div className="whole-stock-chart">
                <Sparkline data={item.series} />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
