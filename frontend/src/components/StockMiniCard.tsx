import { useNavigate } from 'react-router-dom'

interface Props {
  ticker: string
  companyName: string
  price?: number
  change?: number
}

export function StockMiniCard({ ticker, companyName, price, change }: Props) {
  const navigate = useNavigate()
  const isUp = (change ?? 0) >= 0

  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/stock/${ticker}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: 'var(--accent-orange)', fontWeight: 600, fontSize: '0.85rem' }}>{ticker}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 2 }}>{companyName}</div>
        </div>
        {price != null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums' }}>
              {price.toLocaleString()}
            </div>
            {change != null && (
              <div className={isUp ? 'badge badge-up' : 'badge badge-down'}>
                {isUp ? '+' : ''}{change.toFixed(2)}%
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
