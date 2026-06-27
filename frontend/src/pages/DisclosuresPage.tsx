import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecentDisclosures } from '../hooks/useDisclosures'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'
import type { Disclosure } from '../types/api'

const DART_SEARCH_URL = 'https://dart.fss.or.kr/dsab007/main.do'

export default function DisclosuresPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const { data, isLoading, error } = useRecentDisclosures(page, 100, query)

  const grouped = useMemo(() => {
    if (!data?.content) return [] as { date: string; items: Disclosure[] }[]
    const map = new Map<string, Disclosure[]>()
    for (const d of data.content) {
      if (!map.has(d.receptDate)) map.set(d.receptDate, [])
      map.get(d.receptDate)!.push(d)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items }))
  }, [data])

  const handleClear = () => {
    setSearchInput('')
    setQuery('')
    setPage(0)
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Disclosures</h1>
        <p className="page-subtitle">DART 최신 공시 — 최근 5영업일 보관</p>
      </div>

      <div className="card">
        {/* 검색 + 카운트 + 출처 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
          <form onSubmit={(e) => { e.preventDefault(); setQuery(searchInput.trim()); setPage(0) }} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
            <input
              className="form-input"
              type="text"
              placeholder="종목명, 종목코드, 공시명 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-sm">검색</button>
            {query && (
              <button type="button" className="btn btn-sm" onClick={handleClear}>초기화</button>
            )}
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            {data && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                총 <strong style={{ color: 'var(--accent-orange)' }}>{data.totalElements.toLocaleString()}</strong>건
                {query && <span style={{ color: 'var(--text-muted)' }}> · "{query}" 검색</span>}
              </span>
            )}
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>출처: 금융감독원 DART</span>
          </div>
        </div>

        {/* 본문 */}
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorFallback />
        ) : grouped.length ? (
          <>
            {grouped.map(({ date, items }) => (
              <div key={date} style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--accent-orange-dim)',
                  marginBottom: 8,
                }}>
                  <span style={{ color: 'var(--accent-orange)', fontWeight: 600, fontSize: '0.9rem' }}>{date}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{items.length}건</span>
                </div>
                <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>종목</th>
                      <th>종목명</th>
                      <th>공시명</th>
                      <th style={{ width: 110 }}>유형</th>
                      <th style={{ width: 160 }}>제출인</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((d) => (
                      <tr key={d.id}>
                        <td>
                          {d.ticker ? (
                            <span
                              style={{ color: 'var(--accent-orange)', cursor: 'pointer' }}
                              onClick={() => navigate(`/stock/${d.ticker}`)}
                            >
                              {d.ticker}
                            </span>
                          ) : '—'}
                        </td>
                        <td>{d.companyName || '—'}</td>
                        <td>
                          {d.dartUrl ? (
                            <a href={d.dartUrl} target="_blank" rel="noopener noreferrer">
                              {d.reportName}
                            </a>
                          ) : d.reportName}
                        </td>
                        <td><span className="badge">{d.disclosureType}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{d.submitter || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            ))}

            <div className="pagination">
              <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
              <span className="pagination-info">{page + 1} / {data?.totalPages || 1}</span>
              <button
                className="btn btn-sm"
                disabled={page + 1 >= (data?.totalPages || 1)}
                onClick={() => setPage(page + 1)}
              >→</button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            {query ? `"${query}"에 해당하는 공시가 없습니다` : '공시 데이터가 없습니다'}
          </div>
        )}

        {/* DART 직링크 */}
        <div style={{
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-md)',
          borderTop: '1px solid var(--border-primary)',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ marginBottom: 8 }}>5영업일 이전의 공시는 DART에서 직접 조회하세요</div>
          <a href={DART_SEARCH_URL} target="_blank" rel="noopener noreferrer">
            <button className="btn btn-sm">DART에서 더 보기 →</button>
          </a>
        </div>
      </div>
    </>
  )
}
