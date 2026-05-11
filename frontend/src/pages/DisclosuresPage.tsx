import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecentDisclosures } from '../hooks/useDisclosures'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'

export default function DisclosuresPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = useRecentDisclosures(page, 30)

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Disclosures</h1>
        <p className="page-subtitle">DART 최신 공시 목록</p>
      </div>

      <div className="card">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorFallback />
        ) : data?.content.length ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>일자</th>
                  <th>종목</th>
                  <th>종목명</th>
                  <th>공시명</th>
                  <th>유형</th>
                  <th>제출인</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((d) => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{d.receptDate}</td>
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

            <div className="pagination">
              <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
              <span className="pagination-info">
                {page + 1} / {data.totalPages || 1}
              </span>
              <button className="btn btn-sm" disabled={page + 1 >= (data.totalPages || 1)} onClick={() => setPage(page + 1)}>→</button>
            </div>
          </>
        ) : (
          <div className="empty-state">공시 데이터가 없습니다</div>
        )}
      </div>
    </>
  )
}
