import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { buildStockInsights } from '../lib/stockInsights'
import { useCompanyDetail } from '../hooks/useCompanies'
import { useLatestPrice } from '../hooks/useStocks'
import { useMetrics, useFinancialTrend } from '../hooks/useFinancials'
import { useDisclosures } from '../hooks/useDisclosures'
import { usePageMeta } from '../hooks/usePageMeta'
import { useWatchlistStore } from '../stores/watchlistStore'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'
import type { FinancialTrendPoint } from '../types/api'

function fmt(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString()
}

function fmtDec(v: number | null | undefined, digits = 2): string {
  if (v == null) return '—'
  return v.toFixed(digits)
}

/** 큰 금액을 조/억 단위로 압축 표시 (차트 축·툴팁용). */
function fmtCompact(v: number | null | undefined): string {
  if (v == null) return '—'
  const abs = Math.abs(v)
  if (abs >= 1e12) return `${(v / 1e12).toFixed(1)}조`
  if (abs >= 1e8) return `${Math.round(v / 1e8).toLocaleString()}억`
  if (abs >= 1e4) return `${Math.round(v / 1e4).toLocaleString()}만`
  return v.toLocaleString()
}

const SERIES_COLORS = { revenue: '#ff6600', operating: '#4a9eff', net: '#00c853' }

interface ChartTooltipProps {
  active?: boolean
  payload?: { name: string; value: number | null; color: string }[]
  label?: string | number
  format: (v: number | null | undefined) => string
}

