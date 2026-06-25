import { useState, useEffect } from 'react'
import { useBriefingDates, useBriefingsByDate } from '../hooks/useBriefings'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'
import type { PolicyBriefing } from '../types/api'

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
            Jipyo 해설
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const apiMinistry = ministry === '전체' ? '' : ministry

  const { data: dates } = useBriefingDates(apiMinistry)
  const { data: articles, isLoading, error } = useBriefingsByDate(apiMinistry, selectedDate)

  // 날짜 목록이 로드되면(또는 부처 변경 시) 가장 최근 날짜를 기본 선택
  useEffect(() => {
    if (!dates) return
    if (dates.length === 0) {
      setSelectedDate(null)
    } else if (!selectedDate || !dates.some((d) => d.date === selectedDate)) {
      setSelectedDate(dates[0].date)
    }
  }, [dates, selectedDate])

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

      {/* 날짜 탭 (가로 스크롤) */}
      {dates && dates.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {dates.map((d) => {
              const active = d.date === selectedDate
              return (
                <button
                  key={d.date}
                  className="btn btn-sm"
                  onClick={() => setSelectedDate(d.date)}
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
            })}
          </div>
        </div>
      )}

      {/* 선택한 날짜의 소식 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {selectedDate ? `${fmtTabDate(selectedDate)} 경제 소식` : '경제 소식'}
          </span>
          {articles && (
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              총 <strong style={{ color: 'var(--accent-orange)' }}>{articles.length}</strong>건
            </span>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorFallback />
        ) : articles && articles.length ? (
          <div>
            {articles.map((b) => <BriefingArticle key={b.id} b={b} />)}
          </div>
        ) : (
          <div className="empty-state">표시할 소식이 없습니다</div>
        )}
      </div>
    </>
  )
}
