import { useRecentDisclosures } from '../hooks/useDisclosures'
import { useIndicatorList } from '../hooks/useEconomic'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { WatchlistCard } from '../components/WatchlistCard'
import { SyncStatusCard } from '../components/SyncStatusCard'
import { PageIntro } from '../components/PageIntro'
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

      <PageIntro guides={[{ to: '/guide', label: '투자 가이드 보기' }]}>
        Jipyo(지표)는 한국 상장기업의 주가·재무·공시와 한국은행 거시지표를 한 화면에 모아 정리한
        투자 정보 서비스입니다. 아래에서 최근 공시와 핵심 경제지표를 훑어보고, 종목 검색이나
        스크리너로 관심 기업을 더 깊이 살펴볼 수 있습니다. 모든 데이터는 출처와 갱신 기준을 함께 표시합니다.
      </PageIntro>

      {/* Data Sync Status */}
      <SyncStatusCard />

      {/* My Watchlist (관심 종목이 있을 때만 표시) */}
      <WatchlistCard />

      {/* Quick Actions */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card" style={{ cursor: 'pointer', borderColor: 'var(--accent-orange-dim)' }} onClick={() => navigate('/screener')}>
          <div className="card-title">⊞ Screener</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 8 }}>
            PER · PBR · ROE 조건으로 종목 필터링
          </div>
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/macro')}>
          <div className="card-title">◇ Macro Economics</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 8 }}>
            한국은행 100대 통계지표 — 시장금리·환율·통화량·성장률 한눈에
          </div>
        </div>
      </div>

      {/* Recent Disclosures */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
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
          <div className="grid-3" style={{ marginTop: 'var(--space-sm)' }}>
            {indicators.map((ind) => (
              <div key={ind.statCode} style={{ padding: '8px 12px', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', cursor: 'pointer' }}
                onClick={() => navigate('/economic')}>
                <div>{ind.statName}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{ind.unit}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">경제지표 데이터가 없습니다</div>
        )}
      </div>
    </>
  )
}
