import { useRecentDisclosures } from '../hooks/useDisclosures'
import { useIndicatorList } from '../hooks/useEconomic'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: disclosures, isLoading: discLoading } = useRecentDisclosures(0, 8)
  const { data: indicators, isLoading: ecoLoading } = useIndicatorList()

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Market Overview</h1>
        <p className="page-subtitle">대한민국 주식시장 투자 정보 종합 대시보드</p>
      </div>

      {/* Quick Actions */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card" style={{ cursor: 'pointer', borderColor: 'var(--accent-orange-dim)' }} onClick={() => navigate('/screener')}>
          <div className="card-title">⊞ Screener</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 8 }}>
            PER · PBR · ROE 조건으로 종목 필터링
          </div>
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/economic')}>
          <div className="card-title">◈ Economic Indicators</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 8 }}>
            기준금리 · GDP · CPI · 환율
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Disclosures */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Disclosures</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto', marginRight: 12, fontWeight: 'normal' }}>출처: 금융감독원 DART</span>
            <button className="btn btn-sm" onClick={() => navigate('/disclosures')}>전체보기</button>
          </div>
          {discLoading ? (
            <LoadingSpinner />
          ) : disclosures?.content.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {disclosures.content.map((d) => (
                <div key={d.id} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-primary)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 72 }}>{d.receptDate}</span>
                  <span style={{ color: 'var(--accent-orange)', minWidth: 64, cursor: d.ticker ? 'pointer' : 'default' }}
                    onClick={() => d.ticker && navigate(`/stock/${d.ticker}`)}>
                    {d.ticker || '—'}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.dartUrl ? (
                      <a href={d.dartUrl} target="_blank" rel="noopener noreferrer">{d.reportName}</a>
                    ) : d.reportName}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">최신 공시가 없습니다</div>
          )}
        </div>

        {/* Economic Indicators */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Economic Indicators</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto', marginRight: 12, fontWeight: 'normal' }}>출처: 한국은행 ECOS</span>
            <button className="btn btn-sm" onClick={() => navigate('/economic')}>상세보기</button>
          </div>
          {ecoLoading ? (
            <LoadingSpinner />
          ) : indicators?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {indicators.map((ind) => (
                <div key={ind.statCode} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
                  onClick={() => navigate('/economic')}>
                  <span>{ind.statName}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{ind.unit}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">경제지표 데이터가 없습니다</div>
          )}
        </div>
      </div>
    </>
  )
}