function ChartTooltip({ active, payload, label, format }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated, #12121a)',
      border: '1px solid var(--border-primary, #2a2a3a)',
      borderRadius: 6,
      padding: '8px 12px',
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{format(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function FinancialTrends({ trend }: { trend: FinancialTrendPoint[] }) {
  const axisTick = { fill: '#8b8fa3', fontSize: 11 }
  const axisLine = { stroke: '#1e1e2e' }
  const hasMargin = trend.some((t) => t.operatingMargin != null || t.netMargin != null || t.roe != null)

  return (
    <div style={{ marginBottom: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <span className="card-title" style={{ paddingLeft: 'var(--space-sm)' }}>Financial Trends</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', paddingRight: 'var(--space-sm)' }}>
          연간(사업보고서·연결) · 출처: 금융감독원 DART
        </span>
      </div>

      {/* 매출 / 영업이익 / 순이익 */}
      <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="card-header">
          <span className="card-subtitle">매출 · 영업이익 · 순이익</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="fiscalYear" tick={axisTick} axisLine={axisLine} tickLine={false} />
            <YAxis tick={axisTick} axisLine={axisLine} tickLine={false} tickFormatter={fmtCompact} width={56} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={(p: any) => <ChartTooltip {...p} format={fmtCompact} />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="revenue" name="매출액" fill={SERIES_COLORS.revenue} radius={[2, 2, 0, 0]} />
            <Bar dataKey="operatingIncome" name="영업이익" fill={SERIES_COLORS.operating} radius={[2, 2, 0, 0]} />
            <Bar dataKey="netIncome" name="순이익" fill={SERIES_COLORS.net} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 수익성 (ROE / 영업이익률 / 순이익률) */}
      {hasMargin && (
        <div className="card">
          <div className="card-header">
            <span className="card-subtitle">수익성 추이 (%)</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" />
              <XAxis dataKey="fiscalYear" tick={axisTick} axisLine={axisLine} tickLine={false} />
              <YAxis tick={axisTick} axisLine={axisLine} tickLine={false} tickFormatter={(v) => `${v}%`} width={48} />
              <Tooltip cursor={{ stroke: '#2a2a3a' }} content={(p: any) => <ChartTooltip {...p} format={(v) => (v == null ? '—' : `${Number(v).toFixed(2)}%`)} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="roe" name="ROE" stroke={SERIES_COLORS.revenue} strokeWidth={2} dot={{ r: 2 }} connectNulls />
              <Line type="monotone" dataKey="operatingMargin" name="영업이익률" stroke={SERIES_COLORS.operating} strokeWidth={2} dot={{ r: 2 }} connectNulls />
              <Line type="monotone" dataKey="netMargin" name="순이익률" stroke={SERIES_COLORS.net} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()

  const { data: company, isLoading: compLoading, error: compError } = useCompanyDetail(ticker!)
  const { data: price } = useLatestPrice(ticker!)
  const { data: metrics } = useMetrics(ticker!)
  const { data: trend } = useFinancialTrend(ticker!)
  const { data: disclosures } = useDisclosures(ticker!, undefined, 0, 5)
  const inWatchlist = useWatchlistStore((s) => (ticker ? s.tickers.includes(ticker) : false))
  const toggleWatchlist = useWatchlistStore((s) => s.toggle)

  // 지표 숫자에 해석·맥락을 더한 자동 요약 (종목 값에 따라 내용이 달라짐)
  const insights = buildStockInsights(metrics, trend)

  const tradingViewUrl = `https://kr.tradingview.com/symbols/KRX-${ticker}/`
  const naverFinanceUrl = `https://finance.naver.com/item/main.naver?code=${ticker}`

  usePageMeta({
    title: company
      ? `${company.companyName}(${ticker}) 주가·재무·공시 | Jipyo (지표)`
      : `${ticker} 종목 정보 | Jipyo (지표)`,
    description: company
      ? `${company.companyName}(${ticker})의 주가, 재무제표와 주요 재무비율(PER·PBR·ROE), 최신 DART 공시를 한 곳에서 확인하세요.`
      : `${ticker} 종목의 주가, 재무제표, 주요 재무비율과 최신 공시를 확인하세요.`,
    path: ticker ? `/stock/${ticker}` : undefined,
  })

  if (compLoading) return <LoadingSpinner message="기업 정보 로딩 중..." />
  if (compError) return <ErrorFallback message="기업을 찾을 수 없습니다" />

  return (
    <>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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

      {/* 기업 정보 — DART 기업개황 사실 정보 */}
      {company && (company.ceoName || company.listingDate || company.fiscalMonth || company.homepage) && (
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card-header">
            <span className="card-title">기업 정보</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 'normal' }}>출처: 금융감독원 DART</span>
          </div>
          <div className="grid-4" style={{ marginTop: 'var(--space-sm)', fontSize: '0.82rem' }}>
            {company.ceoName && (
              <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>대표자</div>{company.ceoName}</div>
            )}
            {company.listingDate && (
              <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>상장일</div>{company.listingDate.slice(0, 10)}</div>
            )}
            {company.fiscalMonth && (
              <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>결산월</div>{company.fiscalMonth}월</div>
            )}
            {company.homepage && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>홈페이지</div>
                <a href={company.homepage} target="_blank" rel="noopener noreferrer" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {company.homepage.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Financial Trends */}
      {trend && trend.length > 1 && <FinancialTrends trend={trend} />}

      {/* Metrics */}
      {metrics && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <span className="card-title" style={{ paddingLeft: 'var(--space-sm)' }}>Financial Metrics</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'normal', paddingRight: 'var(--space-sm)' }}>
              {metrics.baseDate && <>PER·PBR·PSR은 {metrics.baseDate} 종가 기준 · </>}출처: 금융감독원 DART
            </span>
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

      {/* 지표 해석 — 데이터에 맥락을 더한 자동 요약 + 개념 학습 링크 */}
      {insights.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card-header">
            <span className="card-title">지표 해석</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 'normal' }}>
              공개 재무 데이터 기반 자동 요약
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
            {insights.map((it) => (
              <div key={it.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-orange)', fontWeight: 700, minWidth: 78 }}>
                    {it.label}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
                    {it.text}
                    {it.guide && (
                      <>
                        {' '}
                        <Link to={it.guide.to} style={{ color: 'var(--accent-orange)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {it.guide.label} →
                        </Link>
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-primary)', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            위 요약은 공개된 재무 데이터를 일반적 기준값과 비교해 자동으로 정리한 참고 정보이며, 특정 종목의 매수·매도를 권유하지 않습니다.
            {' '}지표 개념이 더 궁금하다면{' '}
            <Link to="/guide" style={{ color: 'var(--text-secondary)' }}>투자 가이드</Link>를 참고하세요.
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
