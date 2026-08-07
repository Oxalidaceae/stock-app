import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePosts } from '../hooks/usePosts'
import { usePageMeta } from '../hooks/usePageMeta'
import { EDITORIAL_NAME } from '../lib/site'
import { CATEGORY_LABELS, CATEGORY_ORDER, categoryLabel } from '../lib/postCategory'
import type { PostCategory } from '../types/api'
import { PageIntro } from '../components/PageIntro'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function BoardPage() {
  usePageMeta({
    title: '게시판 — Jipyo 소식과 이야기 | Jipyo (지표)',
    description: 'Jipyo 운영진이 전하는 공지, 업데이트 소식과 투자 관련 이야기를 모은 게시판입니다.',
    path: '/board',
  })

  // '' = 전체 분류
  const [category, setCategory] = useState<PostCategory | ''>('')
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = usePosts(page, category || undefined)
  const posts = data?.content

  const selectCategory = (next: PostCategory | '') => {
    setCategory(next)
    setPage(0)   // 분류를 바꾸면 페이지 수가 달라지므로 첫 장으로
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">게시판</h1>
        <p className="page-subtitle">Jipyo 운영진이 전하는 공지·업데이트·이야기</p>
      </div>

      <PageIntro>
        Jipyo의 공지와 서비스 업데이트, 그리고 데이터를 다루며 얻은 생각을 자유롭게 남기는 공간입니다.
        각 글에는 로그인 없이 따봉(추천)·비추(비추천)로 의견을 표시할 수 있습니다.
      </PageIntro>

      {/* 분류 필터 */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {([''] as (PostCategory | '')[]).concat(CATEGORY_ORDER).map((value) => {
            const active = category === value
            return (
              <button
                key={value || 'ALL'}
                className="btn btn-sm"
                onClick={() => selectCategory(value)}
                style={{
                  background: active ? 'var(--accent-orange-dim)' : undefined,
                  color: active ? 'var(--accent-orange)' : undefined,
                  borderColor: active ? 'var(--accent-orange)' : undefined,
                }}
              >
                {value ? CATEGORY_LABELS[value] : '전체'}
              </button>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">글 목록</span>
          {data && <span className="card-subtitle">{data.totalElements.toLocaleString()}건</span>}
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorFallback message="게시글을 불러오지 못했습니다" />
        ) : posts && posts.length ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to={`/board/${p.id}`}
                  style={{
                    display: 'block',
                    padding: 'var(--space-md) 0',
                    borderBottom: '1px solid var(--border-primary)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge" style={{ color: 'var(--accent-orange)', borderColor: 'var(--accent-orange-dim)' }}>
                      {categoryLabel(p.category)}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>
                    {p.excerpt}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.7rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                    <span>{fmtDate(p.publishedAt)}</span>
                    {/* authorName(계정 username) 대신 편집 주체 고정 — 사유는 lib/site.ts 참고 */}
                    <span>· {EDITORIAL_NAME}</span>
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                      <span>👍 {p.likeCount}</span>
                      <span>👎 {p.dislikeCount}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {data && data.totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
                <span className="pagination-info">{page + 1} / {data.totalPages}</span>
                <button className="btn btn-sm" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>→</button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            {category ? `'${CATEGORY_LABELS[category]}' 분류에 글이 없습니다` : '아직 게시된 글이 없습니다'}
          </div>
        )}
      </div>
    </>
  )
}
