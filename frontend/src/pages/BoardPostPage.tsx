import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePost, useReactToPost } from '../hooks/usePosts'
import { usePageMeta } from '../hooks/usePageMeta'
import { getVoterId } from '../lib/voterId'
import { EDITORIAL_NAME } from '../lib/site'
import { categoryLabel } from '../lib/postCategory'
import { LoadingSpinner } from '../components/LoadingSpinner'
import NotFoundPage from './NotFoundPage'
import type { ReactionType } from '../types/api'

function fmtDateTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function ReactionButton({
  active, label, emoji, count, onClick, disabled,
}: {
  active: boolean
  label: string
  emoji: string
  count: number
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${active ? 'var(--accent-orange)' : 'var(--border-primary)'}`,
        background: active ? 'var(--accent-orange-dim)' : 'transparent',
        color: active ? 'var(--accent-orange)' : 'var(--text-secondary)',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
      <span>{label}</span>
      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
    </button>
  )
}

export default function BoardPostPage() {
  const { id } = useParams<{ id: string }>()
  const postId = Number(id)
  const voterId = useMemo(() => getVoterId(), [])

  const { data: post, isLoading, error } = usePost(postId, voterId)
  const reaction = useReactToPost(postId)

  usePageMeta({
    title: post ? `${post.title} | Jipyo 게시판` : '게시글 | Jipyo (지표)',
    description: post ? post.content.replace(/\s+/g, ' ').trim().slice(0, 140) : undefined,
    path: Number.isFinite(postId) && postId > 0 ? `/board/${postId}` : undefined,
  })

  if (isLoading) return <LoadingSpinner message="게시글 로딩 중..." />
  if (error || !post) return <NotFoundPage />

  const react = (type: ReactionType) => {
    if (reaction.isPending) return
    reaction.mutate({ type, voterId })
  }

  return (
    <>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
        <Link to="/board" style={{ color: 'var(--text-secondary)' }}>게시판</Link>
        <span style={{ opacity: 0.4 }}> / </span>
        <span>글 보기</span>
      </div>

      <div className="page-header">
        <h1 className="page-title" style={{ lineHeight: 1.4 }}>{post.title}</h1>
        <p className="page-subtitle" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="badge" style={{ color: 'var(--accent-orange)', borderColor: 'var(--accent-orange-dim)' }}>
            {categoryLabel(post.category)}
          </span>
          <span>{fmtDateTime(post.publishedAt)}</span>
          {/* authorName(계정 username) 대신 편집 주체 고정 — 사유는 lib/site.ts 참고 */}
          <span>· {EDITORIAL_NAME}</span>
        </p>
      </div>

      <article className="card" style={{ padding: 'var(--space-xl)', maxWidth: 860 }}>
        <div style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: 'var(--text-secondary)',
          fontSize: '0.92rem',
          lineHeight: 1.9,
        }}>
          {post.content}
        </div>

        <div style={{
          marginTop: 'var(--space-2xl)',
          paddingTop: 'var(--space-lg)',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <ReactionButton
            active={post.myReaction === 'LIKE'}
            label="따봉"
            emoji="👍"
            count={post.likeCount}
            onClick={() => react('LIKE')}
            disabled={reaction.isPending}
          />
          <ReactionButton
            active={post.myReaction === 'DISLIKE'}
            label="비추"
            emoji="👎"
            count={post.dislikeCount}
            onClick={() => react('DISLIKE')}
            disabled={reaction.isPending}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 4 }}>
            로그인 없이 누를 수 있어요 · 다시 누르면 취소됩니다
          </span>
        </div>
      </article>
    </>
  )
}
