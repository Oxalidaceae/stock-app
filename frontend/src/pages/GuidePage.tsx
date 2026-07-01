import { Link } from 'react-router-dom'
import { useGuides } from '../hooks/useGuides'
import { usePageMeta } from '../hooks/usePageMeta'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'

export default function GuidePage() {
  usePageMeta({
    title: '투자 가이드 — 지표·공시·거시경제 쉽게 읽기 | Jipyo (지표)',
    description:
      'PER·PBR·ROE 같은 재무지표부터 DART 공시, 기준금리·환율까지. 투자 정보를 스스로 해석하는 데 필요한 기초를 Jipyo가 직접 정리했습니다.',
    path: '/guide',
  })

  const { data: guides, isLoading, error } = useGuides()

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">투자 가이드</h1>
        <p className="page-subtitle">
          재무지표·공시·거시경제를 스스로 읽는 데 필요한 기초를 Jipyo가 직접 정리한 해설 모음입니다.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorFallback message="가이드를 불러오지 못했습니다" />
      ) : guides && guides.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxWidth: 920 }}>
          {guides.map((g) => (
            <Link
              key={g.slug}
              to={`/guide/${g.slug}`}
              className="card"
              style={{ padding: 'var(--space-lg) var(--space-xl)', display: 'block' }}
            >
              {g.tag && (
                <div style={{ fontSize: '0.68rem', color: 'var(--accent-orange)', marginBottom: 6, letterSpacing: '0.03em' }}>
                  {g.tag}
                </div>
              )}
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                {g.title}
              </h2>
              {g.summary && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {g.summary}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card"><div className="empty-state">아직 게시된 가이드가 없습니다</div></div>
      )}
    </>
  )
}
