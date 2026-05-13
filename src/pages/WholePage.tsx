import { useEffect, useMemo, useState } from 'react'
import type { NewsSectorKey, PriceAlert, PriceAlertDirection, SectorStock, SectorStocksData } from '../types'
import { edgeFunctionHeaders, edgeFunctionUrl, hasSupabaseConfig } from '../lib/supabase'

const REFRESH_INTERVAL_MS = 15_000

async function fetchSectorStocks(signal?: AbortSignal): Promise<SectorStocksData> {
  if (!hasSupabaseConfig) throw new Error('Supabase config missing')
  const response = await fetch(edgeFunctionUrl('get-sector-stocks'), {
    headers: edgeFunctionHeaders(),
    cache: 'no-store',
    signal,
  })
  if (!response.ok) throw new Error(`get-sector-stocks ${response.status}`)
  return response.json() as Promise<SectorStocksData>
}

async function fetchFallbackSectorStocks(signal?: AbortSignal): Promise<SectorStocksData> {
  const response = await fetch('/data/sector-stocks.json', {
    cache: 'no-store',
    signal,
  })
  if (!response.ok) throw new Error(`sector-stocks fallback ${response.status}`)
  return response.json() as Promise<SectorStocksData>
}

type AlertDraft = {
  price: string
  direction: PriceAlertDirection
}

