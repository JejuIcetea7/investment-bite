import { useState } from 'react'
import type { WatchItem } from '../../types'
import Sparkline from '../../components/Sparkline'

export default function WatchlistSection({
  watchlist,
  selectedWatchItem,
  beginner,
  onSelect,
  onRemove,
}: {
  watchlist: WatchItem[]
  selectedWatchItem: WatchItem | null
  beginner: boolean
  onSelect: (item: WatchItem | null) => void
  onRemove?: (symbol: string) => void
}) {
  const [editMode, setEditMode] = useState(false)
  const shouldScroll = watchlist.length >= 10

  return (
    <section className="card" data-tour="watch">
      <div className="card-head">
        <div className="card-head-left">
          <div className="card-num"><span className="card-num-dot">2</span>관심 종목</div>
          <div className="card-title">My Watchlist</div>
          {beginner && <div className="card-sub">내가 보는 종목의 가격과 변화율을 모아봤어요.</div>}
        </div>
        <button
          type="button"
          className="watch-list-edit-btn"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? '완료' : '편집'}
        </button>
      </div>
      <div className={`watch-list ${shouldScroll ? 'scrollable' : ''}`}>
        {watchlist.map((item) => {
          const isSelected = selectedWatchItem?.symbol === item.symbol
          return (
            <div
              key={item.symbol}
              className={`watch-item ${isSelected ? 'selected' : ''} ${editMode ? 'edit-mode' : ''}`}
              onClick={() => !editMode && onSelect(isSelected ? null : item)}
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
              {onRemove && (
                <button
                  type="button"
                  className="watch-item-delete-btn"
                  onClick={() => onRemove(item.symbol)}
                >
                  삭제
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
