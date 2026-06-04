import { useParams, useNavigate } from 'react-router-dom'
import { useCompanyDetail } from '../hooks/useCompanies'
import { useLatestPrice } from '../hooks/useStocks'
import { useMetrics } from '../hooks/useFinancials'
import { useDisclosures } from '../hooks/useDisclosures'
import { useWatchlistStore } from '../stores/watchlistStore'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'

function fmt(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString()
}

function fmtDec(v: number | null | undefined, digits = 2): string {
  if (v == null) return '—'
  return v.toFixed(digits)
}

export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()

  const { data: company, isLoading: compLoading, error: compError } = useCompanyDetail(ticker!)
  const { data: price } = useLatestPrice(ticker!)
  const { data: metrics } = useMetrics(ticker!)
  const { data: disclosures } = useDisclosures(ticker!, undefined, 0, 5)
  const inWatchlist = useWatchlistStore((s) => (ticker ? s.tickers.includes(ticker) : false))
  const toggleWatchlist = useWatchlistStore((s) => s.toggle)

  const tradingViewUrl = `https://kr.tradingview.com/symbols/KRX-${ticker}/`
  const naverFinanceUrl = `https://finance.naver.com/item/main.naver?code=${ticker}`

  if (compLoading) return <LoadingSpinner message="기업 정보 로딩 중..." />
  if (compError) return <ErrorFallback message="기업을 찾을 수 없습니다" />

  return (
    <>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => ticker && toggleWatchlist(ticker)}
              title={inWatchlist ? '관심 종목에서 제거' : '관심 종목에 추가'}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.4rem',
                color: inWatchlist ? 'var(--accent-orange)' : 'var(--text-muted)',
                padding: 0,
                lineHeight: 1,
              }}
            >
              {inWatchlist ? '★' : '☆'}
            </button>
            {company?.companyName}
            <span style={{ color: 'var(--accent-orange)', fontSize: '1rem' }}>{ticker}</span>
            <button
              onClick={() => ticker && navigate(`/compare?tickers=${ticker}`)}
              title="비교 페이지로"
              className="btn btn-sm"
              style={{ marginLeft: 8, fontSize: '0.7rem' }}
            >
              ⇄ 비교
            </button>
          </h1>
          <p className="page-subtitle">
            {company?.market && <span className={`badge badge-${company.market.toLowerCase()}`}>{company.market}</span>}
            {' '}{company?.sector} · {company?.industry}
          </p>
        </div>
        {price && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              ₩{fmt(price.closePrice)}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{price.tradeDate}</div>
          </div>
        )}
      </div>

      {/* External Chart Links */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <span className="card-title">Price Chart</span>
        </div>
        <div style={{
          padding: 'var(--space-lg) var(--space-md)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ marginBottom: 'var(--space-md)', fontSize: '0.85rem' }}>
            차트는 외부 사이트에서 확인하세요
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={tradingViewUrl} target="_blank" rel="noopener noreferrer">
              <button className="btn">TradingView →</button>
            </a>
            <a href={naverFinanceUrl} target="_blank" rel="noopener noreferrer">
              <button className="btn">네이버 금융 →</button>
            </a>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <span className="card-title" style={{ paddingLeft: 'var(--space-sm)' }}>Financial Metrics</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'normal', paddingRight: 'var(--space-sm)' }}>출처: 금융감독원 DART</span>
          </div>
          <div className="grid-4">
          {([
            ['PER', metrics.per],
            ['PBR', metrics.pbr],
            ['ROE', metrics.roe, '%'],
            ['ROA', metrics.roa, '%'],
            ['영업이익률', metrics.operatingMargin, '%'],
            ['순이익률', metrics.netMargin, '%'],
            ['부채비율', metrics.debtRatio, '%'],
            ['배당수익률', metrics.dividendYield, '%'],
            ['EPS', metrics.eps, '원'],
            ['BPS', metrics.bps, '원'],
            ['매출액', metrics.revenue, '원'],
            ['순이익', metrics.netIncome, '원'],
          ] as [string, number | null, string?][]).map(([label, value, unit]) => (
            <div className="card" key={label}>
              <div className="metric-box">
                <span className="metric-label">{label}</span>
                <span className="metric-value">{value != null ? (unit === '원' ? fmt(value) : fmtDec(value)) : '—'}</span>
                {unit && <span className="metric-sub">{unit}</span>}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Recent Disclosures */}
      {disclosures && disclosures.content.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Disclosures</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 'normal' }}>출처: 금융감독원 DART</span>
          </div>
          {disclosures.content.map((d) => (
            <div key={d.id} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-primary)', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>{d.receptDate}</span>
              <span className={`badge`} style={{ fontSize: '0.65rem' }}>{d.disclosureType}</span>
              <a href={d.dartUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.reportName}
              </a>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
