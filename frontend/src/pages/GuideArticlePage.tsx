import { Link, useParams } from 'react-router-dom'
import { guideBySlug, GUIDE_UPDATED } from '../content/guides'
import type { GuideBlock } from '../content/guides'
import { usePageMeta } from '../hooks/usePageMeta'
import NotFoundPage from './NotFoundPage'

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 'var(--space-xl) 0 var(--space-sm)' }}>
          {block.text}
        </h2>
      )
    case 'p':
      return (
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.9, margin: '0 0 var(--space-md)' }}>
          {block.text}
        </p>
      )
    case 'ul':
      return (
        <ul style={{ margin: '0 0 var(--space-md)', paddingLeft: '1.2em', display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {block.items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      )
    case 'note':
      return (
        <div
          style={{
            border: '1px solid var(--accent-orange-dim)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md) var(--space-lg)',
            margin: '0 0 var(--space-md)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
          }}
        >
          {block.text}
        </div>
      )
  }
}

export default function GuideArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const guide = slug ? guideBySlug[slug] : undefined

  // 훅 순서 유지를 위해 조건부 return 이전에 호출 (없는 글이면 값은 무시된다)
  usePageMeta({
    title: guide ? `${guide.title} | Jipyo (지표)` : '페이지를 찾을 수 없습니다 | Jipyo (지표)',
    description: guide?.description,
    path: guide ? `/guide/${guide.slug}` : undefined,
  })

  if (!guide) return <NotFoundPage />

  return (
    <>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
        <Link to="/guide" style={{ color: 'var(--text-secondary)' }}>투자 가이드</Link>
        <span style={{ opacity: 0.4 }}> / </span>
        <span>{guide.tag}</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">{guide.title}</h1>
        <p className="page-subtitle">{guide.description}</p>
      </div>

      <article className="card" style={{ padding: 'var(--space-xl)', maxWidth: 860 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
          업데이트 {GUIDE_UPDATED} · Jipyo 편집팀
        </div>

        {guide.body.map((block, i) => <Block key={i} block={block} />)}

        <div style={{ marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
            이어서 보기
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.2em', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {guide.related.map((r) => (
              <li key={r.to} style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                <Link to={r.to} style={{ color: 'var(--accent-orange)' }}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </article>

      <p style={{ maxWidth: 860, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 'var(--space-lg)' }}>
        본 콘텐츠는 투자 정보 제공을 목적으로 하며, 특정 종목의 매수·매도를 권유하지 않습니다.
        투자 판단과 그 결과의 책임은 이용자 본인에게 있습니다.
      </p>
    </>
  )
}
