import { useState } from 'react'
import { useAdminPosts, useCreatePost, useDeletePost, useUpdatePost } from '../hooks/useAdminPosts'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorFallback } from './ErrorFallback'
import { ApiError } from '../api/client'
import type { AdminPost, PostStatus } from '../types/api'

const STATUS_FILTERS: { value: PostStatus | ''; label: string }[] = [
  { value: '', label: '전체 상태' },
  { value: 'DRAFT', label: '작성 중' },
  { value: 'PUBLISHED', label: '게시됨' },
  { value: 'ARCHIVED', label: '보관됨' },
]

const STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: '작성 중',
  PUBLISHED: '게시됨',
  ARCHIVED: '보관됨',
}

const SAVE_SUCCESS: Record<PostStatus, string> = {
  DRAFT: '임시 저장되었습니다.',
  PUBLISHED: '게시되었습니다.',
  ARCHIVED: '보관 처리되었습니다.',
}

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString('ko-KR')
}

function saveErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500) {
    return error.message
  }
  return '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

// selected === 'new' → 새 글 작성, AdminPost → 기존 글 편집, null → 선택 없음
type Selection = AdminPost | 'new' | null

function PostEditor({ post, onSaved, onDeleted }: {
  post?: AdminPost
  onSaved: (post: AdminPost) => void
  onDeleted: () => void
}) {
  const isNew = !post
  const [title, setTitle] = useState(post?.title ?? '')
  const [content, setContent] = useState(post?.content ?? '')

  const createMutation = useCreatePost()
  const updateMutation = useUpdatePost()
  const deleteMutation = useDeletePost()
  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const save = (status: PostStatus) => {
    if (!title.trim()) { window.alert('제목을 입력해주세요.'); return }
    if (!content.trim()) { window.alert('내용을 입력해주세요.'); return }
    const request = { title: title.trim(), content, status }

    const onSuccess = (saved: AdminPost) => {
      window.alert(SAVE_SUCCESS[status])
      onSaved(saved)
    }
    const onError = (error: unknown) => window.alert(saveErrorMessage(error))

    if (isNew) {
      createMutation.mutate(request, { onSuccess, onError })
    } else {
      updateMutation.mutate({ id: post!.id, request }, { onSuccess, onError })
    }
  }

  const remove = () => {
    if (!post) return
    if (!window.confirm('이 게시글을 삭제할까요? 되돌릴 수 없습니다.')) return
    deleteMutation.mutate(post.id, {
      onSuccess: () => { window.alert('삭제되었습니다.'); onDeleted() },
      onError: (error) => window.alert(saveErrorMessage(error)),
    })
  }

  return (
    <div className="card" style={{ padding: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.05rem', margin: 0 }}>{isNew ? '새 글 작성' : '글 편집'}</h2>
        {!isNew && (
          <span className="badge" style={{ color: 'var(--accent-orange)' }}>{STATUS_LABELS[post!.status]}</span>
        )}
        {!isNew && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            👍 {post!.likeCount} · 👎 {post!.dislikeCount}
          </span>
        )}
      </div>

      <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
        <label className="form-label" htmlFor="post-title">제목</label>
        <input
          id="post-title"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          maxLength={500}
        />
      </div>

      <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
        <label className="form-label" htmlFor="post-content">내용</label>
        <textarea
          id="post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요. 줄바꿈은 그대로 표시됩니다."
          rows={16}
          style={{
            width: '100%',
            resize: 'vertical',
            padding: 'var(--space-md)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.7,
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn" type="button" disabled={pending} onClick={() => save('DRAFT')}>임시 저장</button>
        <button className="btn btn-primary" type="button" disabled={pending} onClick={() => save('PUBLISHED')}>게시</button>
        <button className="btn" type="button" disabled={pending} onClick={() => save('ARCHIVED')}>보관</button>
        {!isNew && (
          <button
            className="btn"
            type="button"
            disabled={pending}
            onClick={remove}
            style={{ marginLeft: 'auto', color: 'var(--color-down)', borderColor: 'var(--color-down)' }}
          >
            삭제
          </button>
        )}
      </div>
    </div>
  )
}

export function AdminPostManager() {
  const [status, setStatus] = useState<PostStatus | ''>('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Selection>('new')
  const { data, isLoading, error } = useAdminPosts(status, page)

  return (
    <>
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label className="form-label">상태</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => { setStatus(e.target.value as PostStatus | ''); setPage(0) }}
            >
              {STATUS_FILTERS.map((o) => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" type="button" style={{ marginLeft: 'auto' }} onClick={() => setSelected('new')}>
            + 새 글 작성
          </button>
        </div>
      </div>

      <div className="admin-editor-grid">
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <span className="card-title">글 목록</span>
            {data && <span className="card-subtitle">{data.totalElements.toLocaleString()}건</span>}
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorFallback message="게시글 목록을 불러오지 못했습니다" />
          ) : data?.content.length ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.content.map((post) => {
                  const active = selected !== 'new' && selected?.id === post.id
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setSelected(post)}
                      style={{
                        textAlign: 'left',
                        padding: 'var(--space-md) 0',
                        border: 'none',
                        borderBottom: '1px solid var(--border-primary)',
                        background: active ? 'var(--bg-hover)' : 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', gap: 6 }}>
                        <span>{STATUS_LABELS[post.status]}</span>
                        <span>· {formatDate(post.updatedAt)}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>{post.title}</div>
                    </button>
                  )
                })}
              </div>
              <div className="pagination">
                <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
                <span className="pagination-info">{page + 1} / {data.totalPages || 1}</span>
                <button className="btn btn-sm" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>→</button>
              </div>
            </>
          ) : (
            <div className="empty-state">작성된 글이 없습니다</div>
          )}
        </div>

        {selected === 'new' ? (
          <PostEditor
            key="new"
            onSaved={(saved) => setSelected(saved)}
            onDeleted={() => setSelected('new')}
          />
        ) : selected ? (
          <PostEditor
            key={selected.id}
            post={selected}
            onSaved={(saved) => setSelected(saved)}
            onDeleted={() => setSelected('new')}
          />
        ) : (
          <div className="card">
            <div className="empty-state">왼쪽에서 글을 선택하거나 새 글을 작성하세요</div>
          </div>
        )}
      </div>
    </>
  )
}
