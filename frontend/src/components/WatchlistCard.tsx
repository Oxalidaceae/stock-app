import { useNavigate } from 'react-router-dom'
import { useWatchlistStore } from '../stores/watchlistStore'
import { useLatestPrice } from '../hooks/useStocks'
import { useCompanyDetail } from '../hooks/useCompanies'

function fmtKRW(v: number | null | undefined): string {
  if (v == null) return '—'
  return `₩${v.toLocaleString()}`
}

function WatchlistRow({
  ticker,
  onOpen,
  onRemove,
}: {
  ticker: string
  onOpen: () => void
  onRemove: () => void
}) {
  const { data: company } = useCompanyDetail(ticker)
  const { data: price } = useLatestPrice(ticker)

  return (
    <div
      onClick={onOpen}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: '10px 0',
        borderBottom: '1px solid var(--border-primary)',
        fontSize: '0.85rem',
        cursor: 'pointer',
      }}
    >
      <span style={{ color: 'var(--accent-orange)', minWidth: 64, fontWeight: 600 }}>{ticker}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {company?.companyName || '—'}
      </span>
      <span style={{ minWidth: 100, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {fmtKRW(price?.closePrice)}
      </span>
      <span style={{ minWidth: 80, textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        {price?.tradeDate || ''}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        title="관심 종목 제거"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '1rem',
          padding: '0 4px',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}

export function WatchlistCard() {
  const navigate = useNavigate()
  const tickers = useWatchlistStore((s) => s.tickers)
  const remove = useWatchlistStore((s) => s.remove)

  if (tickers.length === 0) return null

  return (
    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
      <div className="card-header">
        <span className="card-title">★ My Watchlist</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            fontWeight: 'normal',
          }}
        >
          {tickers.length}개 종목
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {tickers.map((t) => (
          <WatchlistRow
            key={t}
            ticker={t}
            onOpen={() => navigate(`/stock/${t}`)}
            onRemove={() => remove(t)}
          />
        ))}
      </div>
    </div>
  )
}
