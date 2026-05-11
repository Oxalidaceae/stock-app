import { useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { createChart, CandlestickSeries } from 'lightweight-charts'
import { useCompanyDetail } from '../hooks/useCompanies'
import { useLatestPrice, useChart } from '../hooks/useStocks'
import { useMetrics } from '../hooks/useFinancials'
import { useDisclosures } from '../hooks/useDisclosures'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'

const PERIODS = ['1M', '3M', '6M', '1Y', '3Y'] as const

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
  const [period, setPeriod] = useState<string>('3M')
  const chartRef = useRef<HTMLDivElement>(null)

  const { data: company, isLoading: compLoading, error: compError } = useCompanyDetail(ticker!)
  const { data: price } = useLatestPrice(ticker!)
  const { data: chart } = useChart(ticker!, period)
  const { data: metrics } = useMetrics(ticker!)
  const { data: disclosures } = useDisclosures(ticker!, undefined, 0, 5)

  // Candlestick chart
  useEffect(() => {
    if (!chartRef.current || !chart?.data?.length) return

    const container = chartRef.current
    container.innerHTML = ''

    const c = createChart(container, {
      width: container.clientWidth,
      height: 400,
      layout: { background: { color: '#12121a' }, textColor: '#8b8fa3', fontFamily: 'IBM Plex Mono' },
      grid: { vertLines: { color: '#1e1e2e' }, horzLines: { color: '#1e1e2e' } },
      crosshair: { mode: 0 },
      timeScale: { borderColor: '#1e1e2e' },
      rightPriceScale: { borderColor: '#1e1e2e' },
    })

    const series = c.addSeries(CandlestickSeries, {
      upColor: '#00c853',
      downColor: '#ff1744',
      borderUpColor: '#00c853',
      borderDownColor: '#ff1744',
      wickUpColor: '#00c853',
      wickDownColor: '#ff1744',
    })

    series.setData(
      chart.data.map((p) => ({
        time: p.date,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
      })),
    )

    c.timeScale().fitContent()

    const resizeObserver = new ResizeObserver(() => {
      c.applyOptions({ width: container.clientWidth })
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      c.remove()
    }
  }, [chart])

  if (compLoading) return <LoadingSpinner message="기업 정보 로딩 중..." />
  if (compError) return <ErrorFallback message="기업을 찾을 수 없습니다" />

  return (
    <>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            {company?.companyName}
            <span style={{ color: 'var(--accent-orange)', marginLeft: 12, fontSize: '1rem' }}>{ticker}</span>
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

      {/* Price Chart */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <span className="card-title">Price Chart</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto', marginRight: 12, fontWeight: 'normal' }}>출처: FinanceDataReader</span>
          <div className="btn-group">
            {PERIODS.map((p) => (
              <button key={p} className={`btn btn-sm${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div ref={chartRef} style={{ height: 400 }} />
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
