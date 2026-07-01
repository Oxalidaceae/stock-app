import { Link, useParams } from 'react-router-dom'
import { useGuide } from '../hooks/useGuides'
import { usePageMeta } from '../hooks/usePageMeta'
import { Markdown } from '../components/Markdown'
import { LoadingSpinner } from '../components/LoadingSpinner'
import NotFoundPage from './NotFoundPage'

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function GuideArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: guide, isLoading, error } = useGuide(slug)

  usePageMeta({
    title: guide ? `${guide.title} | Jipyo (지표)` : '가이드 | Jipyo (지표)',
    description: guide?.summary ?? undefined,
    path: slug ? `/guide/${slug}` : undefined,
  })

  if (isLoading) return <LoadingSpinner message="가이드 로딩 중..." />
  if (error || !guide) return <NotFoundPage />

  return (
    <>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
        <Link to="/guide" style={{ color: 'var(--text-secondary)' }}>투자 가이드</Link>
        {guide.tag && (
          <>
            <span style={{ opacity: 0.4 }}> / </span>
            <span>{guide.tag}</span>
          </>
        )}
      </div>

      <div className="page-header">
        <h1 className="page-title">{guide.title}</h1>
        {guide.summary && <p className="page-subtitle">{guide.summary}</p>}
      </div>

      <article className="card" style={{ padding: 'var(--space-xl)', maxWidth: 860 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
          업데이트 {fmtDate(guide.updatedAt ?? guide.publishedAt)} · Jipyo 편집팀
        </div>

        <Markdown>{guide.content}</Markdown>
      </article>

      <p style={{ maxWidth: 860, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 'var(--space-lg)' }}>
        본 콘텐츠는 투자 정보 제공을 목적으로 하며, 특정 종목의 매수·매도를 권유하지 않습니다.
        투자 판단과 그 결과의 책임은 이용자 본인에게 있습니다.
      </p>
    </>
  )
}
