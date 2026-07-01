import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminBriefings, useUpdateBriefingEditorial } from '../hooks/useAdminBriefings'
import { useCurrentUser, useLogout } from '../hooks/useAuth'
import { useNoIndex } from '../hooks/useNoIndex'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'
import { AdminPostManager } from '../components/AdminPostManager'
import { ApiError } from '../api/client'
import type {
  AdminPolicyBriefing,
  EditorialStatus,
  UpdateBriefingEditorialRequest,
} from '../types/api'

const MINISTRIES = ['', '기획재정부', '금융위원회', '관세청']
const STATUSES: { value: EditorialStatus | ''; label: string }[] = [
  { value: '', label: '전체 상태' },
  { value: 'COLLECTED', label: '수집됨' },
  { value: 'DRAFT', label: '작성 중' },
  { value: 'PUBLISHED', label: '게시됨' },
  { value: 'ARCHIVED', label: '보관됨' },
]

const STATUS_LABELS: Record<EditorialStatus, string> = {
  COLLECTED: '수집됨',
  DRAFT: '작성 중',
  PUBLISHED: '게시됨',
  ARCHIVED: '보관됨',
}

// 저장 작업별 성공 알림 문구
const SAVE_SUCCESS_MESSAGES: Record<EditorialStatus, string> = {
  COLLECTED: '저장되었습니다.',
  DRAFT: '임시 저장되었습니다.',
  PUBLISHED: '요약이 게시되었습니다.',
  ARCHIVED: '보관 처리되었습니다.',
}

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString('ko-KR')
}

// 저장 실패 메시지 — 4xx(검증 실패 등)는 서버가 준 구체 사유를 그대로,
// 그 외(네트워크·5xx)는 재시도 안내를 보여준다.
function saveErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500) {
    return error.message
  }
  return '등록에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