const parsePriceValue = (price: string) => {
  const parsed = Number(price.replace(/[$,원\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

export default function WholePage({
  watchlistSymbols,
  priceAlerts,
  onToggleWatch,
  onAddPriceAlert,
  onPricesUpdate,
  onSectorDataLoad,
}: {
  watchlistSymbols: string[]
  priceAlerts: PriceAlert[]
  onToggleWatch: (stock: SectorStock) => void
  onAddPriceAlert: (stock: SectorStock, targetPrice: number, direction: PriceAlertDirection) => void
  onPricesUpdate: (stocks: SectorStock[]) => void
  onSectorDataLoad?: (stocks: SectorStock[]) => void
}) {
  const [sectorData, setSectorData] = useState<SectorStocksData | null>(null)
  const [activeSectorKey, setActiveSectorKey] = useState<NewsSectorKey | null>(null)
  const [alertDrafts, setAlertDrafts] = useState<Record<string, AlertDraft>>({})
  const [openAlertSymbol, setOpenAlertSymbol] = useState<string | null>(null)
  const [showKrw, setShowKrw] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const totalCount = useMemo(
    () => sectorData?.sectors.reduce((sum, sector) => sum + sector.stocks.length, 0) ?? 0,
    [sectorData],
  )
  const activeSector = useMemo(() => {
    if (!sectorData) return null
    return sectorData.sectors.find((sector) => sector.key === activeSectorKey) ?? sectorData.sectors[0] ?? null
  }, [activeSectorKey, sectorData])
  const alertCountsBySymbol = useMemo(() => {
    return priceAlerts.reduce<Record<string, number>>((counts, alert) => {
      if (!alert.active) return counts
      counts[alert.symbol] = (counts[alert.symbol] ?? 0) + 1
      return counts
    }, {})
  }, [priceAlerts])
  const activeSectorHasUsdStocks = activeSector?.stocks.some((stock) => stock.currency === 'USD') ?? false

  useEffect(() => {
    let ignore = false
    let timer: number | undefined
    const controller = new AbortController()

    const load = async (background = false) => {
      if (background) setRefreshing(true)
      else setLoading(true)
      try {
        const data = await fetchSectorStocks(controller.signal)
        if (!ignore) {
          setSectorData(data)
          const allStocks = data.sectors.flatMap((sector) => sector.stocks)
          onPricesUpdate(allStocks)
          onSectorDataLoad?.(allStocks)
          setActiveSectorKey((current) => current ?? data.sectors[0]?.key ?? null)
          setError(false)
        }
      } catch {
        try {
          const fallback = await fetchFallbackSectorStocks(controller.signal)
          if (!ignore) {
            setSectorData(fallback)
            const allStocks = fallback.sectors.flatMap((sector) => sector.stocks)
            onPricesUpdate(allStocks)
            onSectorDataLoad?.(allStocks)
            setActiveSectorKey((current) => current ?? fallback.sectors[0]?.key ?? null)
            setError(!hasSupabaseConfig)
          }
        } catch {
          if (!ignore) setError(true)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void load()
    if (hasSupabaseConfig) {
      timer = window.setInterval(() => { void load(true) }, REFRESH_INTERVAL_MS)
    }

    return () => {
      ignore = true
      controller.abort()
      if (timer) window.clearInterval(timer)
    }
  }, [onPricesUpdate])

  const updateAlertDraft = (symbol: string, draft: Partial<AlertDraft>) => {
    setAlertDrafts((current) => ({
      ...current,
      [symbol]: {
        price: current[symbol]?.price ?? '',
        direction: current[symbol]?.direction ?? 'above',
        ...draft,
      },
    }))
  }

  const submitAlert = (stock: SectorStock) => {
    const draft = alertDrafts[stock.symbol]
    const targetPrice = Number((draft?.price ?? '').replace(/,/g, ''))
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) return
    onAddPriceAlert(stock, targetPrice, draft?.direction ?? 'above')
    setOpenAlertSymbol(null)
    setAlertDrafts((current) => ({
      ...current,
      [stock.symbol]: { price: '', direction: draft?.direction ?? 'above' },
    }))
  }

  return (
    <section className="whole-panel card" data-tour="whole-page">
      <div className="whole-panel-head">
        <div>
          <div className="card-num"><span className="card-num-dot">1</span> 전체 종목</div>
          <div className="whole-panel-title">섹터별 대표 종목 현재가</div>
          <div className="whole-panel-sub">AI, 반도체, 조선, 에너지, 헬스, 우주, 바이오, 방산 섹터의 대표 종목을 1일 전 종가 기준 등락으로 비교해요.</div>
        </div>
        <div className="whole-panel-meta">
          <div className={`whole-live-dot ${refreshing ? 'refreshing' : ''}`} />
          <span>{totalCount || 80} stocks · 15초 갱신</span>
        </div>
      </div>

      {sectorData && (
        <div className="whole-update-row">
          <span>{sectorData.generatedAtLabel}</span>
          {error && <span>Supabase 설정 전이라 로컬 예시 데이터를 표시 중입니다.</span>}
        </div>
      )}

      {sectorData && (
        <div className="whole-sector-tabs" role="tablist" aria-label="섹터 필터" data-tour="whole-sector-tabs">
          {sectorData.sectors.map((sector) => (
            <button
              key={sector.key}
              type="button"
              role="tab"
              aria-selected={activeSector?.key === sector.key}
              className={`whole-sector-tab ${activeSector?.key === sector.key ? 'active' : ''}`}
              onClick={() => setActiveSectorKey(sector.key)}
            >
              {sector.label}
            </button>
          ))}
        </div>
      )}

      {loading && !sectorData ? (
        <div className="whole-loading">종목 가격을 불러오는 중입니다.</div>
      ) : (
        <div className="whole-sector-list">
          {activeSector && (
            <section key={activeSector.key} className="whole-sector">
              <div className="whole-sector-head">
                <div>
                  <div className="whole-sector-title">{activeSector.label}</div>
                  {showKrw && sectorData?.usdKrwRate && (
                    <div className="whole-sector-rate">USD/KRW {Math.round(sectorData.usdKrwRate).toLocaleString('ko-KR')}원 기준</div>
                  )}
                </div>
                <div className="whole-sector-tools">
                  {activeSectorHasUsdStocks && (
                    <button
                      className={`currency-toggle whole-currency-toggle ${showKrw ? 'active' : ''}`}
                      type="button"
                      onClick={() => setShowKrw((value) => !value)}
                    >
                      원화로 보기
                    </button>
                  )}
                  <div className="whole-sector-count">{activeSector.stocks.length}개 종목</div>
                </div>
              </div>
              <div className="whole-stock-table">
                {activeSector.stocks.map((stock) => (
                  <div key={`${activeSector.key}-${stock.symbol}`} className="whole-stock-row">
                    <div className="whole-stock-main">
                      <div className="whole-stock-name-row">
                        <div className="whole-stock-name">{stock.name}</div>
                        {stock.statusLabel && (
                          <span className={`whole-status-badge ${stock.status ?? 'insufficient_data'}`}>{stock.statusLabel}</span>
                        )}
                        {stock.dataQualityLabel && stock.dataQuality !== 'normal' && (
                          <span className={`whole-quality-badge ${stock.dataQuality ?? 'analysis_unavailable'}`}>{stock.dataQualityLabel}</span>
                        )}
                      </div>
                      <div className="whole-stock-symbol">{stock.symbol}</div>
                      {stock.statusSummary && (
                        <div className="whole-stock-summary" data-tour="whole-stock-summary">{stock.statusSummary}</div>
                      )}
                    </div>
                    <div className={`whole-stock-price ${stock.up ? 'up' : 'down'}`}>
                      {showKrw && stock.currency === 'USD' && stock.krwPrice ? stock.krwPrice : stock.price}
                    </div>
                    <div className={`whole-stock-move ${stock.up ? 'up' : 'down'}`}>
                      <span>{stock.up ? '▲' : '▼'}</span>
                      <span>{stock.change}</span>
                      <span>{stock.changePercent}</span>
                    </div>
                    <div className="whole-stock-actions">
                      <button
                        type="button"
                        className={`whole-watch-btn ${watchlistSymbols.includes(stock.symbol) ? 'active' : ''}`}
                        onClick={() => onToggleWatch(stock)}
                        aria-label={`${stock.name} ${watchlistSymbols.includes(stock.symbol) ? '관심 해제' : '관심 추가'}`}
                        title={watchlistSymbols.includes(stock.symbol) ? '관심 해제' : '관심 추가'}
                        data-tour="whole-watch-toggle"
                      >
                        {watchlistSymbols.includes(stock.symbol) ? '♥' : '♡'}
                      </button>
                      <div className="whole-alert-menu">
                        <button
                          type="button"
                          className={`whole-alert-btn ${openAlertSymbol === stock.symbol ? 'active' : ''}`}
                          onClick={() => setOpenAlertSymbol((current) => current === stock.symbol ? null : stock.symbol)}
                          aria-expanded={openAlertSymbol === stock.symbol}
                          aria-label={`${stock.name} 가격 알림 설정`}
                          title="가격 알림"
                          data-tour="whole-alert-button"
                        >
                          🔔
                        </button>
                        {openAlertSymbol === stock.symbol && (
                          <div className="whole-alert-pop">
                            <div className="whole-alert-pop-title">가격 알림</div>
                            <div className="whole-alert-control">
                              <select
                                value={alertDrafts[stock.symbol]?.direction ?? 'above'}
                                onChange={(event) => updateAlertDraft(stock.symbol, { direction: event.target.value as PriceAlertDirection })}
                                aria-label={`${stock.name} 알림 조건`}
                              >
                                <option value="above">이상</option>
                                <option value="below">이하</option>
                              </select>
                              <input
                                value={alertDrafts[stock.symbol]?.price ?? ''}
                                placeholder={parsePriceValue(stock.price)?.toLocaleString(stock.currency === 'KRW' ? 'ko-KR' : 'en-US') ?? '목표가'}
                                inputMode="decimal"
                                onChange={(event) => updateAlertDraft(stock.symbol, { price: event.target.value })}
                                aria-label={`${stock.name} 목표 가격`}
                              />
                              <button type="button" onClick={() => submitAlert(stock)}>등록</button>
                            </div>
                          </div>
                        )}
                      </div>
                      {alertCountsBySymbol[stock.symbol] > 0 && (
                        <div className="whole-alert-count">알림 {alertCountsBySymbol[stock.symbol]}개</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  )
}
