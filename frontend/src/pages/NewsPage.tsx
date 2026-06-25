import { useState, useEffect, useMemo, useRef, Fragment } from 'react'
import { useBriefingDates, useBriefings } from '../hooks/useBriefings'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'
import type { PolicyBriefing, BriefingDate } from '../types/api'

// 수집 대상 부처 (collector POLICY_BRIEFING_FEEDS 와 일치)
const MINISTRIES = ['전체', '기획재정부', '금융위원회', '관세청']
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function fmtDateTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

// 'YYYY-MM-DD' → 'MM.DD (요일)'
function fmtTabDate(date: string): string {
  const d = new Date(date + 'T00:00:00')
  if (isNaN(d.getTime())) return date
  return `${date.slice(5).replace('-', '.')} (${WEEKDAYS[d.getDay()]})`
}

function splitLabels(value: string | null): string[] {
  return value
    ? value.split(',').map((item) => item.trim()).filter(Boolean)
    : []
}

function DateChip({ d, active, onSelect }: { d: BriefingDate; active: boolean; onSelect: (date: string) => void }) {
  return (
    <button
      className="btn btn-sm"
      onClick={() => onSelect(d.date)}
      title={active ? '다시 누르면 필터 해제' : undefined}
      style={{
        flex: '0 0 auto',
        whiteSpace: 'nowrap',
        background: active ? 'var(--accent-orange-dim)' : undefined,
        color: active ? 'var(--accent-orange)' : undefined,
        borderColor: active ? 'var(--accent-orange)' : undefined,
      }}
    >
      {fmtTabDate(d.date)}
      <span style={{ marginLeft: 5, color: 'var(--text-muted)', fontSize: '0.7rem' }}>{d.count}</span>
    </button>
  )
}

