import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCompanyDetail } from '../hooks/useCompanies'
import { useLatestPrice } from '../hooks/useStocks'
import { useMetrics } from '../hooks/useFinancials'
import { CompanySearchInput } from '../components/CompanySearchInput'

const MAX_COMPARE = 4

function fmt(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString()
}

function fmtDec(v: number | null | undefined, digits = 2): string {
  if (v == null) return '—'
  return v.toFixed(digits)
}

function CompareCard({ ticker, onRemove }: { ticker: string; onRemove: () => void }) {
  const navigate = useNavigate()
  const { data: company, isLoading: cLoading } = useCompanyDetail(ticker)
  const { data: price } = useLatestPrice(ticker)
  const { data: metrics } = useMetrics(ticker)

  if (cLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">{ticker}</span>
        </div>
        <div className="empty-state">로딩 중…</div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">{ticker}</span>
          <button className="btn btn-sm" onClick={onRemove} style={{ marginLeft: 'auto' }}>×</button>
        </div>
        <div className="empty-state">종목 정보를 찾을 수 없습니다</div>
      </div>
    )
  }

  const rows: [string, string][] = [
    ['시장', company.market || '—'],
    ['업종', company.sector || '—'],
    ['현재가', price?.closePrice != null ? `₩${fmt(price.closePrice)}` : '—'],
    ['시가총액', price?.marketCap != null ? `₩${fmt(price.marketCap)}` : '—'],
    ['PER', fmtDec(metrics?.per)],
    ['PBR', fmtDec(metrics?.pbr)],
    ['PSR', fmtDec(metrics?.psr)],
    ['ROE (%)', fmtDec(metrics?.roe)],
    ['ROA (%)', fmtDec(metrics?.roa)],
    ['영업이익률 (%)', fmtDec(metrics?.operatingMargin)],
    ['순이익률 (%)', fmtDec(metrics?.netMargin)],
    ['부채비율 (%)', fmtDec(metrics?.debtRatio)],
    ['EPS', metrics?.eps != null ? `${fmt(metrics.eps)} 원` : '—'],
    ['BPS', metrics?.bps != null ? `${fmt(metrics.bps)} 원` : '—'],
    ['매출액', metrics?.revenue != null ? `${fmt(metrics.revenue)} 원` : '—'],
    ['순이익', metrics?.netIncome != null ? `${fmt(metrics.netIncome)} 원` : '—'],
  ]

  return (
    <div className="card">
      <div className="card-header">
        <span
          className="card-title"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/stock/${ticker}`)}
          title="종목 상세 페이지로"
        >
          {company.companyName}
        </span>
        <span style={{ marginLeft: 8, color: 'var(--accent-orange)', fontSize: '0.85rem' }}>{ticker}</span>
        <button
          onClick={onRemove}
          title="비교에서 제거"
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0 4px',
            lineHeight: 1,
          }}
        >×</button>
      </div>
      <table className="data-table" style={{ width: '100%' }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{label}</td>
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tickersParam = searchParams.get('tickers') || ''
  const tickers = tickersParam
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE)

  const update = (next: string[]) => {
    if (next.length === 0) setSearchParams({})
    else setSearchParams({ tickers: next.join(',') })
  }

  const add = (ticker: string) => {
    if (!ticker || tickers.includes(ticker) || tickers.length >= MAX_COMPARE) return
    update([...tickers, ticker])
  }

  const remove = (t: string) => update(tickers.filter((x) => x !== t))

  const gridClass =
    tickers.length >= 4 ? 'grid-4' :
    tickers.length === 3 ? 'grid-3' :
    tickers.length === 2 ? 'grid-2' :
    ''  // 1개일 때는 그냥 단일 카드

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Compare Stocks</h1>
        <p className="page-subtitle">최대 {MAX_COMPARE}개 종목의 재무지표를 나란히 비교</p>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <CompanySearchInput
          placeholder={
            tickers.length >= MAX_COMPARE
              ? `최대 ${MAX_COMPARE}개까지 비교 가능합니다`
              : '회사명 또는 종목코드로 검색해서 추가...'
          }
          excludeTickers={tickers}
          disabled={tickers.length >= MAX_COMPARE}
          onSelect={(c) => add(c.ticker)}
        />
      </div>

      {tickers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            비교할 종목을 추가해주세요. URL에 직접 입력해도 됩니다.
            <br />
            <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              /compare?tickers=005930,000660,035420
            </code>
          </div>
        </div>
      ) : (
        <div className={gridClass}>
          {tickers.map((t) => (
            <CompareCard key={t} ticker={t} onRemove={() => remove(t)} />
          ))}
        </div>
      )}
    </>
  )
}
