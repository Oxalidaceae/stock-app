import { useState } from 'react'
import { useAdminGuides, useCreateGuide, useDeleteGuide, useUpdateGuide } from '../hooks/useAdminGuides'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorFallback } from './ErrorFallback'
import { ApiError } from '../api/client'
import type { AdminGuide, PostStatus } from '../types/api'

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

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

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

type Selection = AdminGuide | 'new' | null

function GuideEditor({ guide, onSaved, onDeleted }: {
  guide?: AdminGuide
  onSaved: (guide: AdminGuide) => void
  onDeleted: () => void
}) {
  const isNew = !guide
  const [slug, setSlug] = useState(guide?.slug ?? '')
  const [title, setTitle] = useState(guide?.title ?? '')
  const [tag, setTag] = useState(guide?.tag ?? '')
  const [summary, setSummary] = useState(guide?.summary ?? '')
  const [content, setContent] = useState(guide?.content ?? '')

  const createMutation = useCreateGuide()
  const updateMutation = useUpdateGuide()
  const deleteMutation = useDeleteGuide()
  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const save = (status: PostStatus) => {
    if (!slug.trim()) { window.alert('slug 를 입력해주세요.'); return }
    if (!SLUG_RE.test(slug.trim())) { window.alert('slug 는 영소문자·숫자·하이픈만 사용할 수 있습니다. (예: per-pbr-valuation)'); return }
    if (!title.trim()) { window.alert('제목을 입력해주세요.'); return }
    if (!content.trim()) { window.alert('내용을 입력해주세요.'); return }
    const request = { slug: slug.trim(), title: title.trim(), summary, tag, content, status }

    const onSuccess = (saved: AdminGuide) => { window.alert(SAVE_SUCCESS[status]); onSaved(saved) }
    const onError = (error: unknown) => window.alert(saveErrorMessage(error))

    if (isNew) createMutation.mutate(request, { onSuccess, onError })
    else updateMutation.mutate({ id: guide!.id, request }, { onSuccess, onError })
  }

  const remove = () => {
    if (!guide) return
    if (!window.confirm('이 가이드를 삭제할까요? 되돌릴 수 없습니다.')) return
    deleteMutation.mutate(guide.id, {
      onSuccess: () => { window.alert('삭제되었습니다.'); onDeleted() },
      onError: (error) => window.alert(saveErrorMessage(error)),
    })
  }

  return (
    <div className="card" style={{ padding: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.05rem', margin: 0 }}>{isNew ? '새 가이드 작성' : '가이드 편집'}</h2>
        {!isNew && <span className="badge" style={{ color: 'var(--accent-orange)' }}>{STATUS_LABELS[guide!.status]}</span>}
      </div>

      <div className="grid-2" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="guide-slug">slug (URL)</label>
          <input id="guide-slug" className="form-input" value={slug} onChange={(e) => setSlug(e.target.value)}
            placeholder="per-pbr-valuation" maxLength={200} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="guide-tag">분류 (선택)</label>
          <input id="guide-tag" className="form-input" value={tag} onChange={(e) => setTag(e.target.value)}
            placeholder="예: 밸류에이션" maxLength={100} />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
        <label className="form-label" htmlFor="guide-title">제목</label>
        <input id="guide-title" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요" maxLength={500} />
      </div>

      <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
        <label className="form-label" htmlFor="guide-summary">요약 (검색 설명·목록 노출, 선택)</label>
        <textarea id="guide-summary" value={summary} onChange={(e) => setSummary(e.target.value)}
          placeholder="한두 문장으로 이 글을 요약하세요 (검색 결과·목록에 노출)"
          rows={2}
          style={{ width: '100%', resize: 'vertical', padding: 'var(--space-md)', background: 'var(--bg-input)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }} />
      </div>

      <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
        <label className="form-label" htmlFor="guide-content">내용 (마크다운)</label>
        <textarea id="guide-content" value={content} onChange={(e) => setContent(e.target.value)}
          placeholder={'## 소제목\n\n문단을 씁니다.\n\n- 목록 항목\n\n> 강조 박스\n\n[링크 텍스트](/guide/다른-글)'}
          rows={20}
          style={{ width: '100%', resize: 'vertical', padding: 'var(--space-md)', background: 'var(--bg-input)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.7 }} />
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6 }}>
          마크다운: <code>## 소제목</code> · <code>- 목록</code> · <code>&gt; 강조</code> · <code>**굵게**</code> · <code>[텍스트](주소)</code>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn" type="button" disabled={pending} onClick={() => save('DRAFT')}>임시 저장</button>
        <button className="btn btn-primary" type="button" disabled={pending} onClick={() => save('PUBLISHED')}>게시</button>
        <button className="btn" type="button" disabled={pending} onClick={() => save('ARCHIVED')}>보관</button>
        {!isNew && (
          <button className="btn" type="button" disabled={pending} onClick={remove}
            style={{ marginLeft: 'auto', color: 'var(--color-down)', borderColor: 'var(--color-down)' }}>삭제</button>
        )}
      </div>
    </div>
  )
}

export function AdminGuideManager() {
  const [status, setStatus] = useState<PostStatus | ''>('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Selection>('new')
  const { data, isLoading, error } = useAdminGuides(status, page)

  return (
    <>
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label className="form-label">상태</label>
            <select className="form-select" value={status}
              onChange={(e) => { setStatus(e.target.value as PostStatus | ''); setPage(0) }}>
              {STATUS_FILTERS.map((o) => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" type="button" style={{ marginLeft: 'auto' }} onClick={() => setSelected('new')}>
            + 새 가이드 작성
          </button>
        </div>
      </div>

      <div className="admin-editor-grid">
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <span className="card-title">가이드 목록</span>
            {data && <span className="card-subtitle">{data.totalElements.toLocaleString()}건</span>}
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorFallback message="가이드 목록을 불러오지 못했습니다" />
          ) : data?.content.length ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.content.map((guide) => {
                  const active = selected !== 'new' && selected?.id === guide.id
                  return (
                    <button key={guide.id} type="button" onClick={() => setSelected(guide)}
                      style={{ textAlign: 'left', padding: 'var(--space-md) 0', border: 'none', borderBottom: '1px solid var(--border-primary)', background: active ? 'var(--bg-hover)' : 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', gap: 6 }}>
                        <span>{STATUS_LABELS[guide.status]}</span>
                        <span>· {guide.tag || '분류 없음'}</span>
                        <span>· {formatDate(guide.updatedAt)}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>{guide.title}</div>
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
            <div className="empty-state">작성된 가이드가 없습니다</div>
          )}
        </div>

        {selected === 'new' ? (
          <GuideEditor key="new" onSaved={(saved) => setSelected(saved)} onDeleted={() => setSelected('new')} />
        ) : selected ? (
          <GuideEditor key={selected.id} guide={selected} onSaved={(saved) => setSelected(saved)} onDeleted={() => setSelected('new')} />
        ) : (
          <div className="card"><div className="empty-state">왼쪽에서 가이드를 선택하거나 새로 작성하세요</div></div>
        )}
      </div>
    </>
  )
}
