import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScreener } from '../hooks/useScreener'
import { LoadingSpinner } from '../components/LoadingSpinner'
import type { ScreenerRequest } from '../types/api'

export default function ScreenerPage() {
  const navigate = useNavigate()
  const { mutate, data, isPending } = useScreener()
  const [form, setForm] = useState<ScreenerRequest>({ market: undefined, perMax: undefined, roeMin: undefined, dividendYieldMin: undefined, debtRatioMax: undefined, sortBy: 'per', sortDir: 'asc', page: 0, size: 30, includeNegativeValuation: false })

  const update = (key: string, val: string) => {
    const num = val === '' ? undefined : Number(val)
    setForm(f => ({ ...f, [key]: key === 'market' || key === 'sortBy' || key === 'sortDir' ? (val || undefined) : num }))
  }

  const toggleNeg = () => setForm(f => ({ ...f, includeNegativeValuation: !f.includeNegativeValuation }))

  const search = (page = 0) => { mutate({ ...form, page }) }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Stock Screener</h1>
        <p className="page-subtitle">재무지표 조건 기반 종목 필터링</p>
      </div>
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="form-group">
            <label className="form-label">시장</label>
            <select className="form-select" value={form.market || ''} onChange={e => update('market', e.target.value)}>
              <option value="">전체</option>
              <option value="KOSPI">KOSPI</option>
              <option value="KOSDAQ">KOSDAQ</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">PER ≤</label>
            <input className="form-input" type="number" placeholder="예: 15" value={form.perMax ?? ''} onChange={e => update('perMax', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">ROE ≥</label>
            <input className="form-input" type="number" placeholder="예: 10" value={form.roeMin ?? ''} onChange={e => update('roeMin', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">배당수익률 ≥</label>
            <input className="form-input" type="number" placeholder="예: 2" value={form.dividendYieldMin ?? ''} onChange={e => update('dividendYieldMin', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group">
            <label className="form-label">부채비율 ≤</label>
            <input className="form-input" type="number" placeholder="예: 200" value={form.debtRatioMax ?? ''} onChange={e => update('debtRatioMax', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">정렬</label>
            <select className="form-select" value={form.sortBy} onChange={e => update('sortBy', e.target.value)}>
              <option value="per">PER</option>
              <option value="pbr">PBR</option>
              <option value="roe">ROE</option>
              <option value="dividendYield">배당수익률</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => search()} style={{ height: 34 }}>검색</button>
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.includeNegativeValuation} onChange={toggleNeg} />
            적자 종목(PER/PBR 음수) 포함
          </label>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            기본은 PER/PBR 정렬 시 양수만 — 일반적 의미의 저평가 분석에 집중
          </span>
        </div>
      </div>

      <div className="card">
        {isPending ? <LoadingSpinner /> : data?.content.length ? (
          <>
            <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>종목</th><th>종목명</th><th>시장</th><th className="num">PER</th><th className="num">PBR</th><th className="num">ROE</th><th className="num">영업이익률</th><th className="num">부채비율</th><th className="num">배당률</th></tr></thead>
              <tbody>
                {data.content.map(r => (
                  <tr key={r.ticker} onClick={() => navigate(`/stock/${r.ticker}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>{r.ticker}</td>
                    <td>{r.companyName}</td>
                    <td><span className={`badge badge-${r.market?.toLowerCase()}`}>{r.market}</span></td>
                    <td className="num">{r.per?.toFixed(1) ?? '—'}</td>
                    <td className="num">{r.pbr?.toFixed(2) ?? '—'}</td>
                    <td className="num">{r.roe?.toFixed(1) ?? '—'}%</td>
                    <td className="num">{r.operatingMargin?.toFixed(1) ?? '—'}%</td>
                    <td className="num">{r.debtRatio?.toFixed(0) ?? '—'}%</td>
                    <td className="num">{r.dividendYield?.toFixed(2) ?? '—'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="pagination">
              <span className="pagination-info">{data.totalElements}건 중 {data.content.length}건</span>
            </div>
          </>
        ) : data ? <div className="empty-state">조건에 맞는 종목이 없습니다</div> : <div className="empty-state">조건을 입력하고 검색하세요</div>}
      </div>
    </>
  )
}
