import { Link, useParams } from 'react-router-dom'
import { useGuide } from '../hooks/useGuides'
import { usePageMeta } from '../hooks/usePageMeta'
import { Markdown } from '../components/Markdown'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { EDITORIAL_ANCHOR, EDITORIAL_NAME } from '../lib/site'
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

  // 게시일과 수정일은 '표시되는 날짜'로 비교한다. 원본은 LocalDateTime 이라
  // 같은 날 저장돼도 마이크로초가 달라, 문자열로 비교하면 항상 서로 다른 값으로
  // 판정돼 같은 날짜가 "게시 · 업데이트" 로 두 번 찍힌다.
  const publishedText = fmtDate(guide.publishedAt)
  const updatedText = fmtDate(guide.updatedAt)

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
          작성 {EDITORIAL_NAME}
          {publishedText && <> · 게시 {publishedText}</>}
          {updatedText && updatedText !== publishedText && <> · 업데이트 {updatedText}</>}
        </div>

        <Markdown>{guide.content}</Markdown>
      </article>

      <p style={{ maxWidth: 860, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 'var(--space-lg)' }}>
        이 글은 {EDITORIAL_NAME}이 직접 작성했습니다.{' '}
        <Link to={EDITORIAL_ANCHOR} style={{ color: 'var(--text-secondary)' }}>
          편집 방침 보기
        </Link>
        <br />
        본 콘텐츠는 투자 정보 제공을 목적으로 하며, 특정 종목의 매수·매도를 권유하지 않습니다.
        투자 판단과 그 결과의 책임은 이용자 본인에게 있습니다.
      </p>
    </>
  )
}