function BriefingArticle({ b }: { b: PolicyBriefing }) {
  const impactTags = splitLabels(b.impactTags)
  const indicators = splitLabels(b.relatedIndicators)
  return (
    <article
      style={{
        display: 'block',
        padding: 'var(--space-md) 0',
        borderBottom: '1px solid var(--border-primary)',
      }}
    >
      <a href={b.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="badge" style={{ color: 'var(--accent-orange)', borderColor: 'var(--accent-orange-dim)' }}>
            {b.ministry || '기타'}
          </span>
          {b.editorNote && (
            <span className="badge" style={{
              color: 'var(--accent-orange)',
              background: 'var(--accent-orange-dim)',
              borderColor: 'var(--accent-orange)',
            }}>
              요약
            </span>
          )}
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{fmtDateTime(b.publishedAt)}</span>
        </div>
        <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>
          {b.title}
        </div>
        {b.summary && (
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {b.summary}
          </div>
        )}
      </a>

      {b.editorNote && (
        <div
          style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md)',
            borderLeft: '3px solid var(--accent-orange)',
            background: 'var(--bg-tertiary)',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--accent-orange)', marginBottom: 6 }}>
            Jipyo 요약
          </div>
          <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.75 }}>
            {b.editorNote}
          </div>
          {(impactTags.length > 0 || indicators.length > 0) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {impactTags.map((tag, index) => (
                <span key={`impact-${index}-${tag}`} className="badge">주제: {tag}</span>
              ))}
              {indicators.map((indicator, index) => (
                <span key={`indicator-${index}-${indicator}`} className="badge">지표: {indicator}</span>
              ))}
            </div>
          )}
          {b.reviewedAt && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: 8 }}>
              검토: {fmtDateTime(b.reviewedAt)}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export default function NewsPage() {
  const [ministry, setMinistry] = useState('전체')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)  // null = 전체(최근순)
  const [curatedOnly, setCuratedOnly] = useState(false)                   // 요약(게시)만 보기
  const [page, setPage] = useState(0)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const apiMinistry = ministry === '전체' ? '' : ministry

  // 요약만 보기일 땐 날짜 필터를 적용하지 않고 전체 요약을 최근순으로
  const effectiveDate = curatedOnly ? null : selectedDate

  const { data: dates } = useBriefingDates(apiMinistry)
  const { data, isLoading, error } = useBriefings(apiMinistry, effectiveDate, curatedOnly, page)

  // 날짜를 월(YYYY-MM)로 묶음 — 최신 월이 맨 앞 (백엔드가 최신순 반환)
  const monthGroups = useMemo(() => {
    const map = new Map<string, BriefingDate[]>()
    for (const d of dates ?? []) {
      const month = d.date.slice(0, 7)
      const list = map.get(month) ?? []
      list.push(d)
      map.set(month, list)
    }
    return Array.from(map.entries()).map(([month, days]) => ({ month, days }))
  }, [dates])

  // 가장 최근 월은 항상 개별 날짜로 펼쳐 둔다
  const currentMonth = monthGroups[0]?.month

  // 부처가 바뀌면 그 부처의 가장 최근 날짜로 1회 기본 선택 (이후 사용자의 해제/선택은 유지)
  const defaultedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!dates) return
    if (defaultedFor.current !== ministry) {
      defaultedFor.current = ministry
      setSelectedDate(dates.length > 0 ? dates[0].date : null)
      setPage(0)
    }
  }, [dates, ministry])

  const selectDate = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date))  // 같은 날짜 재클릭 → 해제(전체)
    setPage(0)
  }

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(month)) next.delete(month)
      else next.add(month)
      return next
    })
  }

  const toggleCurated = () => {
    setCuratedOnly((v) => !v)
    setPage(0)
  }

  const articles = data?.content

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">경제 소식</h1>
        <p className="page-subtitle">기획재정부·금융위원회·관세청 정책 발표 — 정책브리핑</p>
      </div>

      {/* 부처 필터 + 출처 */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {MINISTRIES.map((m) => {
            const active = ministry === m
            return (
              <button
                key={m}
                className="btn btn-sm"
                onClick={() => setMinistry(m)}
                style={{
                  background: active ? 'var(--accent-orange-dim)' : undefined,
                  color: active ? 'var(--accent-orange)' : undefined,
                  borderColor: active ? 'var(--accent-orange)' : undefined,
                }}
              >
                {m}
              </button>
            )
          })}
          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            출처: 대한민국 정책브리핑 (공공누리 제1유형)
          </span>
        </div>
      </div>

      {/* 날짜 탭 — 요약만 보기일 땐 숨김. 이번 달은 개별 날짜, 이전 달은 접힌 월(클릭 시 펼침) */}
      {!curatedOnly && monthGroups.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {monthGroups.map((g) => {
              const dayChips = g.days.map((d) => (
                <DateChip key={d.date} d={d} active={d.date === selectedDate} onSelect={selectDate} />
              ))

              // 최신 월 → 개별 날짜만
              if (g.month === currentMonth) return dayChips

              // 이전 월 → 접기/펼치기 토글
              const expanded = expandedMonths.has(g.month)
              const monthTotal = g.days.reduce((sum, d) => sum + d.count, 0)
              return (
                <Fragment key={g.month}>
                  <button
                    className="btn btn-sm"
                    onClick={() => toggleMonth(g.month)}
                    style={{
                      flex: '0 0 auto',
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      background: expanded ? 'var(--bg-tertiary)' : undefined,
                    }}
                  >
                    {g.month.replace('-', '.')} {expanded ? '▾' : '▸'}
                    {!expanded && (
                      <span style={{ marginLeft: 5, color: 'var(--text-muted)', fontSize: '0.7rem' }}>{monthTotal}</span>
                    )}
                  </button>
                  {expanded && dayChips}
                </Fragment>
              )
            })}
          </div>
        </div>
      )}

      {/* 소식 목록 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {curatedOnly
              ? 'Jipyo 요약'
              : selectedDate
                ? `${fmtTabDate(selectedDate)} 경제 소식`
                : '전체 소식 · 최근순'}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <button
              className="btn btn-sm"
              onClick={toggleCurated}
              style={{
                background: curatedOnly ? 'var(--accent-orange-dim)' : undefined,
                color: curatedOnly ? 'var(--accent-orange)' : undefined,
                borderColor: curatedOnly ? 'var(--accent-orange)' : undefined,
              }}
            >
              요약만 보기
            </button>
            {data && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                총 <strong style={{ color: 'var(--accent-orange)' }}>{data.totalElements.toLocaleString()}</strong>건
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorFallback />
        ) : articles && articles.length ? (
          <>
            <div>
              {articles.map((b) => <BriefingArticle key={b.id} b={b} />)}
            </div>

            {data && data.totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
                <span className="pagination-info">{page + 1} / {data.totalPages}</span>
                <button
                  className="btn btn-sm"
                  disabled={page + 1 >= data.totalPages}
                  onClick={() => setPage(page + 1)}
                >→</button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            {curatedOnly ? '아직 게시된 요약이 없습니다' : '표시할 소식이 없습니다'}
          </div>
        )}
      </div>
    </>
  )
}
