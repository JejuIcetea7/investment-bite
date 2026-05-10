import type { WatchItem, DashboardWidgetKey } from '../../types'
import Sparkline from '../../components/Sparkline'
import EditableWidgetShell from '../../components/EditableWidgetShell'

export default function WatchlistSection({
  watchlist,
  selectedWatchItem,
  beginner,
  hiddenWidgets,
  editMode,
  onSelect,
  onToggle,
}: {
  watchlist: WatchItem[]
  selectedWatchItem: WatchItem | null
  beginner: boolean
  hiddenWidgets: DashboardWidgetKey[]
  editMode: boolean
  onSelect: (item: WatchItem | null) => void
  onToggle: () => void
}) {
  return (
    <EditableWidgetShell widgetKey="watch" visible={!hiddenWidgets.includes('watch')} editMode={editMode} onToggle={onToggle}>
      <section className="card" data-tour="watch">
        <div className="card-head">
          <div className="card-head-left">
            <div className="card-num"><span className="card-num-dot">3</span>관심 종목</div>
            <div className="card-title">My Watchlist</div>
            {beginner && <div className="card-sub">내가 보는 종목의 가격과 변화율을 모아봤어요.</div>}
          </div>
        </div>
        <div className="watch-list">
          {watchlist.map((item) => {
            const isSelected = selectedWatchItem?.symbol === item.symbol
            return (
              <div
                key={item.symbol}
                className={`watch-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(isSelected ? null : item)}
              >
                <div className="watch-icon">{item.name.slice(0, 2).toUpperCase()}</div>
                <div className="watch-info">
                  <div className="watch-name">{item.name}</div>
                  <div className="watch-symbol">{item.symbol}</div>
                </div>
                <div className="watch-spark">
                  <Sparkline data={item.series} />
                </div>
                <div className="watch-price">
                  <div className="watch-price-val">{item.price}</div>
                  <div className={`watch-price-chg ${item.up ? 'up' : 'down'}`}>{item.chg}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </EditableWidgetShell>
  )
}