function BriefingEditor({
  briefing,
  onSaved,
}: {
  briefing: AdminPolicyBriefing
  onSaved: (briefing: AdminPolicyBriefing) => void
}) {
  const mutation = useUpdateBriefingEditorial()

  // 임시저장(DRAFT)된 글은 빈 상태로 시작하고 배너로 '불러오기'를 안내한다.
  // 그 외(게시·보관 등 기존 내용이 있는 글)는 편집을 위해 기존 내용을 그대로 채운다.
  const hasDraft =
    briefing.editorialStatus === 'DRAFT' &&
    !!(briefing.editorNote || briefing.impactTags || briefing.relatedIndicators)

  const [editorNote, setEditorNote] = useState(hasDraft ? '' : (briefing.editorNote ?? ''))
  const [impactTags, setImpactTags] = useState(hasDraft ? '' : (briefing.impactTags ?? ''))
  const [relatedIndicators, setRelatedIndicators] = useState(hasDraft ? '' : (briefing.relatedIndicators ?? ''))
  const [draftDismissed, setDraftDismissed] = useState(false)

  const restoreDraft = () => {
    setEditorNote(briefing.editorNote ?? '')
    setImpactTags(briefing.impactTags ?? '')
    setRelatedIndicators(briefing.relatedIndicators ?? '')
    setDraftDismissed(true)
  }

  const save = (status: EditorialStatus) => {
    // 게시는 Jipyo 요약(해설)이 비어 있으면 불가 — 백엔드와 동일 규칙
    if (status === 'PUBLISHED' && !editorNote.trim()) {
      window.alert('게시하려면 Jipyo 요약을 작성해주세요.')
      return
    }
    const request: UpdateBriefingEditorialRequest = {
      editorNote,
      impactTags,
      relatedIndicators,
      editorialStatus: status,
    }
    mutation.mutate(
      { id: briefing.id, request },
      {
        onSuccess: (updated) => {
          // 작성 창 초기화 (빈 상태로)
          setEditorNote('')
          setImpactTags('')
          setRelatedIndicators('')
          window.alert(SAVE_SUCCESS_MESSAGES[status])
          onSaved(updated)
        },
        onError: (error) => {
          window.alert(saveErrorMessage(error))
        },
      },
    )
  }

  return (
    <div className="card" style={{ padding: 'var(--space-xl)' }}>
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <span className="badge" style={{ color: 'var(--accent-orange)' }}>
            {briefing.ministry || '기타'}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {formatDate(briefing.publishedAt)}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            상태: {STATUS_LABELS[briefing.editorialStatus]}
          </span>
        </div>
        <h2 style={{ fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 8 }}>{briefing.title}</h2>
        <a href={briefing.link} target="_blank" rel="noopener noreferrer">
          정책브리핑 원문 열기 →
        </a>
      </div>

      <div
        style={{
          padding: 'var(--space-md)',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)',
          fontSize: '0.8rem',
          lineHeight: 1.7,
          marginBottom: 'var(--space-lg)',
          maxHeight: 180,
          overflowY: 'auto',
        }}
      >
        {briefing.summary || '원문 요약이 없습니다.'}
      </div>

      {hasDraft && !draftDismissed && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
            padding: 'var(--space-md)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--accent-orange)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-lg)',
            fontSize: '0.8rem',
          }}
        >
          <span>임시저장된 내용이 있습니다. 불러오시겠습니까?</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-primary" type="button" onClick={restoreDraft}>
              불러오기
            </button>
            <button className="btn btn-sm" type="button" onClick={() => setDraftDismissed(true)}>
              닫기
            </button>
          </span>
        </div>
      )}

      <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
        <label className="form-label" htmlFor={`editor-note-${briefing.id}`}>
          Jipyo 요약
        </label>
        <textarea
          id={`editor-note-${briefing.id}`}
          value={editorNote}
          onChange={(event) => setEditorNote(event.target.value)}
          placeholder="왜 중요한지, 영향을 받을 영역, 확인할 지표와 주의사항을 직접 작성하세요."
          rows={12}
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

      <div className="grid-2" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="form-group">
          <label className="form-label" htmlFor={`impact-tags-${briefing.id}`}>
            관련 주제·업종
          </label>
          <input
            id={`impact-tags-${briefing.id}`}
            className="form-input"
            value={impactTags}
            onChange={(event) => setImpactTags(event.target.value)}
            placeholder="예: 은행, 보험, 채권"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={`indicators-${briefing.id}`}>
            확인할 경제지표
          </label>
          <input
            id={`indicators-${briefing.id}`}
            className="form-input"
            value={relatedIndicators}
            onChange={(event) => setRelatedIndicators(event.target.value)}
            placeholder="예: 기준금리, 국고채 3년물"
          />
        </div>
      </div>

      {mutation.isError && (
        <div role="alert" style={{ color: 'var(--color-down)', marginBottom: 12 }}>
          {saveErrorMessage(mutation.error)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn" type="button" disabled={mutation.isPending} onClick={() => save('DRAFT')}>
          임시 저장
        </button>
        <button
          className="btn btn-primary"
          type="button"
          disabled={mutation.isPending || !editorNote.trim()}
          onClick={() => save('PUBLISHED')}
        >
          게시
        </button>
        <button className="btn" type="button" disabled={mutation.isPending} onClick={() => save('ARCHIVED')}>
          보관
        </button>
      </div>
    </div>
  )
}

export default function AdminPage() {
  useNoIndex('관리자 | Jipyo (지표)')

  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const logoutMutation = useLogout()
  const [tab, setTab] = useState<'briefing' | 'post'>('briefing')
  const [status, setStatus] = useState<EditorialStatus | ''>('COLLECTED')
  const [ministry, setMinistry] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<AdminPolicyBriefing | null>(null)
  const { data, isLoading, error } = useAdminBriefings(status, ministry, query, page)

  const search = (event: FormEvent) => {
    event.preventDefault()
    setPage(0)
    setQuery(searchInput.trim())
  }

  const logout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Admin</h1>
          <p className="page-subtitle">콘텐츠 검토 및 사이트 운영</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: 6 }}>{user?.username}</div>
          <button className="btn btn-sm" type="button" onClick={logout}>로그아웃</button>
        </div>
      </div>

      <div className="tab-group" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className={`tab${tab === 'briefing' ? ' active' : ''}`} onClick={() => setTab('briefing')}>경제 소식 편집</div>
        <div className={`tab${tab === 'post' ? ' active' : ''}`} onClick={() => setTab('post')}>게시글 작성</div>
      </div>

      {tab === 'post' && <AdminPostManager />}

      {tab === 'briefing' && (
      <>
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <form onSubmit={search} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label className="form-label">상태</label>
            <select
              className="form-select"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as EditorialStatus | '')
                setPage(0)
                setSelected(null)
              }}
            >
              {STATUSES.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">부처</label>
            <select
              className="form-select"
              value={ministry}
              onChange={(event) => {
                setMinistry(event.target.value)
                setPage(0)
                setSelected(null)
              }}
            >
              {MINISTRIES.map((value) => (
                <option key={value || 'all'} value={value}>{value || '전체 부처'}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ flex: '1 1 240px' }}>
            <label className="form-label" htmlFor="admin-briefing-search">기사 검색</label>
            <input
              id="admin-briefing-search"
              className="form-input"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="제목 검색"
            />
          </div>
          <button className="btn btn-primary" type="submit">검색</button>
        </form>
      </div>

      <div className="admin-editor-grid">
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <span className="card-title">기사 목록</span>
            {data && <span className="card-subtitle">{data.totalElements.toLocaleString()}건</span>}
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorFallback message="기사 목록을 불러오지 못했습니다" />
          ) : data?.content.length ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.content.map((briefing) => (
                  <button
                    key={briefing.id}
                    type="button"
                    onClick={() => setSelected(briefing)}
                    style={{
                      textAlign: 'left',
                      padding: 'var(--space-md) 0',
                      border: 'none',
                      borderBottom: '1px solid var(--border-primary)',
                      background: selected?.id === briefing.id ? 'var(--bg-hover)' : 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      {briefing.ministry} · {formatDate(briefing.publishedAt)}
                    </div>
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>{briefing.title}</div>
                  </button>
                ))}
              </div>
              <div className="pagination">
                <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
                <span className="pagination-info">{page + 1} / {data.totalPages || 1}</span>
                <button
                  className="btn btn-sm"
                  disabled={page + 1 >= data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  →
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">조건에 맞는 기사가 없습니다</div>
          )}
        </div>

        {selected ? (
          <BriefingEditor
            key={selected.id}
            briefing={selected}
            onSaved={(updated) => setSelected(updated)}
          />
        ) : (
          <div className="card">
            <div className="empty-state">왼쪽 목록에서 편집할 기사를 선택하세요</div>
          </div>
        )}
      </div>
      </>
      )}
    </>
  )
}
