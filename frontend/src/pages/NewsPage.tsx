import { useState } from 'react'
import { useBriefings } from '../hooks/useBriefings'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'

// 수집 대상 부처 (collector POLICY_BRIEFING_FEEDS 와 일치)
const MINISTRIES = ['전체', '기획재정부', '금융위원회', '관세청']

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function NewsPage() {
  const [ministry, setMinistry] = useState('전체')
  const [page, setPage] = useState(0)
  const apiMinistry = ministry === '전체' ? '' : ministry
  const { data, isLoading, error } = useBriefings(apiMinistry, page)

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">경제 소식</h1>
        <p className="page-subtitle">기획재정부·금융위원회·관세청 정책 발표 — 정책브리핑</p>
      </div>

      <div className="card">
        {/* 부처 필터 + 출처 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
          {MINISTRIES.map((m) => {
            const active = ministry === m
            return (
              <button
                key={m}
                className="btn btn-sm"
                onClick={() => { setMinistry(m); setPage(0) }}
                style={{
                  background: active ? 'var(--accent-orange-dim)' : undefined,
                  color: active ? 'var(--accent-orange)' : undefined,
                  borderColor: active ? 'var(--accent-orange)' : undefined,
                }}
              >
                {m}
              </button>
            )
          })}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            {data && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                총 <strong style={{ color: 'var(--accent-orange)' }}>{data.totalElements.toLocaleString()}</strong>건
              </span>
            )}
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              출처: 대한민국 정책브리핑 (공공누리 제1유형)
            </span>
          </div>
        </div>

        {/* 본문 */}
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorFallback />
        ) : data && data.content.length ? (
          <>
            <div>
              {data.content.map((b) => (
                <a
                  key={b.id}
                  href={b.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: 'var(--space-md) 0',
                    borderBottom: '1px solid var(--border-primary)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge" style={{ color: 'var(--accent-orange)', borderColor: 'var(--accent-orange-dim)' }}>
                      {b.ministry || '기타'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{fmtDate(b.publishedAt)}</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>
                    {b.title}
                  </div>
                  {b.summary && (
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {b.summary}
                    </div>
                  )}
                </a>
              ))}
            </div>

            <div className="pagination">
              <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
              <span className="pagination-info">{page + 1} / {data.totalPages || 1}</span>
              <button
                className="btn btn-sm"
                disabled={page + 1 >= (data.totalPages || 1)}
                onClick={() => setPage(page + 1)}
              >→</button>
            </div>
          </>
        ) : (
          <div className="empty-state">경제 소식이 없습니다</div>
        )}
      </div>
    </>
  )
}
